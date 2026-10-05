-- Read-only preflight for the CHECK added by migration 005.
-- Returns only the table, constraint, and primary key of each violating row.
SELECT
    'wf01_intake_requests'::text AS table_name,
    'wf01_intake_requests_payload_request_id_check'::text AS constraint_name,
    request_id AS row_key
FROM wf01_intake_requests
WHERE NOT ((
    jsonb_typeof(canonical_payload->'request_id') = 'string'
    AND canonical_payload->>'request_id' = request_id
) IS TRUE)
ORDER BY row_key;
