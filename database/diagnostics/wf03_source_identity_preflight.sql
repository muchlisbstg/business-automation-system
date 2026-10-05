-- Read-only preflight for the CHECK added by migration 007.
-- Returns only the table, constraint, and primary key of each violating row.
SELECT
    'wf03_orchestrations'::text AS table_name,
    'wf03_orchestrations_source_identity_check'::text AS constraint_name,
    plan_id AS row_key
FROM wf03_orchestrations
WHERE NOT ((
    jsonb_typeof(canonical_payload->'request_id') = 'string'
    AND canonical_payload->>'request_id' = request_id
    AND jsonb_typeof(canonical_payload->'plan_id') = 'string'
    AND canonical_payload->>'plan_id' = plan_id
    AND canonical_payload #>> '{source,workflow}' = 'WF-02'
    AND jsonb_typeof(canonical_payload #> '{source,request_id}') = 'string'
    AND canonical_payload #>> '{source,request_id}' = request_id
    AND canonical_payload #>> '{source,planning_state}' = 'PLANNED'
) IS TRUE)
ORDER BY row_key;
