import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set to apply the WF-02 migration");
}

const baseMigrationPath = fileURLToPath(
  new URL("../../../database/migrations/002_wf_02_planning.sql", import.meta.url),
);
const reviewSignalMigrationPath = fileURLToPath(
  new URL("../../../database/migrations/004_wf_02_review_requirement_ids.sql", import.meta.url),
);
const migrations = await Promise.all([
  readFile(baseMigrationPath, "utf8"),
  readFile(reviewSignalMigrationPath, "utf8"),
]);
const pool = new Pool({ connectionString });

try {
  for (const migration of migrations) {
    await pool.query(migration);
  }
  console.log("WF-02 migrations applied successfully");
} finally {
  await pool.end();
}
