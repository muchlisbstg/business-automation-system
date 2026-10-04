CREATE TABLE IF NOT EXISTS wf03_orchestrations (
    plan_id TEXT PRIMARY KEY CHECK (char_length(plan_id) BETWEEN 1 AND 100),
    request_id TEXT NOT NULL,
    canonical_payload JSONB NOT NULL CHECK (jsonb_typeof(canonical_payload) = 'object'),
    payload_hash CHAR(64) NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
    state TEXT NOT NULL CHECK (
        state IN (
            'ORCHESTRATED',
            'INVALID_DEPENDENCY',
            'CYCLE_DETECTED',
            'APPROVAL_REQUIRED',
            'REJECTED'
        )
    ),
    execution_order TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    blocked_task_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate the bound on every migration run so existing databases are upgraded too.
ALTER TABLE wf03_orchestrations
    DROP CONSTRAINT IF EXISTS wf03_orchestrations_request_id_check;
ALTER TABLE wf03_orchestrations
    ADD CONSTRAINT wf03_orchestrations_request_id_check
    CHECK (char_length(request_id) BETWEEN 1 AND 128);

CREATE INDEX IF NOT EXISTS wf03_orchestrations_created_at_idx
    ON wf03_orchestrations (created_at DESC);
