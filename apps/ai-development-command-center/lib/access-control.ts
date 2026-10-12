import { pool } from "@/lib/db";

export type AppRole = "owner" | "admin" | "engineering_lead" | "developer" | "reviewer" | "auditor";
export type AccessScope = { teamId: string; repositoryId?: string; role: AppRole };

const READ_ROLES = new Set<AppRole>(["owner", "admin", "engineering_lead", "developer", "reviewer", "auditor"]);
const APPROVER_ROLES = new Set<AppRole>(["owner", "admin", "engineering_lead", "reviewer"]);

export function canRead(role: AppRole): boolean { return READ_ROLES.has(role); }
export function canApprove(role: AppRole): boolean { return APPROVER_ROLES.has(role); }

/** Repository-specific membership overrides the team role; no IdP role claim is trusted. */
export async function getRepositoryAccess(subject: string, repositoryId: string): Promise<AccessScope | null> {
  const result = await pool.query<{ team_id: string; role: AppRole }>(
    `SELECT p.team_id,
       COALESCE(rm.role, tm.role) AS role
     FROM repositories r
     JOIN projects p ON p.id = r.project_id
     JOIN team_members tm ON tm.team_id = p.team_id AND tm.user_subject = $1
     LEFT JOIN repository_members rm ON rm.repository_id = r.id AND rm.user_subject = $1
     WHERE r.id = $2 AND p.status <> 'archived'
       AND (rm.user_subject IS NOT NULL OR tm.role IN ('owner','admin','engineering_lead','developer','reviewer','auditor'))
     LIMIT 1`,
    [subject, repositoryId],
  );
  const row = result.rows[0];
  return row ? { teamId: row.team_id, repositoryId, role: row.role } : null;
}

export async function getTeamAccess(subject: string, teamId: string): Promise<AccessScope | null> {
  const result = await pool.query<{ role: AppRole }>(
    "SELECT role FROM team_members WHERE team_id = $1 AND user_subject = $2 LIMIT 1",
    [teamId, subject],
  );
  return result.rows[0] ? { teamId, role: result.rows[0].role } : null;
}
