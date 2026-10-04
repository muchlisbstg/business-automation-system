# WF-25 — Human Approval Decision Records

## Version 1 — Initial broad lifecycle proposal

> **Proposal only; initial draft.** This version explores a broad request-and-decision-record lifecycle. It is preserved as the first iteration, not as an approved contract or implementation instruction. No runtime, schema, validator behavior, approval authority, or workflow side effect is introduced by this document.

### Context

At the verified repository baseline `cbdd0bd2cd69c626ccd8e357ef36adaf144836fc`, WF-03 can return `APPROVAL_REQUIRED` for an orchestration result and identify blocked tasks in `blocked_task_ids`. That gate is not an approval decision: WF-03 does not approve tasks, execute them, or verify an approval authority. The existing WF-02→WF-03 review signal is also a pending-review signal, not approval.

### Initial broad concept

WF-25 could define a lifecycle for approval requests and their decision records, potentially spanning request submission, reviewer assignment, one or more decisions, closure, and later changes to a decision. A record might refer to a request, plan, task or other subject; carry a decision and decision time; and link to supporting evidence. A broader lifecycle might also define how pending, approved, rejected, expired, revoked, superseded, or withdrawn records are represented and audited.

These are exploration topics only. They do not establish record fields, states, transition rules, storage, an authoritative source, or the right for any downstream workflow to act on a record. No state name or lifecycle transition above is adopted.

### Open questions in Version 1

1. **Scope and subject:** Is a decision attached to a request, a plan, an individual task, a set of tasks, or another immutable subject? Can one request contain multiple independently decided subjects?
2. **Identity authority:** Which system, if any, establishes reviewer identity, role, organization, and authority? How would identity be authenticated, resolved, and kept current? An identifier supplied by a caller would not by itself prove identity or authority.
3. **Reviewer eligibility and separation of duties:** Who may request, decide, administer, or revoke a decision? Is self-approval prohibited, conditionally permitted, or allowed? How are conflicts of interest handled?
4. **Quorum and aggregation:** Is one reviewer sufficient, or is a quorum required? How do mixed, duplicate, abstaining, late, or conflicting decisions combine? Can an approval be partial or conditional?
5. **Expiry, revocation, and supersession:** Do requests or decisions expire? Who may revoke or supersede a decision, for what reasons, and what happens to prior records and any downstream state?
6. **Evidence and rationale:** Is evidence required, optional, or prohibited? May records contain free text, attachments, links, or only opaque references? What validation, confidentiality, provenance, and integrity rules apply?
7. **Retention and audit:** Are records persisted, and where is the source of truth? What access controls, audit history, retention period, correction/deletion process, legal hold, and recovery requirements apply?
8. **WF-03 relationship:** How, if at all, would a decision refer to WF-03's request, plan, and blocked tasks? Could a future consumer ever use a decision to change a gate? That authority and behavior must be separately specified; this proposal does not grant it.
9. **Lifecycle semantics:** What are the canonical statuses, allowed transitions, duplicate/replay behavior, correction rules, timestamps, and versioning semantics?
10. **Privacy and operations:** What data is necessary, who can read it, how are secrets or personal data excluded, and are notifications, escalation, or administrative tools in scope?

### Version 1 boundary

This broad framing is not a selected design. In particular, no record may be treated as authorization to unblock, route, execute, or otherwise change a workflow. The next iteration narrows the subject to a single WF-03 blocked task and a minimal decision description, while leaving policy and operational authority unresolved.
