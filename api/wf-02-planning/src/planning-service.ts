import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";
import { normalizeValue, stableStringify } from "./normalization.js";
import type {
  ApprovalStatus,
  FieldViolation,
  NewPlanning,
  PersistedPlanning,
  PlanningInput,
  PlanningRepository,
  PlanningRequirement,
  PlanningResponse,
  PlanningState,
  PlanningTask,
} from "./types.js";

const REQUIRED_FIELDS = ["request_id", "title", "requirements"] as const;
const REVIEW_REASON = "HIGH_IMPACT_REVIEW_REQUIRED";
const ACTION_PATTERN = /\b(deploy(?:s|ed|ing|ment)?|release(?:s|d)?|roll(?:s|ed|ing)\s?out|migrat(?:e|es|ed|ing|ion)|restart(?:s|ed|ing)?|shutdown|scale(?:s|d|ing)?|modif(?:y|ies|ied|ying)|chang(?:e|es|ed|ing)|mutat(?:e|es|ed|ing|ion)|updat(?:e|es|ed|ing)|delet(?:e|es|ed|ing|ion)|remov(?:e|es|ed|ing|al)|drop(?:s|ped|ping)?|truncat(?:e|es|ed|ing)|eras(?:e|s|ed|ing|ure)|wip(?:e|es|ed|ing)|destroy(?:s|ed|ing)|purge(?:s|d|ing)|overwrit(?:e|es|ing|ten)|destructive)\b/gi;
const DESTRUCTIVE_PATTERN = /^(?:delet(?:e|es|ed|ing|ion)|remov(?:e|es|ed|ing|al)|drop(?:s|ped|ping)?|truncat(?:e|es|ed|ing)|eras(?:e|es|ed|ing|ure)|wip(?:e|es|ed|ing)|destroy(?:s|ed|ing)|purge(?:s|d|ing)|destructive)$/i;
const PRODUCTION_PATTERN = /\b(?:prod|production)\b/i;
const PROMOTION_PATTERN = /\bpromot(?:e|es|ed|ing)\b/gi;
const NEGATION_AT_END = /\b(?:no|not|never|without|avoid|prevent|prohibit|forbid|do\s+not|don't|mustn't|must\s+not|shouldn't|should\s+not|cannot|can't|will\s+not|won't)\b(?:\s+\w+){0,3}\s*$/i;
const CONTRASTIVE_CLAUSE_BOUNDARY = /\b(?:but|however|yet|instead)\b/gi;

// Conservative high-confidence generic forms. A scoped target (for example,
// "Improve checkout API latency") or a concrete action is not rejected merely
// because it lacks a numeric target; acceptance criteria cannot rescue a title
// that is itself one of these generic forms.
const VAGUE_TASK_TITLE = /^(?:please\s+)?(?:(?:perbaiki|benahi|tingkatkan|optimalkan)\s+(?:the\s+)?(?:performa|kinerja|performance|sistem|system|aplikasi|application|app|kualitas|quality)|(?:improve|enhance|optimi[sz]e)\s+(?:the\s+)?(?:performance|system|application|app|quality|it|this|that)|fix\s+(?:the\s+)?(?:issue|bug|problem|it|this|that|things?)|make\s+(?:it|things?)\s+better)\.?$/iu;

const schemaPath = fileURLToPath(
  new URL("../../../workflows/WF-02-planning-validation/schema.json", import.meta.url),
);
const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as AnySchema;
const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

export interface PlanningServiceOptions {
  clock?: () => Date;
  idGenerator?: () => string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestIdOf(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return typeof value.request_id === "string" ? value.request_id : null;
}

function responseBase(
  correlationId: string,
  requestId: string | null,
  state: PlanningState,
  reasonCodes: string[],
  createdAt: string,
  details: Partial<PlanningResponse> = {},
): PlanningResponse {
  return {
    correlation_id: correlationId,
    request_id: requestId,
    state,
    reason_codes: reasonCodes,
    created_at: createdAt,
    human_review_required: false,
    approval_status: "not_required",
    execution_permitted: false,
    ...details,
  };
}

function missingRequiredFields(input: Record<string, unknown>): string[] {
  const missing: string[] = REQUIRED_FIELDS.filter((field) =>
    !(field in input) ||
    input[field] === null ||
    (typeof input[field] === "string" && input[field].length === 0) ||
    (field === "requirements" && Array.isArray(input[field]) && input[field].length === 0),
  );

  if (Array.isArray(input.requirements)) {
    input.requirements.forEach((requirement, index) => {
      if (!isRecord(requirement)) return;
      for (const field of ["requirement_id", "description"] as const) {
        const value = requirement[field];
        if (value === undefined || value === null || (typeof value === "string" && value.length === 0)) {
          missing.push(`requirements[${index}].${field}`);
        }
      }
    });
  }

  return missing;
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
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

function hasHighImpactIntent(input: PlanningInput & { tasks: PlanningTask[] }): boolean {
  const textFields = [
    input.title,
    ...input.requirements.flatMap((requirement) => [
      requirement.description,
      ...(requirement.acceptance_criteria ?? []),
    ]),
    ...input.tasks.map((task) => task.title),
  ];

  for (const text of textFields) {
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

function recordResponse(
  record: PersistedPlanning,
  correlationId: string,
    state: "PLANNED" | "INVALID_TASK" | "UNMAPPED_REQUIREMENTS" | "DUPLICATE",
): PlanningResponse {
  return {
    correlation_id: correlationId,
    request_id: record.request_id,
    state,
    reason_codes: state === "DUPLICATE"
      ? ["IDEMPOTENT_REPLAY", ...record.reason_codes]
      : record.reason_codes,
    created_at: record.created_at,
    human_review_required: record.human_review_required,
    approval_status: record.approval_status,
    execution_permitted: false,
    validation_errors: record.validation_errors,
    requirements: record.canonical_payload.requirements,
    tasks: record.canonical_payload.tasks,
    unmapped_requirements: record.unmapped_requirements,
  };
}

export class PlanningService {
  private readonly clock: () => Date;
  private readonly idGenerator: () => string;

  constructor(
    private readonly repository: PlanningRepository,
    options: PlanningServiceOptions = {},
  ) {
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? randomUUID;
  }

  async plan(input: unknown): Promise<PlanningResponse> {
    const correlationId = this.idGenerator();
    const responseTime = this.clock().toISOString();

    if (!isRecord(input)) {
      return responseBase(correlationId, null, "REJECTED", ["INVALID_REQUEST_OBJECT"], responseTime);
    }

    const normalized = normalizeValue(input) as Record<string, unknown>;
    const requestId = requestIdOf(normalized);
    const missingFields = missingRequiredFields(normalized);
    if (missingFields.length > 0) {
      return responseBase(
        correlationId,
        requestId,
        "CLARIFICATION_REQUIRED",
        ["MISSING_REQUIRED_FIELDS"],
        responseTime,
        { missing_fields: missingFields },
      );
    }

    if (!validateSchema(normalized)) {
      const violations: FieldViolation[] = (validateSchema.errors ?? []).map((error) => ({
        path: error.instancePath || "/",
        message: error.message ?? "does not match the WF-02 schema",
      }));
      return responseBase(
        correlationId,
        requestId,
        "REJECTED",
        ["INVALID_PLANNING_INPUT"],
        responseTime,
        { validation_errors: violations },
      );
    }

    const canonicalPayload = {
      ...(normalized as unknown as PlanningInput),
      tasks: ((normalized as unknown as PlanningInput).tasks ?? []) as PlanningTask[],
    };
    const duplicateRequirementIds = duplicateValues(
      canonicalPayload.requirements.map((requirement) => requirement.requirement_id),
    );
    if (duplicateRequirementIds.length > 0) {
      return responseBase(
        correlationId,
        requestId,
        "REJECTED",
        ["DUPLICATE_REQUIREMENT_ID"],
        responseTime,
        {
          validation_errors: duplicateRequirementIds.map((id) => ({
            path: "/requirements",
            message: `requirement_id must be unique; repeated value: ${id}`,
          })),
        },
      );
    }

    const knownRequirementIds = new Set(canonicalPayload.requirements.map((item) => item.requirement_id));
    const mappedRequirementIds = new Set<string>();
    const taskViolations: FieldViolation[] = [];
    const duplicateTaskIds = duplicateValues(canonicalPayload.tasks.map((task) => task.task_id));
    if (duplicateTaskIds.length > 0) {
      taskViolations.push({
        path: "/tasks",
        message: `task_id must be unique; repeated value(s): ${duplicateTaskIds.join(", ")}`,
      });
    }

    canonicalPayload.tasks.forEach((task, index) => {
      if (VAGUE_TASK_TITLE.test(task.title)) {
        taskViolations.push({
          path: `/tasks/${index}/title`,
          message: "task title needs a concrete, verifiable scope",
        });
      }
      for (const requirementId of task.requirement_ids) {
        if (!knownRequirementIds.has(requirementId)) {
          taskViolations.push({
            path: `/tasks/${index}/requirement_ids`,
            message: `unknown requirement_id: ${requirementId}`,
          });
        } else {
          mappedRequirementIds.add(requirementId);
        }
      }
    });

    const unmappedRequirements = canonicalPayload.requirements.filter(
      (requirement) => !mappedRequirementIds.has(requirement.requirement_id),
    );
    const humanReviewRequired = hasHighImpactIntent(canonicalPayload);
    const approvalStatus: ApprovalStatus = humanReviewRequired
      ? "pending_human_review"
      : "not_required";
    const reasonCodes: string[] = [];
    if (taskViolations.length > 0) reasonCodes.push("INVALID_TASK");
    if (unmappedRequirements.length > 0) reasonCodes.push("UNMAPPED_REQUIREMENTS");
    if (humanReviewRequired) reasonCodes.push(REVIEW_REASON);

    const state = taskViolations.length > 0
      ? "INVALID_TASK"
      : unmappedRequirements.length > 0
        ? "UNMAPPED_REQUIREMENTS"
        : "PLANNED";
    const canonicalContent = stableStringify(canonicalPayload);
    const payloadHash = createHash("sha256").update(canonicalContent, "utf8").digest("hex");
    const record: NewPlanning = {
      request_id: canonicalPayload.request_id,
      canonical_payload: canonicalPayload,
      payload_hash: payloadHash,
      state,
      reason_codes: reasonCodes,
      validation_errors: taskViolations,
      unmapped_requirements: unmappedRequirements,
      human_review_required: humanReviewRequired,
      approval_status: approvalStatus,
    };

    const result = await this.repository.insertOrGet(record);
    if (result.kind === "inserted") {
      return recordResponse(result.record, correlationId, result.record.state);
    }
    if (result.record.payload_hash === payloadHash) {
      return recordResponse(result.record, correlationId, "DUPLICATE");
    }

    return responseBase(
      correlationId,
      canonicalPayload.request_id,
      "CONFLICT",
      ["REQUEST_ID_PAYLOAD_MISMATCH", ...reasonCodes],
      result.record.created_at,
      {
        human_review_required: humanReviewRequired,
        approval_status: approvalStatus,
        requirements: canonicalPayload.requirements,
        tasks: canonicalPayload.tasks,
        unmapped_requirements: unmappedRequirements,
        validation_errors: taskViolations,
      },
    );
  }
}
