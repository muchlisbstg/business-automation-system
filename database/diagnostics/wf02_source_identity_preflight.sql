-- Read-only preflight for the CHECK added by migration 006.
-- Returns only the table, constraint, and primary key of each violating row.
SELECT
    'wf02_planning_requests'::text AS table_name,
    'wf02_planning_requests_source_identity_check'::text AS constraint_name,
    request_id AS row_key
FROM wf02_planning_requests
WHERE NOT ((
    jsonb_typeof(canonical_payload->'request_id') = 'string'
    AND canonical_payload->>'request_id' = request_id
    AND canonical_payload #>> '{source,workflow}' = 'WF-01'
    AND jsonb_typeof(canonical_payload #> '{source,request_id}') = 'string'
    AND canonical_payload #>> '{source,request_id}' = request_id
    AND canonical_payload #>> '{source,intake_state}' IN ('ACCEPTED', 'DUPLICATE')
) IS TRUE)
ORDER BY row_key;
