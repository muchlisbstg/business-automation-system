import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set to apply the WF-03 migration");
}

const migrationPaths = [
  fileURLToPath(
    new URL("../../../database/migrations/003_wf_03_orchestration.sql", import.meta.url),
  ),
  fileURLToPath(
    new URL("../../../database/migrations/007_wf_03_source_identity.sql", import.meta.url),
  ),
];
const migrations = await Promise.all(migrationPaths.map((path) => readFile(path, "utf8")));
const pool = new Pool({ connectionString });

try {
  for (const migration of migrations) {
    await pool.query(migration);
  }
  console.log("WF-03 migrations applied successfully");
} finally {
  await pool.end();
}
