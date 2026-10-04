# WF-24 Daily Engineering Metrics Proposal Acceptance Scenarios

> These are proposed contract expectations, not an operational metrics service. JSON fixtures validate candidate-envelope shape only; they do not read source data, calculate or verify measurements, create a report, or authorize an action.

| Case | Expected |
|---|---|
| Validate `examples/valid.json` with its synthetic source label, period label, and aggregate metric entries | Schema-valid shape only; no metric, value, or reporting period is verified |
| Validate `examples/valid-alternate-source.json` | Schema-valid shape only; source and period labels remain unverified caller text |
| Omit a required field, including `period_label` | Rejected by schema validation |
| Use an empty required string, empty `metrics`, or a value beyond a declared bound | Rejected by schema validation |
| Use a string, object, or null for a numeric `value` | Rejected by schema validation |
| Provide more than 25 metric entries | Rejected by schema validation |
| Add an undeclared root-level property such as `person_dimensions` | Rejected by schema validation; no person-level breakdown is part of this candidate shape |
| Add an undeclared property such as `employee_id` to a metric entry | Rejected by schema validation |
| Reuse a `metric_key`, use an unknown key, or use an unfamiliar unit | No catalog lookup, duplicate resolution, normalization, or semantic validation occurs; those decisions remain open |
| Supply a different `source` or arbitrary `period_label` | Shape may validate; the source is not authenticated and the period does not define timezone or daily-window semantics |
| Supply a numeric value and a plausible engineering metric name | No formula, unit compatibility, aggregation, accuracy, freshness, comparability, or provenance check occurs |
| Request collection from a repository, CI system, database, telemetry, analytics, or another provider | No source is accessed; no events or observations are collected or joined |
| Request calculation, aggregation, validation, interpretation, or comparison of metrics | No metric processing occurs; the candidate's numbers remain unverified claims |
| Request individual rankings, employee or contractor scoring, or person-level attribution | No identity, ranking, assessment, or personnel decision is created; such fields are outside the proposed shape |
| Put a secret, personal or sensitive data, false claim, or instruction-like text in an allowed string | The schema cannot detect or sanitize the content; no processing is performed, and real or sensitive content must not be used in proposal fixtures |
| Request a daily brief, narrative, recommendation, alert, or publication | No report, summary, recommendation, alert, or publication is generated |
| Request storage, indexing, correction, retrieval, retention, or deletion | No data is stored or changed; lifecycle semantics remain undecided |
| Request a CI gate, release decision, operational change, or other high-impact action based on a value | No gate or action is created; this proposal grants no authority, and any future high-impact behavior requires settled requirements and explicit human approval |
| Ask to send results through Slack or another channel | No notification or external side effect occurs; channels remain out of scope |
| Processing fails or a candidate is submitted more than once | No persistence, idempotency, retry, recovery, deduplication, or rollback behavior is defined |

See [`workflows/WF-24-engineering-metrics/README.md`](../workflows/WF-24-engineering-metrics/README.md) for proposal boundaries and open decisions before any runtime implementation.
