import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";
import { fileURLToPath } from "node:url";

const connectionString = process.env.DATABASE_URL;
const baseMigrationPath = fileURLToPath(
  new URL("../../../database/migrations/002_wf_02_planning.sql", import.meta.url),
);
const reviewSignalMigrationPath = fileURLToPath(
  new URL("../../../database/migrations/004_wf_02_review_requirement_ids.sql", import.meta.url),
);

test("WF-02 upgrade backfills legacy review IDs and installs its constraint despite a name collision", {
  skip: !connectionString,
}, async () => {
  const client = new Client({ connectionString });
  const schemaName = `wf02_migration_${randomUUID().replaceAll("-", "")}`;
  await client.connect();

  try {
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query(await readFile(baseMigrationPath, "utf8"));
    await client.query(`
      CREATE TABLE unrelated_collision (
        id integer CONSTRAINT wf02_planning_review_requirement_ids_consistent CHECK (id > 0)
      )
    `);
    await client.query(
      `INSERT INTO wf02_planning_requests
        (request_id, canonical_payload, payload_hash, state, human_review_required, approval_status)
       VALUES ($1, $2::jsonb, $3, 'PLANNED', true, 'pending_human_review')`,
      [
        "legacy-review",
        JSON.stringify({
          requirements: [
            { requirement_id: "R-002" },
            { requirement_id: "R-001" },
          ],
        }),
        "a".repeat(64),
      ],
    );

    const reviewSignalMigration = await readFile(reviewSignalMigrationPath, "utf8");
    await client.query(reviewSignalMigration);
    await client.query(reviewSignalMigration);

    const result = await client.query<{
      review_requirement_ids: string[];
      constraint_installed: boolean;
    }>(
      `SELECT review_requirement_ids,
              EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conrelid = 'wf02_planning_requests'::regclass
                  AND conname = 'wf02_planning_review_requirement_ids_consistent'
              ) AS constraint_installed
       FROM wf02_planning_requests WHERE request_id = $1`,
      ["legacy-review"],
    );
    assert.equal(result.rowCount, 1);
    assert.deepEqual(result.rows[0].review_requirement_ids, ["R-001", "R-002"]);
    assert.equal(result.rows[0].constraint_installed, true);

    await client.query("BEGIN");
    let constraintError: unknown;
    try {
      await client.query(
        "UPDATE wf02_planning_requests SET review_requirement_ids = ARRAY[]::TEXT[] WHERE request_id = $1",
        ["legacy-review"],
      );
    } catch (error) {
      constraintError = error;
    }
    await client.query("ROLLBACK");
    assert.equal((constraintError as { code?: string } | undefined)?.code, "23514");
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => undefined);
    await client.end();
  }
});
