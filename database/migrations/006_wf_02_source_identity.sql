DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'wf02_planning_requests'::regclass
          AND conname = 'wf02_planning_requests_source_identity_check'
    ) THEN
        ALTER TABLE wf02_planning_requests
            ADD CONSTRAINT wf02_planning_requests_source_identity_check
            CHECK ((
                jsonb_typeof(canonical_payload->'request_id') = 'string'
                AND canonical_payload->>'request_id' = request_id
                AND canonical_payload #>> '{source,workflow}' = 'WF-01'
                AND jsonb_typeof(canonical_payload #> '{source,request_id}') = 'string'
                AND canonical_payload #>> '{source,request_id}' = request_id
                AND canonical_payload #>> '{source,intake_state}' IN ('ACCEPTED', 'DUPLICATE')
            ) IS TRUE) NOT VALID;
    END IF;
END;
$$;
