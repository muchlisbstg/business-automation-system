# WF-02→WF-03 Human-Review Signal Proposal Acceptance Scenarios

> These scenarios describe a candidate contract only. JSON fixtures validate shape and status consistency; they do not verify source records, choose a blocking policy, approve work, or run tasks.

| Case | Expected candidate-contract result |
|---|---|
| `valid-review-required.json` carries `human_review_required: true`, `pending_human_review`, and the high-impact reason | Schema-valid shape only. The synthetic tasks deliberately lack task-local risk markers; no downstream blocking behavior is implied. |
| `valid-review-not-required.json` carries `false`, `not_required`, and no review reason | Schema-valid shape only. No source lookup or trust decision is performed. |
| Review signal is omitted | Schema-invalid; a future runtime's rejection or hold behavior is not defined here. |
| Review flag, approval status, and reason code contradict one another | Schema-invalid. Schema consistency does not establish that the upstream values are authoritative. |
| Payload adds an `approval_reference` or other undeclared approval claim | Schema-invalid. The review-required signal is not a human approval. |
| Root `request_id` differs from `source.request_id`, or the `plan_id` belongs to another source chain | JSON Schema cannot establish equality or chain membership; a future semantic traceability check is required. |
| A WF-02 flag comes from a title or requirement while no WF-03 task itself looks high-risk | Candidate shape retains the plan-level signal. Under option 1, affected tasks cannot be identified without requirement/task attribution; under option 2, the whole plan would be held. Neither behavior is selected. |
| A reviewed task has multiple transitive dependents and an independent task exists | If option 1 is selected, a future behavioral test must verify the chosen transitive dependent closure and independent-task treatment. If option 2 is selected, a future test must verify that every task is held. No result is asserted by these fixtures. |
| The upstream signal is missing, stale, unverifiable, or from a non-planned WF-02 record | Source validation and fail-closed behavior remain undecided; schema validity is insufficient. |
| WF-03 independently detects high impact in a task | The existing WF-03 task-level gate is separate. This proposal neither removes nor changes that behavior. |
| A reviewer later decides to approve or reject | No approval record, identity, permission check, lifecycle, or state transition is defined by this proposal. |
| WF-03 returns a result after a future policy is selected | The output state, `execution_order`, `blocked_task_ids`, provenance, and distinction between review-required and approved remain to be designed. |
| A request could trigger CI, an action, Slack, or another external notification | This proposal adds no CI gate, approval, execution, or notification behavior. |

Review the policy alternatives and unresolved authority, traceability, propagation, dependent-blocking, and result-schema decisions in [`workflows/WF-02-03-review-signal/README.md`](../workflows/WF-02-03-review-signal/README.md) before any runtime implementation.
