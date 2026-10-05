import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";
import { normalizeValue, stableStringify } from "./normalization.js";
import type {
  FieldViolation,
  NewOrchestration,
  OrchestrationInput,
  OrchestrationRepository,
  OrchestrationResponse,
  OrchestrationState,
  OrchestrationTask,
  PersistedOrchestration,
  PersistedOrchestrationState,
} from "./types.js";

const REQUIRED_FIELDS = ["request_id", "plan_id", "tasks"] as const;
const REVIEW_REASON = "HIGH_IMPACT_REVIEW_REQUIRED";
const ACTION_PATTERN = /\b(deploy(?:s|ed|ing|ments?)?|releas(?:e|es|ed|ing)|roll(?:s|ed|ing)\s?out|rollouts?|rollback(?:s|ed|ing)?|roll(?:s|ed|ing)?[\s-]+back|migrat(?:e|es|ed|ing|ion(?:s)?)|restart(?:s|ed|ing)?|shut(?:s|ting)?(?:[ -]+)?down(?:s)?|scale(?:s|d|ing)?|modif(?:y|ies|ied|ying)|chang(?:e|es|ed|ing)|mutat(?:e|es|ed|ing|ion(?:s)?)|updat(?:e|es|ed|ing)|delet(?:e|es|ed|ing|ion(?:s)?)|remov(?:e|es|ed|ing|al(?:s)?)|drop(?:s|ped|ping)?|truncat(?:e|es|ed|ing)|eras(?:e|es|ed|ing|ure(?:s)?)|wip(?:e|es|ed|ing)|destroy(?:s|ed|ing)|purge(?:s|d|ing)|overwrit(?:e|es|ing|ten)|overwrote|destructive)\b/gi;
const DESTRUCTIVE_PATTERN = /^(?:delet(?:e|es|ed|ing|ion(?:s)?)|remov(?:e|es|ed|ing|al(?:s)?)|drop(?:s|ped|ping)?|truncat(?:e|es|ed|ing)|eras(?:e|es|ed|ing|ure(?:s)?)|wip(?:e|es|ed|ing)|destroy(?:s|ed|ing)|purge(?:s|d|ing)|destructive)$/i;
const PRODUCTION_PATTERN = /\b(?:prod|production)\b/i;
const PROMOTION_PATTERN = /\bpromot(?:e|es|ed|ing|ion(?:s)?)\b/gi;
const NEGATION_AT_END = /\b(?:no|not|never|without|avoid|prevent|prohibit|forbid|do\s+not|don't|mustn't|must\s+not|shouldn't|should\s+not|cannot|can't|will\s+not|won't)\b(?:\s+\w+){0,3}\s*$/i;
const CONTRASTIVE_CLAUSE_BOUNDARY = /\b(?:but|however|yet|instead)\b/gi;

const schemaPath = fileURLToPath(
  new URL("../../../workflows/WF-03-orchestration/schema.json", import.meta.url),
);
const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as AnySchema;
const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

export interface OrchestrationServiceOptions {
  clock?: () => Date;
  idGenerator?: () => string;
}

interface OrchestrationDecision {
  state: PersistedOrchestrationState;
  execution_order: string[];
  blocked_task_ids: string[];
  reason_codes: string[];
  validation_errors?: FieldViolation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringFieldOf(value: unknown, field: string): string | null {
  if (!isRecord(value)) return null;
  return typeof value[field] === "string" ? value[field] as string : null;
}

function responseBase(
  correlationId: string,
  requestId: string | null,
  planId: string | null,
  state: OrchestrationState,
  reasonCodes: string[],
  createdAt: string,
  details: Partial<OrchestrationResponse> = {},
): OrchestrationResponse {
  return {
    correlation_id: correlationId,
    request_id: requestId,
    plan_id: planId,
    state,
    execution_order: [],
    blocked_task_ids: [],
    reason_codes: reasonCodes,
    created_at: createdAt,
    ...details,
  };
}

function missingRequiredFields(input: Record<string, unknown>): string[] {
  return REQUIRED_FIELDS.filter((field) =>
    !(field in input) ||
    input[field] === null ||
    (typeof input[field] === "string" && input[field].length === 0) ||
    (field === "tasks" && Array.isArray(input[field]) && input[field].length === 0),
  );
}

function compareTaskIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort(compareTaskIds);
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort(compareTaskIds);
}

function isNegatedAction(segment: string, actionIndex: number): boolean {
  const precedingText = segment.slice(Math.max(0, actionIndex - 90), actionIndex);
  let clauseStart = 0;
  // A contrastive clause can introduce a separate positive action.
  for (const match of precedingText.matchAll(CONTRASTIVE_CLAUSE_BOUNDARY)) {
    clauseStart = (match.index ?? 0) + match[0].length;
  }
  return NEGATION_AT_END.test(precedingText.slice(clauseStart));
}

function hasHighImpactIntent(task: OrchestrationTask): boolean {
  if (task.environment === "prod" || task.risk === "high" || task.risk === "critical") {
    return true;
  }

  for (const text of [task.title, task.action ?? ""]) {
    for (const segment of text.split(/[.!?\n]+/)) {
      PROMOTION_PATTERN.lastIndex = 0;
      for (const match of segment.matchAll(PROMOTION_PATTERN)) {
        const index = match.index ?? 0;
        if (!isNegatedAction(segment, index) && PRODUCTION_PATTERN.test(segment)) return true;
      }

      ACTION_PATTERN.lastIndex = 0;
      for (const match of segment.matchAll(ACTION_PATTERN)) {
        const action = match[0];
        const index = match.index ?? 0;
        if (isNegatedAction(segment, index)) continue;
        if (DESTRUCTIVE_PATTERN.test(action)) return true;
        if (PRODUCTION_PATTERN.test(segment)) return true;
      }
    }
  }

  return false;
}

function dependencyErrors(input: OrchestrationInput, taskIds: Set<string>): FieldViolation[] {
  const errors: FieldViolation[] = [];
  input.tasks.forEach((task, taskIndex) => {
    (task.depends_on ?? []).forEach((dependencyId, dependencyIndex) => {
      if (!taskIds.has(dependencyId)) {
        errors.push({
          path: `/tasks/${taskIndex}/depends_on/${dependencyIndex}`,
          message: `unknown dependency task_id: ${dependencyId}`,
        });
      }
    });
  });
  return errors;
}

function topologicalOrder(input: OrchestrationInput): string[] {
  const taskIds = input.tasks.map((task) => task.task_id);
  const indegree = new Map(taskIds.map((taskId) => [taskId, 0]));
  const dependents = new Map(taskIds.map((taskId) => [taskId, [] as string[]]));

  for (const task of input.tasks) {
    for (const dependencyId of task.depends_on ?? []) {
      indegree.set(task.task_id, (indegree.get(task.task_id) ?? 0) + 1);
      dependents.get(dependencyId)?.push(task.task_id);
    }
  }

  const ready = taskIds.filter((taskId) => indegree.get(taskId) === 0).sort(compareTaskIds);
  const order: string[] = [];
  while (ready.length > 0) {
    const taskId = ready.shift();
    if (taskId === undefined) break;
    order.push(taskId);

    for (const dependentId of dependents.get(taskId) ?? []) {
      const nextIndegree = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, nextIndegree);
      if (nextIndegree === 0) {
        ready.push(dependentId);
        ready.sort(compareTaskIds);
      }
    }
  }

  return order;
}

function analyze(input: OrchestrationInput): OrchestrationDecision {
  const taskIds = input.tasks.map((task) => task.task_id);
  const uniqueTaskIds = sortedUnique(taskIds);
  const repeatedTaskIds = duplicateValues(taskIds);
  if (repeatedTaskIds.length > 0) {
    return {
      state: "REJECTED",
      execution_order: [],
      blocked_task_ids: uniqueTaskIds,
      reason_codes: ["DUPLICATE_TASK_ID"],
      validation_errors: [{
        path: "/tasks",
        message: `task_id must be unique; repeated value(s): ${repeatedTaskIds.join(", ")}`,
      }],
    };
  }

  const knownTaskIds = new Set(taskIds);
  const unknownDependencies = dependencyErrors(input, knownTaskIds);
  if (unknownDependencies.length > 0) {
    return {
      state: "INVALID_DEPENDENCY",
      execution_order: [],
      blocked_task_ids: uniqueTaskIds,
      reason_codes: ["UNKNOWN_DEPENDENCY"],
      validation_errors: unknownDependencies,
    };
  }

  const order = topologicalOrder(input);
  if (order.length !== input.tasks.length) {
    return {
      state: "CYCLE_DETECTED",
      execution_order: [],
      blocked_task_ids: uniqueTaskIds,
      reason_codes: ["DEPENDENCY_CYCLE"],
    };
  }

  const taskRequirementIds = new Set(input.tasks.flatMap((task) => task.requirement_ids));
  const unlinkedReviewRequirements = input.review_signal.review_requirement_ids
    .filter((requirementId) => !taskRequirementIds.has(requirementId));
  if (unlinkedReviewRequirements.length > 0) {
    return {
      state: "REJECTED",
      execution_order: [],
      blocked_task_ids: uniqueTaskIds,
      reason_codes: ["UNLINKED_REVIEW_REQUIREMENT"],
      validation_errors: unlinkedReviewRequirements.map((requirementId) => ({
        path: "/review_signal/review_requirement_ids",
        message: `review requirement_id is not linked to any task: ${requirementId}`,
      })),
    };
  }

  const taskById = new Map(input.tasks.map((task) => [task.task_id, task]));
  const reviewedRequirementIds = new Set(input.review_signal.review_requirement_ids);
  const blocked = new Set(input.tasks
    .filter((task) => hasHighImpactIntent(task) ||
      task.requirement_ids.some((requirementId) => reviewedRequirementIds.has(requirementId)))
    .map((task) => task.task_id));

  // A dependent cannot become ready while a gated prerequisite remains uncompleted.
  for (const taskId of order) {
    if (blocked.has(taskId)) continue;
    const task = taskById.get(taskId);
    if (task?.depends_on?.some((dependencyId) => blocked.has(dependencyId))) {
      blocked.add(taskId);
    }
  }

  const blockedTaskIds = sortedUnique([...blocked]);
  if (blockedTaskIds.length > 0) {
    return {
      state: "APPROVAL_REQUIRED",
      execution_order: order.filter((taskId) => !blocked.has(taskId)),
      blocked_task_ids: blockedTaskIds,
      reason_codes: [REVIEW_REASON],
    };
  }

  return {
    state: "ORCHESTRATED",
    execution_order: order,
    blocked_task_ids: [],
    reason_codes: [],
  };
}

function recordResponse(
  record: PersistedOrchestration,
  correlationId: string,
  state: "ORCHESTRATED" | "INVALID_DEPENDENCY" | "CYCLE_DETECTED" | "APPROVAL_REQUIRED" | "REJECTED" | "DUPLICATE",
): OrchestrationResponse {
  return {
    correlation_id: correlationId,
    request_id: record.request_id,
    plan_id: record.plan_id,
    state,
    execution_order: [...record.execution_order],
    blocked_task_ids: [...record.blocked_task_ids],
    reason_codes: state === "DUPLICATE"
      ? ["IDEMPOTENT_REPLAY", ...record.reason_codes]
      : [...record.reason_codes],
    created_at: record.created_at,
  };
}

export class OrchestrationService {
  private readonly clock: () => Date;
  private readonly idGenerator: () => string;

  constructor(
    private readonly repository: OrchestrationRepository,
    options: OrchestrationServiceOptions = {},
  ) {
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? randomUUID;
  }

  async orchestrate(input: unknown): Promise<OrchestrationResponse> {
    const correlationId = this.idGenerator();
    const responseTime = this.clock().toISOString();

    if (!isRecord(input)) {
      return responseBase(
        correlationId,
        null,
        null,
        "REJECTED",
        ["INVALID_REQUEST_OBJECT"],
        responseTime,
      );
    }

    const normalized = normalizeValue(input) as Record<string, unknown>;
    const requestId = stringFieldOf(normalized, "request_id");
    const planId = stringFieldOf(normalized, "plan_id");
    const missingFields = missingRequiredFields(normalized);
    if (missingFields.length > 0) {
      return responseBase(
        correlationId,
        requestId,
        planId,
        "CLARIFICATION_REQUIRED",
        ["MISSING_REQUIRED_FIELDS"],
        responseTime,
        { missing_fields: missingFields },
      );
    }

    if (!validateSchema(normalized)) {
      const violations: FieldViolation[] = (validateSchema.errors ?? []).map((error) => ({
        path: error.instancePath || "/",
        message: error.message ?? "does not match the WF-03 schema",
      }));
      return responseBase(
        correlationId,
        requestId,
        planId,
        "REJECTED",
        ["INVALID_ORCHESTRATION_INPUT"],
        responseTime,
        { validation_errors: violations },
      );
    }

    const canonicalPayload = normalized as unknown as OrchestrationInput;
    if (canonicalPayload.source.request_id !== canonicalPayload.request_id) {
      return responseBase(
        correlationId,
        canonicalPayload.request_id,
        canonicalPayload.plan_id,
        "REJECTED",
        ["WF02_SOURCE_REQUEST_MISMATCH"],
        responseTime,
        {
          blocked_task_ids: sortedUnique(canonicalPayload.tasks.map((task) => task.task_id)),
          validation_errors: [{
            path: "/source/request_id",
            message: "source.request_id must match request_id",
          }],
        },
      );
    }

    const decision = analyze(canonicalPayload);
    const payloadHash = createHash("sha256")
      .update(stableStringify(canonicalPayload), "utf8")
      .digest("hex");
    const record: NewOrchestration = {
      request_id: canonicalPayload.request_id,
      plan_id: canonicalPayload.plan_id,
      canonical_payload: canonicalPayload,
      payload_hash: payloadHash,
      state: decision.state,
      execution_order: decision.execution_order,
      blocked_task_ids: decision.blocked_task_ids,
      reason_codes: decision.reason_codes,
    };

    const result = await this.repository.insertOrGet(record);
    if (result.kind === "inserted") {
      return {
        ...recordResponse(result.record, correlationId, result.record.state),
        validation_errors: decision.validation_errors,
      };
    }

    if (result.record.payload_hash === payloadHash) {
      return recordResponse(result.record, correlationId, "DUPLICATE");
    }

    return responseBase(
      correlationId,
      canonicalPayload.request_id,
      canonicalPayload.plan_id,
      "CONFLICT",
      ["PLAN_ID_PAYLOAD_MISMATCH"],
      result.record.created_at,
      { blocked_task_ids: sortedUnique(canonicalPayload.tasks.map((task) => task.task_id)) },
    );
  }
}
