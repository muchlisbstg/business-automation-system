export const PLANNING_STATES = [
  "PLANNED",
  "CLARIFICATION_REQUIRED",
  "INVALID_TASK",
  "UNMAPPED_REQUIREMENTS",
  "DUPLICATE",
  "CONFLICT",
  "REJECTED",
] as const;

export type PlanningState = (typeof PLANNING_STATES)[number];
export type PersistedPlanningState =
  | "PLANNED"
  | "INVALID_TASK"
  | "UNMAPPED_REQUIREMENTS";
export type ApprovalStatus = "not_required" | "pending_human_review";

export interface PlanningRequirement {
  requirement_id: string;
  description: string;
  acceptance_criteria?: string[];
}

export interface PlanningTask {
  task_id: string;
  title: string;
  requirement_ids: string[];
}

export interface PlanningInput {
  request_id: string;
  title: string;
  requirements: PlanningRequirement[];
  tasks?: PlanningTask[];
}

export interface FieldViolation {
  path: string;
  message: string;
}

export interface PersistedPlanning {
  request_id: string;
  canonical_payload: PlanningInput & { tasks: PlanningTask[] };
  payload_hash: string;
  state: PersistedPlanningState;
  reason_codes: string[];
  validation_errors: FieldViolation[];
  unmapped_requirements: PlanningRequirement[];
  human_review_required: boolean;
  review_requirement_ids: string[];
  approval_status: ApprovalStatus;
  created_at: string;
}

export type NewPlanning = Omit<PersistedPlanning, "created_at">;

export interface PlanningRepository {
  insertOrGet(record: NewPlanning): Promise<{
    kind: "inserted" | "existing";
    record: PersistedPlanning;
  }>;
}

export interface PlanningResponse {
  correlation_id: string;
  request_id: string | null;
  state: PlanningState;
  planning_state: PersistedPlanningState | null;
  reason_codes: string[];
  created_at: string;
  human_review_required: boolean;
  review_requirement_ids: string[];
  approval_status: ApprovalStatus;
  execution_permitted: false;
  requirements?: PlanningRequirement[];
  tasks?: PlanningTask[];
  unmapped_requirements?: PlanningRequirement[];
  missing_fields?: string[];
  validation_errors?: FieldViolation[];
}
