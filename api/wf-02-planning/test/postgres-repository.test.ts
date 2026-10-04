import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";
import { PlanningService } from "../src/planning-service.js";
import { PostgresPlanningRepository } from "../src/postgres-repository.js";
import type { PlanningInput } from "../src/types.js";

const postgresTest = process.env.DATABASE_URL ? test : test.skip;

postgresTest("PostgreSQL persists one row under concurrent replay and reports content conflict", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const requestId = `WF02-IT-${randomUUID()}`.padEnd(128, "X");
  const service = new PlanningService(new PostgresPlanningRepository(pool));
  const payload: PlanningInput = {
    request_id: requestId,
    source: { workflow: "WF-01", request_id: requestId, intake_state: "ACCEPTED" },
    intake_review_signal: {
      human_review_required: true,
      approval_status: "pending_human_review",
    },
    title: "Customer retention planning",
    requirements: [{
      requirement_id: "R-001",
      description: "Authorization applies to every protected endpoint.",
    }],
    tasks: [{
      task_id: "T-001",
      title: "Add authorization middleware and tests",
      requirement_ids: ["R-001"],
    }],
  };

  try {
    const results = await Promise.all([service.plan(payload), service.plan(payload)]);
    assert.deepEqual(results.map((result) => result.state).sort(), ["DUPLICATE", "PLANNED"]);
    assert.equal(results[0]?.created_at, results[1]?.created_at);
    assert.deepEqual(results[0]?.review_requirement_ids, ["R-001"]);
    assert.deepEqual(results[1]?.review_requirement_ids, ["R-001"]);
    assert.deepEqual(results.map((result) => result.planning_state).sort(), ["PLANNED", "PLANNED"]);

    const conflict = await service.plan({ ...payload, title: "Changed planning content" });
    assert.equal(conflict.state, "CONFLICT");

    const row = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM wf02_planning_requests WHERE request_id = $1",
      [requestId],
    );
    assert.equal(row.rows[0]?.count, "1");
  } finally {
    await pool.query("DELETE FROM wf02_planning_requests WHERE request_id = $1", [requestId]);
    await pool.end();
  }
});
