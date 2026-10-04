export const ORCHESTRATION_STATES = [
  "ORCHESTRATED",
  "CLARIFICATION_REQUIRED",
  "INVALID_DEPENDENCY",
  "CYCLE_DETECTED",
  "DUPLICATE",
  "CONFLICT",
  "APPROVAL_REQUIRED",
  "REJECTED",
] as const;

export type OrchestrationState = (typeof ORCHESTRATION_STATES)[number];
export type PersistedOrchestrationState =
  | "ORCHESTRATED"
  | "INVALID_DEPENDENCY"
  | "CYCLE_DETECTED"
  | "APPROVAL_REQUIRED"
  | "REJECTED";

export interface OrchestrationTask {
  task_id: string;
  title: string;
  requirement_ids: string[];
  depends_on?: string[];
  risk?: "low" | "medium" | "high" | "critical";
  environment?: "dev" | "staging" | "prod";
  action?: string;
}

export interface OrchestrationSource {
  workflow: "WF-02";
  request_id: string;
  planning_state: "PLANNED";
}

export interface UpstreamReviewSignal {
  human_review_required: boolean;
  approval_status: "not_required" | "pending_human_review";
  reason_codes: string[];
  review_requirement_ids: string[];
}

export interface OrchestrationInput {
  request_id: string;
  plan_id: string;
  source: OrchestrationSource;
  review_signal: UpstreamReviewSignal;
  tasks: OrchestrationTask[];
}

export interface FieldViolation {
  path: string;
  message: string;
}

export interface OrchestrationResponse {
  correlation_id: string;
  request_id: string | null;
  plan_id: string | null;
  state: OrchestrationState;
  execution_order: string[];
  blocked_task_ids: string[];
  reason_codes: string[];
  created_at: string;
  missing_fields?: string[];
  validation_errors?: FieldViolation[];
}

export interface PersistedOrchestration {
  request_id: string;
  plan_id: string;
  canonical_payload: OrchestrationInput;
  payload_hash: string;
  state: PersistedOrchestrationState;
  execution_order: string[];
  blocked_task_ids: string[];
  reason_codes: string[];
  created_at: string;
}

export type NewOrchestration = Omit<PersistedOrchestration, "created_at">;

export interface OrchestrationRepository {
  insertOrGet(record: NewOrchestration): Promise<{
    kind: "inserted" | "existing";
    record: PersistedOrchestration;
  }>;
}
