DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'wf03_orchestrations'::regclass
          AND conname = 'wf03_orchestrations_source_identity_check'
    ) THEN
        ALTER TABLE wf03_orchestrations
            ADD CONSTRAINT wf03_orchestrations_source_identity_check
            CHECK ((
                jsonb_typeof(canonical_payload->'request_id') = 'string'
                AND canonical_payload->>'request_id' = request_id
                AND jsonb_typeof(canonical_payload->'plan_id') = 'string'
                AND canonical_payload->>'plan_id' = plan_id
                AND canonical_payload #>> '{source,workflow}' = 'WF-02'
                AND jsonb_typeof(canonical_payload #> '{source,request_id}') = 'string'
                AND canonical_payload #>> '{source,request_id}' = request_id
                AND canonical_payload #>> '{source,planning_state}' = 'PLANNED'
            ) IS TRUE) NOT VALID;
    END IF;
END;
$$;
