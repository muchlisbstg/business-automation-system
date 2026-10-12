import type { PoolClient } from "pg";
import { inTransaction } from "@/lib/db";
import { canApprove, type AppRole } from "@/lib/access-control";

export type Decision = "approved" | "rejected";
export type DecisionResult = { status: number; body: { error?: string; approvalId?: string; status?: Decision; decidedBy?: string; decidedAt?: string } };

export async function decideApproval(input: {
  approvalId: string;
  actorId: string;
  decision: Decision;
  reason?: string;
  requestId: string;
}): Promise<DecisionResult> {
  if (input.decision !== "approved" && input.decision !== "rejected") {
    return { status: 400, body: { error: "decision must be approved or rejected" } };
  }
  const reason = input.reason?.trim() ?? "";
  if (input.decision === "rejected" && reason.length < 8) {
    return { status: 400, body: { error: "A rejection reason of at least 8 characters is required." } };
  }

  try {
    return await inTransaction(async (client: PoolClient): Promise<DecisionResult> => {
      const locked = await client.query<{
        id: string; team_id: string; repository_id: string | null; requested_by: string;
        status: string; expires_at: Date | null;
      }>(
        `SELECT id, team_id, repository_id, requested_by, status, expires_at
         FROM approvals WHERE id = $1 FOR UPDATE`,
        [input.approvalId],
      );
      const approval = locked.rows[0];
      if (!approval) return { status: 404, body: { error: "Approval not found." } };
      if (approval.status !== "pending") return { status: 409, body: { error: "Approval is no longer pending." } };
      if (approval.expires_at && approval.expires_at.getTime() <= Date.now()) {
        await client.query("UPDATE approvals SET status = 'expired', decided_by = 'system:expiry', decided_at = now(), decision_reason = 'Expired automatically' WHERE id = $1", [approval.id]);
        await writeAudit(client, { ...input, actorId: "system:expiry", actorType: "system" }, approval.team_id, "approval.expired", "failure", { approvalId: approval.id });
        return { status: 409, body: { error: "Approval has expired." } };
      }
      if (approval.requested_by === input.actorId) {
        await writeAudit(client, input, approval.team_id, "approval.decision.denied", "denied", { approvalId: approval.id, reason: "self_approval" });
        return { status: 403, body: { error: "Requester cannot approve their own request." } };
      }
      if (!approval.repository_id) {
        await writeAudit(client, input, approval.team_id, "approval.decision.denied", "denied", { approvalId: approval.id, reason: "repository_scope_missing" });
        return { status: 409, body: { error: "Approval has no repository scope; assign a repository before deciding." } };
      }

      const membership = await client.query<{ role: AppRole }>(
        `SELECT COALESCE(rm.role, tm.role) AS role
         FROM repositories r
         JOIN projects p ON p.id = r.project_id
         LEFT JOIN team_members tm ON tm.team_id = p.team_id AND tm.user_subject = $1
         LEFT JOIN repository_members rm ON rm.repository_id = r.id AND rm.user_subject = $1
         WHERE r.id = $2 AND p.team_id = $3
           AND (rm.user_subject IS NOT NULL OR tm.user_subject IS NOT NULL)
         LIMIT 1`,
        [input.actorId, approval.repository_id, approval.team_id],
      );
      const role = membership.rows[0]?.role;
      if (!role || !canApprove(role)) {
        await writeAudit(client, input, approval.team_id, "approval.decision.denied", "denied", { approvalId: approval.id, reason: "insufficient_role" });
        return { status: 403, body: { error: "No approval permission for this team and repository." } };
      }

      const decidedAt = new Date();
      const updated = await client.query<{ status: Decision; decided_by: string; decided_at: Date }>(
        `UPDATE approvals
         SET status = $2, decided_by = $3, decided_at = $4, decision_reason = $5
         WHERE id = $1 AND status = 'pending'
         RETURNING status, decided_by, decided_at`,
        [approval.id, input.decision, input.actorId, decidedAt, reason || null],
      );
      if (updated.rowCount !== 1) return { status: 409, body: { error: "Approval state changed; reload and retry." } };
      await writeAudit(client, input, approval.team_id, `approval.decision.${input.decision}`, "success", {
        approvalId: approval.id, repositoryId: approval.repository_id, approverRole: role, decision: input.decision,
      });
      const row = updated.rows[0];
      return { status: 200, body: { approvalId: approval.id, status: row.status, decidedBy: row.decided_by, decidedAt: row.decided_at.toISOString() } };
    });
  } catch {
    return { status: 503, body: { error: "Approval service temporarily unavailable." } };
  }
}

async function writeAudit(
  client: PoolClient,
  input: { actorId: string; actorType?: "human" | "system"; requestId: string },
  teamId: string,
  action: string,
  outcome: "success" | "denied" | "failure" | "pending",
  metadata: Record<string, unknown>,
) {
  await client.query(
    `INSERT INTO audit_logs (actor_type, actor_id, team_id, action, resource_type, resource_ref, correlation_id, outcome, metadata)
     VALUES ($1, $2, $3, $4, 'approval', $5, $6::uuid, $7, $8::jsonb)`,
    [input.actorType ?? "human", input.actorId, teamId, action, String(metadata.approvalId ?? ""), input.requestId, outcome, JSON.stringify(metadata)],
  );
}
