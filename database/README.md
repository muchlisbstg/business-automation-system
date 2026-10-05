# Database

PostgreSQL is the primary transactional data store.

## Principles

- Migrations are version-controlled and executed outside n8n.
- Schema changes are reviewed through CI.
- Destructive migrations require explicit approval and backup evidence.
- Audit history is append-oriented and protected from application mutation.
- Query plans, indexes, N+1 patterns, row-level security, and migration safety are part of database QA.

## WF-01 Intake

`migrations/001_wf_01_intake.sql` creates the durable intake table and unique `request_id` constraint used for replay detection. Apply it with `npm run migrate` from `api/wf-01-intake` after setting `DATABASE_URL`; the migration is run by the service deployment process, never by n8n.

## WF-02 Planning

`migrations/002_wf_02_planning.sql` stores normalized planning outcomes under a unique `request_id`, as required for durable duplicate and changed-content conflict detection. Apply it with `npm run migrate` from `api/wf-02-planning` after setting `DATABASE_URL`. The table is additive and does not alter WF-01 data; a rollback should disable the service rather than delete planning records.

## WF-03 Orchestration

`migrations/003_wf_03_orchestration.sql` adds the append-only `wf03_orchestrations` table with a unique `plan_id` for durable replay and changed-content conflict detection. Apply it with `npm run migrate` from `api/wf-03-orchestration` after setting `DATABASE_URL`. The migration does not alter WF-01 or WF-02 data; rollback should disable the service rather than delete orchestration records.

## Canonical payload identity checks

The WF-01, WF-02, and WF-03 migrators also apply migrations 005, 006, and 007. These add row-local checks that the canonical payload's request/plan IDs match their indexed columns and that WF-02/WF-03 source request IDs match the root request ID, with the declared upstream workflow/state. Each check is added `NOT VALID`: existing rows are not rewritten or scanned during rollout, while new rows and updates must satisfy the check. Existing rows can be audited and the constraint validated separately before requiring a fully validated constraint.

No cross-workflow foreign keys are added. The workflow service jobs use separate PostgreSQL databases, and the service contracts retain a trusted-caller boundary without authoritative upstream-record lookup; the checks enforce only internal payload identity, not upstream record existence or authentication.
