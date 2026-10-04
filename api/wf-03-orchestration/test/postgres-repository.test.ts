import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";
import { OrchestrationService } from "../src/orchestration-service.js";
import { PostgresOrchestrationRepository } from "../src/postgres-repository.js";
import type { OrchestrationInput } from "../src/types.js";

const postgresTest = process.env.DATABASE_URL ? test : test.skip;

postgresTest("PostgreSQL persists one row under concurrent replay and reports plan content conflict", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const planId = `WF03-IT-${randomUUID()}`;
  const requestId = `REQ-${randomUUID()}`.padEnd(128, "X");
  const service = new OrchestrationService(new PostgresOrchestrationRepository(pool));
  const payload: OrchestrationInput = {
    request_id: requestId,
    plan_id: planId,
    source: { workflow: "WF-02", request_id: requestId, planning_state: "PLANNED" },
    review_signal: {
      human_review_required: false,
      approval_status: "not_required",
      reason_codes: [],
      review_requirement_ids: [],
    },
    tasks: [{ task_id: "T-001", title: "Define API contract", requirement_ids: ["R-001"] }],
  };

  try {
    const results = await Promise.all([
      service.orchestrate(payload),
      service.orchestrate(payload),
    ]);
    assert.deepEqual(results.map((result) => result.state).sort(), ["DUPLICATE", "ORCHESTRATED"]);
    assert.equal(results[0]?.created_at, results[1]?.created_at);

    const conflict = await service.orchestrate({
      ...payload,
      tasks: [{ task_id: "T-001", title: "Define a different contract", requirement_ids: ["R-001"] }],
    });
    assert.equal(conflict.state, "CONFLICT");

    const row = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM wf03_orchestrations WHERE plan_id = $1",
      [planId],
    );
    assert.equal(row.rows[0]?.count, "1");
  } finally {
    await pool.end();
  }
});
