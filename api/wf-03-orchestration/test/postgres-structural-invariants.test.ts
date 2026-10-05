import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";
import { fileURLToPath } from "node:url";

const connectionString = process.env.DATABASE_URL;
const migrationPaths = [
  new URL("../../../database/migrations/001_wf_01_intake.sql", import.meta.url),
  new URL("../../../database/migrations/002_wf_02_planning.sql", import.meta.url),
  new URL("../../../database/migrations/003_wf_03_orchestration.sql", import.meta.url),
  new URL("../../../database/migrations/004_wf_02_review_requirement_ids.sql", import.meta.url),
];
const identityMigrationPaths = [
  new URL("../../../database/migrations/005_wf_01_payload_identity.sql", import.meta.url),
  new URL("../../../database/migrations/006_wf_02_source_identity.sql", import.meta.url),
  new URL("../../../database/migrations/007_wf_03_source_identity.sql", import.meta.url),
];
const identityPreflightPaths = [
  new URL("../../../database/diagnostics/wf01_payload_identity_preflight.sql", import.meta.url),
  new URL("../../../database/diagnostics/wf02_source_identity_preflight.sql", import.meta.url),
  new URL("../../../database/diagnostics/wf03_source_identity_preflight.sql", import.meta.url),
];

async function expectCheckViolation(operation: Promise<unknown>): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    assert.equal((error as { code?: string }).code, "23514");
    return true;
  });
}

test("PostgreSQL identity checks preserve legacy rows, report preflight findings, and reject new inconsistencies", {
  skip: !connectionString,
}, async () => {
  const client = new Client({ connectionString });
  const schemaName = `wf_identity_${randomUUID().replaceAll("-", "")}`;
  await client.connect();

  try {
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET search_path TO "${schemaName}"`);

    for (const path of migrationPaths) {
      await client.query(await readFile(fileURLToPath(path), "utf8"));
    }

    // These rows model pre-migration data accepted under the old DDL.
    await client.query(
      `INSERT INTO wf01_intake_requests
         (request_id, canonical_payload, payload_hash, human_review_required, approval_status)
       VALUES ('legacy-wf01', $1::jsonb, $2, false, 'not_required')`,
      [JSON.stringify({
        request_id: "legacy-wf01-payload-id",
        title: "Legacy title",
        requester: "legacy requester",
        description: "Legacy description",
      }), "a".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf01_intake_requests
         (request_id, canonical_payload, payload_hash, human_review_required, approval_status)
       VALUES ('legacy-wf01-missing-payload-id', $1::jsonb, $2, false, 'not_required')`,
      [JSON.stringify({ title: "Legacy row without a payload request ID" }), "0".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf02_planning_requests
         (request_id, canonical_payload, payload_hash, state, human_review_required, approval_status)
       VALUES ('legacy-wf02', $1::jsonb, $2, 'PLANNED', false, 'not_required')`,
      [JSON.stringify({
        request_id: "legacy-wf02",
        source: { workflow: "WF-01", request_id: "legacy-wf02-other-source", intake_state: "ACCEPTED" },
        requirements: [{ requirement_id: "R-1", description: "Legacy requirement" }],
      }), "b".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf02_planning_requests
         (request_id, canonical_payload, payload_hash, state, human_review_required, approval_status)
       VALUES ('legacy-wf02-missing-intake-state', $1::jsonb, $2, 'PLANNED', false, 'not_required')`,
      [JSON.stringify({
        request_id: "legacy-wf02-missing-intake-state",
        source: { workflow: "WF-01", request_id: "legacy-wf02-missing-intake-state" },
        requirements: [{ requirement_id: "R-2", description: "Legacy requirement" }],
      }), "5".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf03_orchestrations
         (plan_id, request_id, canonical_payload, payload_hash, state)
       VALUES ('legacy-wf03-plan', 'legacy-wf03', $1::jsonb, $2, 'ORCHESTRATED')`,
      [JSON.stringify({
        request_id: "legacy-wf03",
        plan_id: "legacy-wf03-plan",
        source: { workflow: "WF-02", request_id: "legacy-wf03-other-source", planning_state: "PLANNED" },
        tasks: [{ task_id: "T-1", title: "Legacy task", requirement_ids: ["R-1"] }],
      }), "c".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf03_orchestrations
         (plan_id, request_id, canonical_payload, payload_hash, state)
       VALUES ('legacy-wf03-missing-planning-state-plan', 'legacy-wf03-missing-planning-state', $1::jsonb, $2, 'ORCHESTRATED')`,
      [JSON.stringify({
        request_id: "legacy-wf03-missing-planning-state",
        plan_id: "legacy-wf03-missing-planning-state-plan",
        source: { workflow: "WF-02", request_id: "legacy-wf03-missing-planning-state" },
        tasks: [{ task_id: "T-2", title: "Legacy task", requirement_ids: ["R-2"] }],
      }), "6".repeat(64)],
    );

    const identityMigrations = await Promise.all(
      identityMigrationPaths.map((path) => readFile(fileURLToPath(path), "utf8")),
    );
    for (const migration of identityMigrations) {
      await client.query(migration);
      await client.query(migration);
    }

    const legacyCounts = await client.query<{
      wf01: string;
      wf02: string;
      wf03: string;
    }>(
      `SELECT
         (SELECT count(*)::text FROM wf01_intake_requests WHERE request_id LIKE 'legacy-wf01%') AS wf01,
         (SELECT count(*)::text FROM wf02_planning_requests WHERE request_id LIKE 'legacy-wf02%') AS wf02,
         (SELECT count(*)::text FROM wf03_orchestrations WHERE plan_id LIKE 'legacy-wf03%') AS wf03`,
    );
    assert.deepEqual(legacyCounts.rows[0], { wf01: "2", wf02: "2", wf03: "2" });

    await client.query(
      `INSERT INTO wf01_intake_requests
         (request_id, canonical_payload, payload_hash, human_review_required, approval_status)
       VALUES ('wf01-valid', $1::jsonb, $2, false, 'not_required')`,
      [JSON.stringify({
        request_id: "wf01-valid",
        title: "Valid title",
        requester: "test",
        description: "Valid description",
      }), "d".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf02_planning_requests
         (request_id, canonical_payload, payload_hash, state, human_review_required, approval_status)
       VALUES ('wf02-valid', $1::jsonb, $2, 'PLANNED', false, 'not_required')`,
      [JSON.stringify({
        request_id: "wf02-valid",
        source: { workflow: "WF-01", request_id: "wf02-valid", intake_state: "ACCEPTED" },
        requirements: [{ requirement_id: "R-1", description: "Requirement" }],
      }), "e".repeat(64)],
    );
    await client.query(
      `INSERT INTO wf03_orchestrations
         (plan_id, request_id, canonical_payload, payload_hash, state)
       VALUES ('wf03-valid-plan', 'wf03-valid', $1::jsonb, $2, 'ORCHESTRATED')`,
      [JSON.stringify({
        request_id: "wf03-valid",
        plan_id: "wf03-valid-plan",
        source: { workflow: "WF-02", request_id: "wf03-valid", planning_state: "PLANNED" },
        tasks: [{ task_id: "T-1", title: "Valid task", requirement_ids: ["R-1"] }],
      }), "f".repeat(64)],
    );

    await client.query("BEGIN READ ONLY");
    try {
      const diagnostics = [];
      for (const path of identityPreflightPaths) {
        const sql = await readFile(fileURLToPath(path), "utf8");
        const executableSql = sql.replace(/--[^\n]*/g, "").trim();
        assert.match(executableSql, /^SELECT\b/i, "preflight file must be a SELECT");
        assert.equal(executableSql.replace(/;$/, "").includes(";"), false, "preflight file must contain one statement");
        diagnostics.push((await client.query(sql)).rows);
      }

      assert.deepEqual(diagnostics, [
        [
          {
            table_name: "wf01_intake_requests",
            constraint_name: "wf01_intake_requests_payload_request_id_check",
            row_key: "legacy-wf01",
          },
          {
            table_name: "wf01_intake_requests",
            constraint_name: "wf01_intake_requests_payload_request_id_check",
            row_key: "legacy-wf01-missing-payload-id",
          },
        ],
        [
          {
            table_name: "wf02_planning_requests",
            constraint_name: "wf02_planning_requests_source_identity_check",
            row_key: "legacy-wf02",
          },
          {
            table_name: "wf02_planning_requests",
            constraint_name: "wf02_planning_requests_source_identity_check",
            row_key: "legacy-wf02-missing-intake-state",
          },
        ],
        [
          {
            table_name: "wf03_orchestrations",
            constraint_name: "wf03_orchestrations_source_identity_check",
            row_key: "legacy-wf03-missing-planning-state-plan",
          },
          {
            table_name: "wf03_orchestrations",
            constraint_name: "wf03_orchestrations_source_identity_check",
            row_key: "legacy-wf03-plan",
          },
        ],
      ]);

      const constraintState = await client.query<{ conname: string; convalidated: boolean }>(
        `SELECT conname, convalidated
         FROM pg_constraint
         WHERE conrelid IN (
           'wf01_intake_requests'::regclass,
           'wf02_planning_requests'::regclass,
           'wf03_orchestrations'::regclass
         )
           AND conname IN (
             'wf01_intake_requests_payload_request_id_check',
             'wf02_planning_requests_source_identity_check',
             'wf03_orchestrations_source_identity_check'
           )
         ORDER BY conname`,
      );
      assert.equal(constraintState.rows.length, 3);
      assert.ok(constraintState.rows.every(({ convalidated }) => !convalidated));
    } finally {
      await client.query("ROLLBACK");
    }

    await expectCheckViolation(client.query(
      `INSERT INTO wf01_intake_requests
         (request_id, canonical_payload, payload_hash, human_review_required, approval_status)
       VALUES ('wf01-invalid', $1::jsonb, $2, false, 'not_required')`,
      [JSON.stringify({
        request_id: "different-request",
        title: "Valid title",
        requester: "test",
        description: "Valid description",
      }), "1".repeat(64)],
    ));
    await expectCheckViolation(client.query(
      `INSERT INTO wf02_planning_requests
         (request_id, canonical_payload, payload_hash, state, human_review_required, approval_status)
       VALUES ('wf02-invalid', $1::jsonb, $2, 'PLANNED', false, 'not_required')`,
      [JSON.stringify({
        request_id: "wf02-invalid",
        source: { workflow: "WF-01", request_id: "different-source", intake_state: "ACCEPTED" },
        requirements: [{ requirement_id: "R-1", description: "Requirement" }],
      }), "2".repeat(64)],
    ));
    await expectCheckViolation(client.query(
      `INSERT INTO wf03_orchestrations
         (plan_id, request_id, canonical_payload, payload_hash, state)
       VALUES ('wf03-invalid-plan', 'wf03-invalid', $1::jsonb, $2, 'ORCHESTRATED')`,
      [JSON.stringify({
        request_id: "wf03-invalid",
        plan_id: "wf03-invalid-plan",
        source: { workflow: "WF-02", request_id: "different-source", planning_state: "PLANNED" },
        tasks: [{ task_id: "T-1", title: "Task", requirement_ids: ["R-1"] }],
      }), "3".repeat(64)],
    ));
    await expectCheckViolation(client.query(
      `INSERT INTO wf03_orchestrations
         (plan_id, request_id, canonical_payload, payload_hash, state)
       VALUES ('wf03-invalid-payload-plan', 'wf03-plan-owner', $1::jsonb, $2, 'ORCHESTRATED')`,
      [JSON.stringify({
        request_id: "wf03-plan-owner",
        plan_id: "different-plan",
        source: { workflow: "WF-02", request_id: "wf03-plan-owner", planning_state: "PLANNED" },
        tasks: [{ task_id: "T-1", title: "Task", requirement_ids: ["R-1"] }],
      }), "4".repeat(64)],
    ));
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => undefined);
    await client.end();
  }
});
