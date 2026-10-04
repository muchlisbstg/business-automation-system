CREATE TABLE IF NOT EXISTS wf02_planning_requests (
    request_id TEXT PRIMARY KEY,
    canonical_payload JSONB NOT NULL CHECK (jsonb_typeof(canonical_payload) = 'object'),
    payload_hash CHAR(64) NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
    state TEXT NOT NULL CHECK (
        state IN ('PLANNED', 'INVALID_TASK', 'UNMAPPED_REQUIREMENTS')
    ),
    reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    validation_errors JSONB NOT NULL DEFAULT '[]'::JSONB
        CHECK (jsonb_typeof(validation_errors) = 'array'),
    unmapped_requirements JSONB NOT NULL DEFAULT '[]'::JSONB
        CHECK (jsonb_typeof(unmapped_requirements) = 'array'),
    human_review_required BOOLEAN NOT NULL,
    approval_status TEXT NOT NULL CHECK (
        approval_status IN ('not_required', 'pending_human_review')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (human_review_required AND approval_status = 'pending_human_review')
        OR
        (NOT human_review_required AND approval_status = 'not_required')
    )
);

-- Recreate the bound on every migration run so existing databases are upgraded too.
ALTER TABLE wf02_planning_requests
    DROP CONSTRAINT IF EXISTS wf02_planning_requests_request_id_check;
ALTER TABLE wf02_planning_requests
    ADD CONSTRAINT wf02_planning_requests_request_id_check
    CHECK (char_length(request_id) BETWEEN 1 AND 128);

CREATE INDEX IF NOT EXISTS wf02_planning_created_at_idx
    ON wf02_planning_requests (created_at DESC);
