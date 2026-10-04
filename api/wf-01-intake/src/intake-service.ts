import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";
import { normalizeValue, stableStringify } from "./normalization.js";
import type {
  ApprovalStatus,
  FieldViolation,
  IntakeRepository,
  IntakeRequest,
  IntakeResponse,
  PersistedIntake,
} from "./types.js";

const REQUIRED_FIELDS = ["request_id", "title", "requester", "description"] as const;
const REVIEW_REASON = "HIGH_IMPACT_REVIEW_REQUIRED";
const ACTION_PATTERN = /\b(deploy(?:s|ed|ing|ment)?|release(?:s|d)?|roll(?:s|ed|ing)\s?out|migrat(?:e|es|ed|ing|ion)|restart(?:s|ed|ing)?|shutdown|scale(?:s|d|ing)?|modif(?:y|ies|ied|ying)|chang(?:e|es|ed|ing)|mutat(?:e|es|ed|ing|ion)|updat(?:e|es|ed|ing)|delet(?:e|es|ed|ing|ion)|drop(?:s|ped|ping)?|truncat(?:e|es|ed|ing)|eras(?:e|es|ed|ing|ure)|wip(?:e|es|ed|ing)|destroy(?:s|ed|ing)|purge(?:s|d|ing)|overwrit(?:e|es|ing|ten)|destructive)\b/gi;
const DESTRUCTIVE_PATTERN = /^(?:delet(?:e|es|ed|ing|ion)|drop(?:s|ped|ping)?|truncat(?:e|es|ed|ing)|eras(?:e|es|ed|ing|ure)|wip(?:e|es|ed|ing)|destroy(?:s|ed|ing)|purge(?:s|d|ing)|destructive)$/i;
const PRODUCTION_PATTERN = /\b(?:prod|production)\b/i;
const PROMOTION_PATTERN = /\bpromot(?:e|es|ed|ing)\b/gi;
const NEGATION_AT_END = /\b(?:no|not|never|without|avoid|prevent|prohibit|forbid|do\s+not|don't|mustn't|must\s+not|shouldn't|should\s+not|cannot|can't|will\s+not|won't)\b(?:\s+\w+){0,3}\s*$/i;

const schemaPath = fileURLToPath(
  new URL("../../../workflows/WF-01-intake/schema.json", import.meta.url),
);
const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as AnySchema;
const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

export interface IntakeServiceOptions {
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

function errorResponse(
  correlationId: string,
  requestId: string | null,
  state: "CLARIFICATION_REQUIRED" | "REJECTED",
  reasonCodes: string[],
  createdAt: string,
  details: { missing_fields?: string[]; validation_errors?: FieldViolation[] } = {},
): IntakeResponse {
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

function isNegatedAction(segment: string, actionIndex: number): boolean {
  const precedingText = segment.slice(Math.max(0, actionIndex - 90), actionIndex);
  return NEGATION_AT_END.test(precedingText);
}

function hasHighImpactIntent(request: IntakeRequest): boolean {
  const textFields = [
    request.title,
    request.description,
    ...(request.acceptance_criteria ?? []),
    ...(request.constraints ?? []),
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

function toResponse(
  record: PersistedIntake,
  correlationId: string,
  state: "ACCEPTED" | "DUPLICATE",
): IntakeResponse {
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
  };
}

export class IntakeService {
  private readonly clock: () => Date;
  private readonly idGenerator: () => string;

  constructor(
    private readonly repository: IntakeRepository,
    options: IntakeServiceOptions = {},
  ) {
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? randomUUID;
  }

  async submit(input: unknown): Promise<IntakeResponse> {
    const correlationId = this.idGenerator();
    const responseTime = this.clock().toISOString();

    if (!isRecord(input)) {
      return errorResponse(correlationId, null, "REJECTED", ["INVALID_REQUEST_OBJECT"], responseTime);
    }

    const normalized = normalizeValue(input) as Record<string, unknown>;
    const requestId = requestIdOf(normalized);
    const missingFields = REQUIRED_FIELDS.filter((field) =>
      !(field in normalized) || (typeof normalized[field] === "string" && normalized[field].length === 0),
    );

    if (missingFields.length > 0) {
      return errorResponse(
        correlationId,
        requestId,
        "CLARIFICATION_REQUIRED",
        ["MISSING_REQUIRED_FIELDS"],
        responseTime,
        { missing_fields: [...missingFields] },
      );
    }

    if (!validateSchema(normalized)) {
      const violations: FieldViolation[] = (validateSchema.errors ?? []).map((error) => ({
        path: error.instancePath || "/",
        message: error.message ?? "does not match the WF-01 schema",
      }));
      return errorResponse(
        correlationId,
        requestId,
        "REJECTED",
        ["INVALID_REQUEST"],
        responseTime,
        { validation_errors: violations },
      );
    }

    const request = normalized as unknown as IntakeRequest;
    const canonicalPayload = stableStringify(request);
    const payloadHash = createHash("sha256").update(canonicalPayload, "utf8").digest("hex");
    const humanReviewRequired = hasHighImpactIntent(request);
    const approvalStatus: ApprovalStatus = humanReviewRequired
      ? "pending_human_review"
      : "not_required";
    const reasonCodes = humanReviewRequired ? [REVIEW_REASON] : [];

    const result = await this.repository.insertOrGet({
      request_id: request.request_id,
      canonical_payload: request,
      payload_hash: payloadHash,
      human_review_required: humanReviewRequired,
      approval_status: approvalStatus,
      reason_codes: reasonCodes,
    });

    if (result.kind === "inserted") {
      return toResponse(result.record, correlationId, "ACCEPTED");
    }

    if (result.record.payload_hash === payloadHash) {
      return toResponse(result.record, correlationId, "DUPLICATE");
    }

    return {
      correlation_id: correlationId,
      request_id: request.request_id,
      state: "CONFLICT",
      reason_codes: ["REQUEST_ID_PAYLOAD_MISMATCH", ...reasonCodes],
      created_at: result.record.created_at,
      human_review_required: humanReviewRequired,
      approval_status: approvalStatus,
      execution_permitted: false,
    };
  }
}
