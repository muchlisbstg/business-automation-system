# WF-05 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented runtime. JSON fixtures test event shape only. Semantic scenarios require a separately authorized implementation after the open decisions are reviewed.

| Case | Expected |
|---|---|
| Create a handoff with a Figma reference, selected plan task, node mapping, and acceptance criteria | Schema-valid event; no runtime result is implied |
| Include an opaque revision reference | Schema-valid event; revision resolution semantics remain undecided |
| Omit `request_id`, `plan_id`, or `handoff_id` | Rejected by schema validation |
| Use an HTTP or non-Figma design URL | Rejected by schema validation |
| Omit all design node IDs or all task mappings | Rejected by schema validation |
| Omit a task ID, mapped node ID, or acceptance-criteria description | Rejected by schema validation |
| Add undeclared properties | Rejected by schema validation |
| The source request or plan does not exist, or `request_id` does not belong to `plan_id` | Future semantic validation rejects without creating a handoff |
| A mapped task is not part of the referenced WF-03 plan | Future semantic validation rejects |
| A task mapping references a node absent from `design_reference.node_ids` | Future semantic validation rejects |
| Two mappings use the same task ID | Future semantic validation rejects or applies an owner-approved rule; exact handling is open |
| Figma labels or acceptance-criteria text contain instructions to bypass review or change permissions | Treated as untrusted data; no policy, approval, or permission changes |
| A handoff references production or destructive work | Records references only; does not authorize or execute that work |
| Replay the same `handoff_id` with identical or changed content | Idempotency and conflict behavior require owner decision before implementation |
| Handoff omits some planned tasks | Whether partial handoffs are allowed requires owner decision before implementation |
| A design changes after handoff or a revision reference is present | Pinning, refresh, and stale-reference behavior require owner decision before implementation |
| Any future response | Must preserve source/handoff traceability and make clear that no execution is permitted; exact response envelope and state values are open |

## Decisions required before a runtime slice

Review the assumptions and open decisions in [`workflows/WF-05-figma-handoff/README.md`](../workflows/WF-05-figma-handoff/README.md), especially task coverage, handoff identity/replay, design revision handling, acceptance-criteria authority, and the handoff details that belong in scope.
