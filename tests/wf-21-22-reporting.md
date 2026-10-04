# WF-21/22 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of a reporting or daily-brief runtime. JSON fixtures validate candidate envelope shape only; they do not read data, calculate metrics, generate reports, schedule work, or send notifications.

| Case | Expected |
|---|---|
| Provide a synthetic candidate with the proposed action, identifiers, source label, title, and summary | Schema-valid shape only; no report generation, source verification, or data collection is implied |
| Provide a different bounded source label | Schema-valid shape only; the label does not authenticate a provider, identify a real source, or prove provenance |
| Omit `action`, `request_id`, `candidate_id`, `source`, `title`, or `summary` | Rejected by schema validation |
| Supply an empty required text field or a value beyond its candidate bound | Rejected by schema validation |
| Supply whitespace-only `request_id`, `candidate_id`, `source`, `title`, or `summary` | Rejected by schema validation; values are not trimmed or normalized |
| Add undeclared metric, period, timezone, schedule, recipient, delivery, channel, or command fields | Rejected by schema validation; none of these semantics is defined |
| Include a `delivery` field naming Slack | Rejected by schema validation; Slack and all other notifications are out of scope |
| Reuse an identifier, name an unknown source, or submit conflicting candidates | No lookup, authentication, deduplication, replay, or conflict resolution occurs; those semantics remain open |
| Put a secret, personal data, sensitive information, false claim, or instruction-like text in an allowed string | The schema cannot detect or sanitize it; this proposal performs no processing and content-safety rules remain open |
| Ask for a daily brief, aggregation, KPI calculation, comparison, or narrative from source data | No data is read and no calculation, assessment, or generation occurs |
| Provide missing, stale, late, partial, duplicate, or conflicting source data | No freshness, completeness, reconciliation, or result-state behavior is defined |
| Request a schedule, timezone, reporting window, or business-day boundary | No scheduler or time-window semantics are defined |
| Request publication, recipient selection, access filtering, or persistence | No report is generated, stored, published, or disclosed; authorization and lifecycle decisions remain open |
| A candidate would trigger a CI gate, operational change, or business action | No status, approval, gate, or side effect is created |
| Processing or a future side effect fails partway through | No persistence, retry, recovery, or rollback behavior is defined |
| A candidate might trigger a Slack or other notification | Out of scope; this proposal sends no notifications |

Review the assumptions and open decisions in [`workflows/WF-21-22-reporting/README.md`](../workflows/WF-21-22-reporting/README.md) before any runtime implementation.
