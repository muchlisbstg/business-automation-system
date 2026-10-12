CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','engineering_lead','developer','reviewer','auditor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_subject)
);
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  name text NOT NULL, slug text NOT NULL, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (team_id, slug)
);
CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'github' CHECK (provider = 'github'), external_id text NOT NULL,
  full_name text NOT NULL, default_branch text NOT NULL DEFAULT 'main', last_synced_at timestamptz,
  UNIQUE (provider, external_id), UNIQUE (project_id, full_name)
);
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  resource_type text NOT NULL CHECK (resource_type IN ('pull_request','deployment','secret_rotation','data_operation','agent_action')),
  resource_ref text NOT NULL, requested_by text NOT NULL, requested_action jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','expired')),
  decided_by text, decision_reason text, requested_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz, expires_at timestamptz,
  CHECK (status = 'pending' OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)),
  CHECK (decided_by IS NULL OR decided_by <> requested_by)
);
CREATE INDEX IF NOT EXISTS approvals_pending_idx ON approvals(team_id, requested_at) WHERE status = 'pending';
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY, occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL CHECK (actor_type IN ('human','ai_agent','system','github')), actor_id text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL, action text NOT NULL, resource_type text NOT NULL, resource_ref text,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(), outcome text NOT NULL CHECK (outcome IN ('success','denied','failure','pending')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS audit_logs_time_idx ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs(resource_type, resource_ref);
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  agent_type text NOT NULL CHECK (agent_type IN ('frontend','backend','database','mobile','qa','security','devops','coordinator')),
  status text NOT NULL CHECK (status IN ('queued','running','review_required','succeeded','failed','cancelled')),
  task_ref text NOT NULL, initiated_by text NOT NULL, output_summary text, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
