# WF-25 — Human Approval Decision Records (Proposal)

> **Proposed preferred direction (Version 3), proposal only—not settled policy.** Version 1 is preserved as the initial broad lifecycle exploration, and Version 2 is preserved as the prior narrow task-level decision-record candidate. Neither is an approved contract, roadmap commitment, implementation instruction, or authorization to change workflow behavior.
>
> This proposal adds documentation only. It does not change runtime code, schemas, validator behavior, approval authority, stored data, or workflow side effects.

## Repository context

At baseline `cbdd0bd2cd69c626ccd8e357ef36adaf144836fc`, WF-03 returns `APPROVAL_REQUIRED` for an orchestration result when it has one or more blocked tasks. The specific task IDs are listed in `blocked_task_ids`; the state itself is result-level, not a per-task state. A candidate decision record concerns one selected blocked task from one such result. WF-03 currently does not accept a decision record, approve a task, or execute one. The WF-02→WF-03 pending-review signal is not an approval.

## Version 1 — Initial broad lifecycle proposal (historical; superseded)

The initial broad concept explored a lifecycle for approval requests and their decision records, potentially spanning request submission, reviewer assignment, one or more decisions, closure, and later changes to a decision. A record might refer to a request, plan, task, or another subject; carry a decision and decision time; and link to supporting evidence. A broader lifecycle might also define pending, approved, rejected, expired, revoked, superseded, or withdrawn records and how they are audited.

These were exploration topics, not selected semantics. Version 1 did not establish record fields, states, transition rules, storage, an authoritative source, or permission for a downstream workflow to act on a record.

### Open questions recorded in Version 1

1. **Scope and subject:** Is a decision attached to a request, a plan, an individual task, a set of tasks, or another immutable subject? Can one request contain multiple independently decided subjects?
2. **Identity authority:** Which system, if any, establishes reviewer identity, role, organization, and authority? How would identity be authenticated, resolved, and kept current? A caller-supplied identifier would not by itself prove identity or authority.
3. **Reviewer eligibility and separation of duties:** Who may request, decide, administer, or revoke a decision? Is self-approval prohibited, conditionally permitted, or allowed? How are conflicts of interest handled?
4. **Quorum and aggregation:** Is one reviewer sufficient, or is a quorum required? How do mixed, duplicate, abstaining, late, or conflicting decisions combine? Can an approval be partial or conditional?
5. **Expiry, revocation, and supersession:** Do requests or decisions expire? Who may revoke or supersede a decision, for what reasons, and what happens to prior records and any downstream state?
6. **Evidence and rationale:** Is evidence required, optional, or prohibited? May records contain free text, attachments, links, or only opaque references? What validation, confidentiality, provenance, and integrity rules apply?
7. **Retention and audit:** Are records persisted, and where is the source of truth? What access controls, audit history, retention period, correction/deletion process, legal-hold, and recovery requirements apply?
8. **WF-03 relationship:** How, if at all, would a decision refer to WF-03's request, plan, and blocked tasks? Could a future consumer ever use a decision to change a gate? Any such authority and behavior would need separate specification; Version 1 granted none.
9. **Lifecycle semantics:** What are the canonical statuses, allowed transitions, duplicate/replay behavior, correction rules, timestamps, and versioning semantics?
10. **Privacy and operations:** What data is necessary, who can read it, how are secrets or personal data excluded, and are notifications, escalation, or administrative tools in scope?

Version 1 is retained to show how the proposal began. It is not the current candidate and should not be read as an active broad WF-25 scope.

## Version 2 — Narrow decision-record candidate (historical; prior candidate)

### Candidate purpose and boundary

Describe one decision for one selected WF-03 task that appears in `blocked_task_ids` in an orchestration result whose state is `APPROVAL_REQUIRED`. The proposed binding is to that result's `request_id`, `plan_id`, the selected `task_id`, and a digest of the task subject. The candidate is deliberately narrower than a request/decision lifecycle: it does not define request intake, reviewer assignment, decision aggregation, or a downstream consumer.

The WF-03 state remains result-level even when the candidate refers to one task. These references describe the proposed record's subject; this document does not add validation or independently verify that the identifiers, result, task membership, or digest are authentic or current.

### Minimal conceptual decision description

The following are proposed descriptive values only, not a schema, API, database model, validator rule, or implemented record:

| Value | Candidate meaning |
|---|---|
| `request_id` | Request associated with the WF-03 result |
| `plan_id` | Plan associated with the result |
| `task_id` | One selected task from that result's `blocked_task_ids` |
| `subject_digest` | Digest intended to bind the decision description to the task subject being reviewed |
| `decision` | Exactly one proposed label: `APPROVE` or `REJECT` |
| `reviewer_ref` | Opaque reviewer reference; not a verified identity, role, or authority claim |
| `decided_at` | Timestamp describing when the decision was made; clock, format, and trust semantics remain open |

No evidence, rationale, reviewer name, or proof of authority is included in this minimal candidate. The digest's canonical input, canonicalization procedure, algorithm, and versioning are not defined. The table is illustrative and does not make any value mandatory or valid at runtime.

### Explicit non-effects and exclusions

- `APPROVE` is a decision label only. It does not mean that WF-03 or another system has authorized the action; it does not remove the task from `blocked_task_ids`, change `execution_order` or `state`, unblock dependents, or permit execution.
- `REJECT` is a decision label only. It does not set WF-03's `REJECTED` state, alter a task, or trigger a follow-up action.
- No reviewer identity, role, eligibility, quorum, self-approval rule, or approval authority is verified or established.
- No runtime handler, API, database table, persistence/write path, state transition, schema, schema-validator behavior, or repository policy is proposed for implementation in this change.
- No decision is used to release, route, retry, schedule, or execute work; no human or automated notification is sent; no external service is contacted.
- No evidence is collected or attached. No broader request/decision lifecycle, expiry job, revocation action, or record-retention operation is implemented.

### Remaining policy and design decisions

The narrow candidate leaves these decisions open rather than silently resolving them:

1. Who may issue a decision, what `reviewer_ref` refers to, whether identity/authority is established elsewhere, and what authorization or separation-of-duties policy applies.
2. Whether one decision is sufficient, whether quorum or multiple reviewers are required, how conflicting decisions are handled, and whether self-approval is permitted.
3. Whether and how decisions expire, are revoked, superseded, corrected, or reissued; what happens to prior records; and how a changed task subject affects a prior decision.
4. Whether evidence or rationale is needed, its allowed form and provenance, and the privacy, security, access, and data-minimization rules for it.
5. Whether records are stored, the system of record, record identifiers, audit/access controls, retention, deletion, and correction history.
6. The exact task fields covered by `subject_digest`, canonicalization, digest algorithm/version, and behavior for changed or mismatching subjects.
7. Timestamp format, timezone, clock source, precision, and whether the timestamp is trusted or merely reported.
8. Duplicate/replay semantics, idempotency, ordering, and handling of repeated or conflicting decisions for the same task.
9. Whether any future workflow may consume these records and, if so, its separate authority and exact behavior. No consumption or gate change is authorized here.

## Version 2 review boundary (historical)

Version 2 was a narrow description of one task-level decision record, not an approved human-approval policy. Its candidate fields and explicit non-effects are retained as proposal history; the two earlier iterations remain visible without treating Version 1's broader lifecycle as current scope.

## Version 3 — Proposed preferred direction: task-scoped approval and conditional release

### Proposed direction (not settled policy)

The proposed preferred direction for further review is that, under a future policy and separately authorized implementation, a valid approval by an authorized human for one specifically selected task in a WF-03 result could permit that task—and only dependents deemed eligible by a separately defined rule—to be released from the approval block. The approval would be scoped to that selected task, not unrelated blocked tasks; it would not mark work complete or execute it. What makes an approval valid, who is authorized to give it, and which dependents are eligible remain unsettled.

This direction preserves the distinction between plan/result-level `APPROVAL_REQUIRED` and task-level `blocked_task_ids`: the state describes the WF-03 result, while the list identifies blocked task IDs. A task-level approval would not mean the entire result is approved, and Version 3 does not add an `APPROVED` result state or change current WF-03 behavior.

### Partial release and result semantics remain unresolved

Before any runtime work, a future design must specify how a decision about one task affects `blocked_task_ids` when other tasks remain blocked, what result state is returned, and whether a changed result is recomputed or recorded separately. It must also define the eligibility rule for direct or transitive dependents, how outstanding dependencies affect release, and what `execution_order` means after a partial release. Version 3 selects none of those mechanics; until they are defined, the result state and task list keep their current meanings and behavior.

### Decisions that block runtime work

The following remain open and must be resolved before any runtime, schema, identity, or workflow change:

1. **Trusted identity and authentication:** Which trusted source establishes a human's identity and authority, and how authentication and authorization are verified.
2. **Reviewer eligibility and separation of duties:** Who may review, whether self-approval is allowed, and how conflicts are handled.
3. **Quorum and aggregation:** Whether one approval is sufficient, how multiple or conflicting decisions combine, and whether a decision may be conditional or partial.
4. **Expiry and revocation:** Whether an approval expires, who may revoke or supersede it, and how those actions affect already-unblocked tasks or dependents.
5. **Evidence and rationale:** Whether evidence or rationale is required, how it is validated, and its provenance, privacy, and access rules.
6. **Persistence, audit, and retention:** Whether decisions are persisted, the system of record, audit and access controls, correction/deletion behavior, and retention period.
7. **Partial-unblocking semantics:** The exact task/dependent eligibility rule and the effect on result state, `blocked_task_ids`, and `execution_order`.

### Proposal-only boundary

Version 3 records a preferred direction for review, not settled policy. It introduces no runtime behavior, schema, database, persistence path, identity verification, validator rule, state transition, unblocking operation, execution, or notification. The existing WF-03 contract remains unchanged; any future implementation requires the blocking decisions above to be settled and a separately authorized change.
