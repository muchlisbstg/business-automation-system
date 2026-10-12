import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../database/migrations");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations.");
const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [741920261]);
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const applied = new Set((await client.query<{ version: string }>("SELECT version FROM schema_migrations")).rows.map((row) => row.version));
    const files = (await readdir(root)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(root, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]);
        await client.query("COMMIT");
        process.stdout.write(`Applied ${file}\n`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    try { await client.query("SELECT pg_advisory_unlock($1)", [741920261]); } finally { client.release(); await pool.end(); }
  }
}
main().catch((error) => { process.stderr.write(`Migration failed: ${error instanceof Error ? error.message : "unknown error"}\n`); process.exitCode = 1; });
