import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";
import { IntakeService } from "../src/intake-service.js";
import { PostgresIntakeRepository } from "../src/postgres-repository.js";
import type { IntakeRequest } from "../src/types.js";

const postgresTest = process.env.DATABASE_URL ? test : test.skip;

postgresTest("PostgreSQL persists one row under concurrent replay and reports content conflict", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const requestId = `WF01-IT-${randomUUID()}`.padEnd(128, "X");
  const service = new IntakeService(new PostgresIntakeRepository(pool));
  const payload: IntakeRequest = {
    request_id: requestId,
    title: "Deploy the intake service to production",
    requester: "ci",
    description: "Verify PostgreSQL-backed idempotency without executing the request.",
  };

  try {
    const results = await Promise.all([service.submit(payload), service.submit(payload)]);
    assert.deepEqual(
      results.map((result) => result.state).sort(),
      ["ACCEPTED", "DUPLICATE"],
    );
    assert.equal(results[0]?.created_at, results[1]?.created_at);

    const conflict = await service.submit({ ...payload, title: "Different content" });
    assert.equal(conflict.state, "CONFLICT");

    const row = await pool.query<{
      count: string;
      human_review_required: boolean;
      approval_status: string;
    }>(
      `SELECT count(*)::text AS count,
              bool_or(human_review_required) AS human_review_required,
              min(approval_status) AS approval_status
       FROM wf01_intake_requests WHERE request_id = $1`,
      [requestId],
    );
    assert.equal(row.rows[0]?.count, "1");
    assert.equal(row.rows[0]?.human_review_required, true);
    assert.equal(row.rows[0]?.approval_status, "pending_human_review");
  } finally {
    await pool.query("DELETE FROM wf01_intake_requests WHERE request_id = $1", [requestId]);
    await pool.end();
  }
});
