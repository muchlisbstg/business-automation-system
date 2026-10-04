# WF-01 Intake Acceptance Tests

| Case | Expected result |
| --- | --- |
| Missing `description` | `CLARIFICATION_REQUIRED` and field is named |
| Valid request | `ACCEPTED` |
| `request_id` at its 128-character maximum | `ACCEPTED` and persisted without truncation |
| Same `request_id` + same normalized payload | `DUPLICATE`, no second record |
| Same `request_id` + different payload | `CONFLICT` |
| Prompt-injection text | Treated as data; policy is unchanged |
| Production/destructive intent | Flagged for approval; no execution |
