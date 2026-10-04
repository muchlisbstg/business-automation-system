import type { Pool, QueryResultRow } from "pg";
import type {
  ApprovalStatus,
  NewPlanning,
  PersistedPlanning,
  PersistedPlanningState,
  PlanningInput,
  PlanningRepository,
  PlanningRequirement,
  PlanningTask,
} from "./types.js";

interface PlanningRow extends QueryResultRow {
  request_id: string;
  canonical_payload: PlanningInput & { tasks: PlanningTask[] };
  payload_hash: string;
  state: PersistedPlanningState;
  reason_codes: string[];
  validation_errors: PersistedPlanning["validation_errors"];
  unmapped_requirements: PlanningRequirement[];
  human_review_required: boolean;
  review_requirement_ids: string[];
  approval_status: ApprovalStatus;
  created_at: Date | string;
}

function mapRow(row: PlanningRow): PersistedPlanning {
  return {
    request_id: row.request_id,
    canonical_payload: row.canonical_payload,
    payload_hash: row.payload_hash.trim(),
    state: row.state,
    reason_codes: row.reason_codes,
    validation_errors: row.validation_errors,
    unmapped_requirements: row.unmapped_requirements,
    human_review_required: row.human_review_required,
    review_requirement_ids: row.review_requirement_ids,
    approval_status: row.approval_status,
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString(),
  };
}

export class PostgresPlanningRepository implements PlanningRepository {
  constructor(private readonly pool: Pool) {}

  async insertOrGet(record: NewPlanning): Promise<{
    kind: "inserted" | "existing";
    record: PersistedPlanning;
  }> {
    const inserted = await this.pool.query<PlanningRow>(
      `INSERT INTO wf02_planning_requests (
         request_id,
         canonical_payload,
         payload_hash,
         state,
         reason_codes,
         validation_errors,
         unmapped_requirements,
         human_review_required,
         review_requirement_ids,
         approval_status
       )
       VALUES ($1, $2::jsonb, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
       ON CONFLICT (request_id) DO NOTHING
       RETURNING request_id, canonical_payload, payload_hash, state, reason_codes, validation_errors,
                 unmapped_requirements, human_review_required, review_requirement_ids, approval_status, created_at`,
      [
        record.request_id,
        JSON.stringify(record.canonical_payload),
        record.payload_hash,
        record.state,
        record.reason_codes,
        JSON.stringify(record.validation_errors),
        JSON.stringify(record.unmapped_requirements),
        record.human_review_required,
        record.review_requirement_ids,
        record.approval_status,
      ],
    );

    if (inserted.rows[0]) {
      return { kind: "inserted", record: mapRow(inserted.rows[0]) };
    }

    const existing = await this.pool.query<PlanningRow>(
      `SELECT request_id, canonical_payload, payload_hash, state, reason_codes, validation_errors,
              unmapped_requirements, human_review_required, review_requirement_ids, approval_status, created_at
       FROM wf02_planning_requests
       WHERE request_id = $1`,
      [record.request_id],
    );

    if (!existing.rows[0]) {
      throw new Error("WF-02 insert conflict occurred but the existing planning row was not found");
    }

    return { kind: "existing", record: mapRow(existing.rows[0]) };
  }
}
