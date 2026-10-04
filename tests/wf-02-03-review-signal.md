# WF-02→WF-03 Human-Review Signal Acceptance Tests

| Case | Expected behavior |
|---|---|
| Request title contains high-impact intent | WF-02 marks every requirement for review and returns a sorted `review_requirement_ids` list. |
| A requirement description or acceptance criterion contains high-impact intent | WF-02 marks only that requirement for review. |
| A task title contains high-impact intent | WF-02 attributes review to that task's validated `requirement_ids`. |
| No WF-02 high-impact intent is detected | WF-02 returns `human_review_required: false`, `approval_status: not_required`, and an empty ID list. |
| WF-02 planning result is replayed | The persisted review requirement IDs are returned unchanged. |
| WF-02 planning result is replayed after an invalid or unmapped result | `planning_state` retains the persisted non-`PLANNED` state; WF-03 rejects that source. |
| WF-03 source declares a non-`PLANNED` WF-02 result | Schema validation rejects the handoff. |
| WF-03 review signal is missing or internally inconsistent | Schema validation rejects the request; no execution order is returned. |
| WF-03 source request ID differs from root `request_id` | WF-03 rejects the request and blocks all listed tasks. |
| WF-01 request ID is 128 characters | WF-02 planning and both WF-03 source/root fields accept and preserve the ID. |
| A review requirement ID is not linked to any WF-03 task | WF-03 rejects the request and blocks all listed tasks rather than dropping the signal. |
| A task links to a review-required requirement | WF-03 includes that task in `blocked_task_ids`. |
| A task transitively depends on a blocked task | WF-03 includes the dependent task in `blocked_task_ids`, even if it also has unrelated requirement links. |
| An unrelated task has no dependency path from blocked work | It remains in `execution_order`; the order is deterministic under task-array reordering. |
| WF-03 independently detects a high-impact task | The existing local gate still blocks that task and its transitive dependents. |
| Review remains pending | WF-03 returns `APPROVAL_REQUIRED`; it does not claim approval, execute work, or mark tasks complete. |
| Review signal changes for a previously used `plan_id` | The changed canonical payload returns `CONFLICT`; the original record is not overwritten. |
| A signal is absent, false, or true | WF-03 does not send Slack or other external notifications. |
| The bridge schema is maintained separately from the active WF-03 schema | CI rejects contract drift while allowing distinct `$id` and `title` metadata. |
