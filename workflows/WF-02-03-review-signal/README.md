# WF-02→WF-03 Human-Review Signal Bridge (Proposal)

> **Proposal only.** This document and schema describe a candidate handoff shape, not current runtime behavior. They do not authenticate a WF-02 record, approve work, block tasks, change WF-03 results, execute work, or send notifications.

## Purpose and current contract gap

WF-02 returns `human_review_required`, `approval_status` (`not_required` or `pending_human_review`), and `reason_codes`. WF-03 accepts `request_id`, `plan_id`, and `tasks`; its schema rejects undeclared properties. A direct WF-02 response is therefore not a WF-03 input, and a bridge that copies only the fields WF-03 currently accepts can lose the WF-02 review signal. WF-03 separately detects high-impact task content and blocks those tasks and their transitive dependents, but that does not preserve a plan-level WF-02 signal when task-level indicators are absent.

The candidate schema is [`schema.json`](schema.json), with synthetic shape examples in [`examples/`](examples/). Candidate acceptance scenarios are in [`tests/wf-02-03-review-signal.md`](../../tests/wf-02-03-review-signal.md). The schema validates structure and consistency between the two review-status fields only; it cannot establish source authority or record relationships.

## Candidate bridge shape

The proposed envelope carries the existing WF-03 identifiers and task list, a `source` reference (`workflow: WF-02` and source `request_id`), and a `review_signal` containing the WF-02 `human_review_required`, `approval_status`, and `reason_codes` values. The schema requires the two review fields and reason code to agree with one another. It intentionally has no approval identity, approval reference, execution command, notification target, or selected propagation policy.

`request_id` and `source.request_id` are both present to make the claimed source reference explicit. Their equality, the link between that WF-02 record and `plan_id`, task derivation, source record state/version, and whether the submitting caller may assert these values are semantic and authority checks that this schema cannot perform. These are not established merely because an instance is schema-valid.

## Policy choices still open

| Choice | Scope if later selected | Tradeoff and prerequisites |
|---|---|---|
| **Option 1 — flag related tasks and their dependents for human review** | Mark only tasks attributable to the review-triggering requirement(s), plus every transitive dependent. Unrelated tasks could remain eligible for orchestration. | Preserves progress on unrelated work, but requires WF-02 to identify affected requirement/task IDs and WF-03 to compute and report a deterministic dependent closure. WF-02 currently emits a plan-level boolean/reason, not a per-requirement or per-task review map; selecting this option without adding trusted attribution risks under-blocking or arbitrary scope. |
| **Option 2 — hold the whole plan if any requirement is high-risk** | If the authoritative WF-02 signal says review is required, withhold every task in the plan until an authorized decision is recorded. | Uses the plan-level signal conservatively and avoids guessing which tasks are related, but blocks unrelated work and reduces throughput. It still needs a defined authority and approval record; a pending-review flag is not itself approval. |

**Neither option is selected by this proposal.** The schema carries the source signal without assigning it downstream effect. Do not implement either policy, or infer approval, until the policy owner chooses between them and resolves the decisions below.

## Unresolved decisions before runtime work

1. **Authority:** Who owns the policy choice? Which system or principal is authoritative for WF-02 signal values, who may record the human decision, and what durable evidence makes that decision valid? WF-02's detector indicates review is required; it does not constitute a human review or approval.
2. **Traceability:** What immutable/versioned WF-02 record reference or digest binds the signal to the exact `request_id`, `plan_id`, tasks, and source chain? How are replayed WF-02 responses distinguished from the canonical stored result? The candidate's IDs are claims only.
3. **Propagation and failure handling:** Must every WF-03 request carry the signal, including `false`? What happens when it is missing, contradictory, stale, unverifiable, or from a non-`PLANNED` WF-02 result? Whether to reject, clarify, or hold is unresolved; no behavior is implied here.
4. **Task attribution and dependent blocking:** If option 1 is chosen, how are reviewed requirements mapped to tasks, and are all transitive descendants held even if they also depend on unrelated tasks? If option 2 is chosen, should the result list every task as blocked or use a plan-level hold? These rules need an explicit owner and deterministic semantics.
5. **WF-03 output contract:** Decide whether to retain `APPROVAL_REQUIRED` or add a plan-level review state; define `execution_order`, `blocked_task_ids`, reason codes, source provenance, and whether the response distinguishes “review required” from “approval granted.” The current result schema has no upstream signal or review-decision fields.
6. **Persistence and replay:** Decide what is stored, how signal changes affect immutable `plan_id` conflict/replay semantics, and how a later human decision is represented without allowing an untrusted caller to self-approve.

## Safety boundary and recommendation

This proposal changes no runtime code, API, database schema, CI workflow definition or validator logic, approval path, execution path, or external notification behavior. The existing generic contract checks may discover and validate this schema and its fixtures as they do other workflow proposals; that is shape validation only, not a new operational gate. Slack and all other notifications are out of scope.

The recommended next step is **no runtime behavior change**: first settle the policy choice and authority, then review the traceability, propagation, dependent-blocking, and output-schema decisions. The synthetic fixtures demonstrate only whether candidate JSON has the declared shape; they do not demonstrate enforcement, record lookup, human review, authorization, or execution.
