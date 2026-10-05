DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'wf01_intake_requests'::regclass
          AND conname = 'wf01_intake_requests_payload_request_id_check'
    ) THEN
        ALTER TABLE wf01_intake_requests
            ADD CONSTRAINT wf01_intake_requests_payload_request_id_check
            CHECK ((
                jsonb_typeof(canonical_payload->'request_id') = 'string'
                AND canonical_payload->>'request_id' = request_id
            ) IS TRUE) NOT VALID;
    END IF;
END;
$$;
