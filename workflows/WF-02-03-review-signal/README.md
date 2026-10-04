# WF-02→WF-03 Human-Review Signal Bridge

The WF-02 planning response includes `review_requirement_ids`, a sorted list of requirement IDs that require human review. WF-03 requires the corresponding bridge envelope in its input schema and uses the IDs to hold affected tasks and their transitive dependents.

## Attribution in WF-02

WF-02 derives the requirement IDs from the same conservative high-impact detector that sets `human_review_required` and `approval_status`:

- High-impact intent in the overall request title is plan-wide and is attributed to every requirement.
- High-impact intent in a requirement description or acceptance criterion is attributed only to that requirement.
- High-impact intent in a task title is attributed through that task's validated `requirement_ids`.

The result's `review_requirement_ids` are persisted with the planning record. Identical replays return the stored attribution. Existing records with a positive plan-level review flag are backfilled to all their requirements because their historical per-requirement attribution was not stored; this is deliberately conservative.

## WF-03 bridge contract

The active input contract is [`WF-03 schema`](../WF-03-orchestration/schema.json); [`schema.json`](schema.json) mirrors that shape for this bridge. A request requires:

- `request_id`, `plan_id`, and `tasks`;
- `source: { workflow: "WF-02", request_id, planning_state: "PLANNED" }`;
- `review_signal: { human_review_required, approval_status, reason_codes, review_requirement_ids }`.

Only a persisted WF-02 `PLANNED` result may be handed off; WF-02 exposes this as `planning_state` even when an API replay's top-level state is `DUPLICATE`. The source request ID must equal the root request ID. A positive signal must be consistent (`pending_human_review`, `HIGH_IMPACT_REVIEW_REQUIRED`, and at least one review requirement ID); a negative signal must be `not_required` with empty reason and requirement-ID arrays. Every review requirement ID must be linked by at least one WF-03 task, or WF-03 rejects the request without an execution order and lists the tasks as blocked. The schema rejects a missing or internally inconsistent signal.
The root and source request IDs preserve the full 128-character range accepted by WF-01.

## Trust and safety boundary

WF-03 retains the repository's existing trusted-caller assumption: the caller is responsible for forwarding the actual WF-02 planning result and its task list. The bridge checks the declared workflow, request-ID equality, signal shape, and task linkage; it does not add authentication, independently retrieve or authenticate a WF-02 record, or make a new approval-authority model. Callers must not construct or weaken the signal from untrusted task text.

A pending review signal is not approval. WF-03 never approves or executes tasks. The existing `APPROVAL_REQUIRED`, `blocked_task_ids`, and `execution_order` response semantics are reused: tasks linked to a review-required requirement are blocked, as are all transitive dependents; existing WF-03 local high-impact task gates continue to apply independently. The remaining tasks retain deterministic topological order with lexical task-ID tie-breaking. A `plan_id` hash includes the source and review signal, so changing them on replay produces `CONFLICT` rather than overwriting the recorded result.

Slack and other external notifications are out of scope.

## Validation coverage

- WF-02 unit tests cover requirement-only, request-title-wide, task-linked attribution, and replay persistence.
- WF-03 unit tests cover the linked-task seed set, transitive dependent closure, unrelated-task ordering, invalid source IDs, missing/malformed signals, and existing local risk gates.
- WF-03 positive and negative examples are checked against the published schema by the repository contract validators.
