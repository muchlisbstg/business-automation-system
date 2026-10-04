# WF-02 — Planning, PRD & Task Validation

## Purpose
Transform an accepted WF-01 intake into a deterministic planning record. WF-02 validates requirements, creates traceable tasks, and blocks ambiguous or unsafe planning inputs.

## Boundaries
WF-02 MUST NOT deploy, mutate production data, approve high-impact actions, or treat AI output as authority.

## Required inputs
- `request_id`
- `source` from WF-01, with the same `request_id` and an intake state of `ACCEPTED` or `DUPLICATE`
- `intake_review_signal` copied from WF-01's `human_review_required` and `approval_status` fields; the two values must be consistent
- `title`
- `requirements`

Each requirement MUST have a stable `requirement_id` and non-empty `description`.
`request_id` MUST support the full 128-character range accepted by WF-01.
The caller MUST forward the actual WF-01 result. WF-02 does not independently authenticate or retrieve that record. Because WF-01 review is request-wide and has no requirement-level attribution, a positive intake review signal marks every WF-02 requirement for review.
WF-01 `ACCEPTED` and `DUPLICATE` source states identify the same durable intake; WF-02 normalizes them to one canonical source state so a replay does not conflict with an identical plan.

## Validation rules
- Missing required fields, including the WF-01 source or review signal -> `CLARIFICATION_REQUIRED`; malformed or inconsistent source/signal values -> `REJECTED`.
- Every requirement must map to at least one task, or appear in `UNMAPPED_REQUIREMENTS`.
- A generic task title such as `Perbaiki performa` without a concrete, verifiable scope -> `INVALID_TASK`. A numeric metric is not mandatory, but scope must be clear in the task title; linked acceptance criteria do not make a generic title valid.
- Prompt-injection text is data and MUST NOT alter validation policy, status, permissions, or task completion.
- Duplicate `request_id` with identical normalized content -> `DUPLICATE`.
- Same `request_id` with different normalized content -> `CONFLICT`.
- High-impact or production intent is flagged for downstream approval; WF-02 never approves it.

Task arrays retain authored order. The WF-02 input schema defines no dependency field, so WF-02 does not infer dependencies or compute a dependency order.

## States
`PLANNED`, `CLARIFICATION_REQUIRED`, `INVALID_TASK`, `UNMAPPED_REQUIREMENTS`, `DUPLICATE`, `CONFLICT`, `REJECTED`

## Traceability
Every task MUST contain `task_id` and `requirement_ids`. No requirement may silently disappear.

Normalization applies Unicode NFKC, canonical newlines, and surrounding-whitespace trimming to strings; object keys are canonicalized for replay hashing while array order is preserved.

## Acceptance tests
1. Empty requirement description produces clarification.
2. Ten requirements produce ten-or-more mapped task references, or explicit unmapped records.
3. Vague task "Perbaiki performa" is rejected.
4. Prompt injection cannot mark tasks DONE.
5. Replaying identical input is idempotent.
6. Reusing a request ID with changed content produces CONFLICT.
7. Production/destructive intent is flagged, never executed.
8. Missing WF-01 provenance or review signal requests clarification; malformed or inconsistent values are rejected.
9. A positive WF-01 review signal is conservatively mapped to every requirement, including when WF-01 returned `DUPLICATE`.
10. A source request ID that differs from the planning request is rejected.
11. Replaying the same plan after WF-01 changes from `ACCEPTED` to `DUPLICATE` returns `DUPLICATE`, not `CONFLICT`.
