import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { decideApproval } from "../lib/approval-service";

const url = process.env.DATABASE_URL;
test("PostgreSQL approval transaction persists approver identity and audit event", { skip: !url }, async () => {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  let teamId = "", repoId = "", approvalId = "", projectId = "";
  const requester = `requester-${crypto.randomUUID()}`;
  const approver = `approver-${crypto.randomUUID()}`;
  try {
    const team = (await client.query("INSERT INTO teams(name,slug) VALUES ('Integration team',$1) RETURNING id", [`it-${crypto.randomUUID()}`])).rows[0];
    teamId = team.id;
    projectId = (await client.query("INSERT INTO projects(team_id,name,slug) VALUES ($1,'Integration project',$2) RETURNING id", [teamId, `it-${crypto.randomUUID()}`])).rows[0].id;
    repoId = (await client.query("INSERT INTO repositories(project_id,external_id,full_name) VALUES ($1,$2,$3) RETURNING id", [projectId, crypto.randomUUID(), `integration/${crypto.randomUUID()}`])).rows[0].id;
    await client.query("INSERT INTO team_members(team_id,user_subject,role) VALUES ($1,$2,'developer'),($1,$3,'reviewer')", [teamId, requester, approver]);
    approvalId = (await client.query("INSERT INTO approvals(team_id,repository_id,resource_type,resource_ref,requested_by,requested_action) VALUES ($1,$2,'agent_action','integration-test',$3,'{}'::jsonb) RETURNING id", [teamId, repoId, requester])).rows[0].id;
  } finally { client.release(); }

  try {
    const result = await decideApproval({ approvalId, actorId: approver, decision: "approved", requestId: crypto.randomUUID() });
    assert.equal(result.status, 200);
    assert.equal(result.body.decidedBy, approver);
    const persisted = await pool.query("SELECT status, decided_by FROM approvals WHERE id=$1", [approvalId]);
    assert.equal(persisted.rows[0].status, "approved");
    assert.equal(persisted.rows[0].decided_by, approver);
    const audit = await pool.query("SELECT actor_id, action, outcome FROM audit_logs WHERE resource_ref=$1", [approvalId]);
    assert.equal(audit.rows.length, 1);
    assert.equal(audit.rows[0].actor_id, approver);
    assert.equal(audit.rows[0].action, "approval.decision.approved");
    assert.equal(audit.rows[0].outcome, "success");
    const replay = await decideApproval({ approvalId, actorId: approver, decision: "approved", requestId: crypto.randomUUID() });
    assert.equal(replay.status, 409);
  } finally {
    await pool.query("DELETE FROM audit_logs WHERE resource_ref=$1", [approvalId]);
    await pool.query("DELETE FROM approvals WHERE id=$1", [approvalId]);
    await pool.query("DELETE FROM repositories WHERE id=$1", [repoId]);
    await pool.query("DELETE FROM projects WHERE id=$1", [projectId]);
    await pool.query("DELETE FROM teams WHERE id=$1", [teamId]);
    await pool.end();
  }
});

test("PostgreSQL approval transaction rejects self-approval", { skip: !url }, async () => {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  const actor = `same-${crypto.randomUUID()}`;
  let teamId = "", projectId = "", repoId = "", approvalId = "";
  try {
    teamId = (await client.query("INSERT INTO teams(name,slug) VALUES ('Self approval team',$1) RETURNING id", [`it-${crypto.randomUUID()}`])).rows[0].id;
    projectId = (await client.query("INSERT INTO projects(team_id,name,slug) VALUES ($1,'Self project',$2) RETURNING id", [teamId, `it-${crypto.randomUUID()}`])).rows[0].id;
    repoId = (await client.query("INSERT INTO repositories(project_id,external_id,full_name) VALUES ($1,$2,$3) RETURNING id", [projectId, crypto.randomUUID(), `integration/${crypto.randomUUID()}`])).rows[0].id;
    await client.query("INSERT INTO team_members(team_id,user_subject,role) VALUES ($1,$2,'owner')", [teamId, actor]);
    approvalId = (await client.query("INSERT INTO approvals(team_id,repository_id,resource_type,resource_ref,requested_by,requested_action) VALUES ($1,$2,'agent_action','self-test',$3,'{}'::jsonb) RETURNING id", [teamId, repoId, actor])).rows[0].id;
  } finally { client.release(); }
  try {
    const result = await decideApproval({ approvalId, actorId: actor, decision: "approved", requestId: crypto.randomUUID() });
    assert.equal(result.status, 403);
    assert.equal((await pool.query("SELECT status FROM approvals WHERE id=$1", [approvalId])).rows[0].status, "pending");
  } finally {
    await pool.query("DELETE FROM audit_logs WHERE resource_ref=$1", [approvalId]);
    await pool.query("DELETE FROM approvals WHERE id=$1", [approvalId]);
    await pool.query("DELETE FROM repositories WHERE id=$1", [repoId]);
    await pool.query("DELETE FROM projects WHERE id=$1", [projectId]);
    await pool.query("DELETE FROM teams WHERE id=$1", [teamId]);
    await pool.end();
  }
});
