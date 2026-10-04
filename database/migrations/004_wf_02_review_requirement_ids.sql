ALTER TABLE wf02_planning_requests
    ADD COLUMN IF NOT EXISTS review_requirement_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Historical WF-02 records only stored a plan-level boolean. Associate a
-- historical positive signal with every requirement rather than under-blocking.
UPDATE wf02_planning_requests
SET review_requirement_ids = ARRAY(
    SELECT requirement->>'requirement_id'
    FROM jsonb_array_elements(canonical_payload->'requirements') AS requirement
    WHERE requirement->>'requirement_id' IS NOT NULL
    ORDER BY requirement->>'requirement_id'
)
WHERE human_review_required
  AND cardinality(review_requirement_ids) = 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'wf02_planning_requests'::regclass
          AND conname = 'wf02_planning_review_requirement_ids_consistent'
    ) THEN
        ALTER TABLE wf02_planning_requests
            ADD CONSTRAINT wf02_planning_review_requirement_ids_consistent
            CHECK (
                (human_review_required AND cardinality(review_requirement_ids) > 0)
                OR
                (NOT human_review_required AND cardinality(review_requirement_ids) = 0)
            );
    END IF;
END;
$$;
