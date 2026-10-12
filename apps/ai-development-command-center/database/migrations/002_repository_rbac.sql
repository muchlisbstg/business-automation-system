CREATE TABLE IF NOT EXISTS repository_members (
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','engineering_lead','developer','reviewer','auditor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (repository_id, user_subject)
);
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS repository_id uuid REFERENCES repositories(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS approvals_repository_pending_idx ON approvals(repository_id, requested_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS team_members_subject_idx ON team_members(user_subject, team_id);
CREATE INDEX IF NOT EXISTS repository_members_subject_idx ON repository_members(user_subject, repository_id);
