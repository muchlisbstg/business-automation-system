# WF-02 Planning Service

This TypeScript service implements the input contract in `workflows/WF-02-planning-validation/schema.json` and the behavioral requirements in `tests/wf-02-planning-validation.md`.

## Behavior

- Normalizes strings using Unicode NFKC, canonical newlines, and surrounding-whitespace trimming. Object keys are canonicalized for hashing; array order is preserved.
- Requires the matching WF-01 source (`ACCEPTED` or `DUPLICATE`) and a consistent `intake_review_signal`; a source request-ID mismatch is rejected. Callers must forward the actual WF-01 result because WF-02 does not independently retrieve or authenticate it.
- Treats WF-01 `ACCEPTED` and `DUPLICATE` as the same durable source for replay hashing, so upstream response state changes do not create a false plan conflict.
- Missing required fields or blank requirement IDs/descriptions return `CLARIFICATION_REQUIRED`; schema-invalid input returns `REJECTED`.
- Validates task-to-requirement references and records every unmapped requirement explicitly.
- A generic action-plus-generic-target title such as `Perbaiki performa` is `INVALID_TASK`. A concrete scoped title may be verifiable without a numeric metric; linked acceptance criteria do not turn a generic task title into a valid one.
- Task order is preserved as authored. WF-02's published schema has no dependency/order fields, so this service does not invent or compute dependencies.
- High-impact or production intent is flagged for downstream human review with sorted `review_requirement_ids`: a positive request-wide WF-01 signal or WF-02 title signal applies to every requirement, requirement text applies only to that requirement, and task-title intent maps through the validated `requirement_ids`. The service never approves or executes a task; `execution_permitted` is always `false`.
- `review_requirement_ids` are persisted with the planning result so identical replays return the original attribution. The additive migration backfills historical positive review flags to all requirements, conservatively avoiding under-blocking.
- `planning_state` reports the persisted result state even when the API `state` is `DUPLICATE`; only a `PLANNED` result is eligible for the WF-03 bridge.
- PostgreSQL stores normalized records under a unique `request_id`, making identical replay and changed-content conflicts durable across service instances.

## Run

From this directory, install dependencies with `npm ci`, set `DATABASE_URL`, apply the migration with `npm run migrate`, then run `npm run typecheck` and `npm test`. The PostgreSQL integration test runs when `DATABASE_URL` is set; otherwise it is skipped, while the service behavior suite always runs against an in-memory repository.
