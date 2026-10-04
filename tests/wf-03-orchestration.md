# WF-03 Acceptance Tests

| Case | Expected |
|---|---|
| Linear dependency graph | Deterministic topological execution order |
| Independent tasks | Lexical `task_id` tie-breaking |
| Unknown dependency | `INVALID_DEPENDENCY` |
| Dependency cycle | `CYCLE_DETECTED` |
| Duplicate task ID | Rejected |
| Same `plan_id` replay | `DUPLICATE`, no second orchestration record |
| Same `plan_id`, changed content | `CONFLICT` |
| WF-01 request ID of 128 characters in root and WF-02 source | Accepted and persisted; source ID still matches root |
| Missing review signal, mismatched source request ID, or non-`PLANNED` WF-02 source | Rejected with no execution order |
| WF-02 review-required requirement is linked to a task | Task and every transitive dependent are blocked; unrelated tasks keep deterministic order |
| Review requirement ID is not linked to a task | Rejected and all listed tasks blocked |
| Production/destructive task | `APPROVAL_REQUIRED`, never executed |
| Prompt injection | Treated as data; cannot change state or permissions |
| AI approval/completion claim | Ignored without authoritative record |
