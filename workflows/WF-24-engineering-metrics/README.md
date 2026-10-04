# WF-24 — Daily Engineering Metrics (Proposal)

> **Proposal only.** This document proposes a candidate-envelope shape for review. It does not connect to or read source systems, calculate or verify metrics, schedule a report, generate a brief, persist or publish data, gate CI, trigger an operational decision, or send notifications.

## Purpose and scope

The roadmap places **WF-24 Daily engineering metrics** after WF-23, but the label does not define the metrics, data sources, aggregation, audience, or intended use. There is no WF-24 contract, runtime, or open GitHub issue on `main`.

This proposal uses a narrow `REPORT_ENGINEERING_METRICS_CANDIDATE` envelope only to make one possible input boundary reviewable. A schema-valid object is unverified caller-supplied metadata and numeric claims; it is not a measurement, verified fact, performance assessment, report, or permission to collect or disclose data. The JSON Schema is [`schema.json`](schema.json), and [`examples/`](examples/) contains synthetic shape fixtures only.

The envelope contains:

- `action`: a proposed label only; it does not initiate reporting or computation.
- `request_id` and `candidate_id`: opaque caller-supplied identifiers. Issuer, trust, uniqueness, canonical identity, replay, and deduplication semantics are undefined.
- `source`: a bounded label, not an authenticated provider, resolved source, or proof of provenance.
- `period_label`: caller-supplied text, not a parsed or approved definition of a daily window, timezone, calendar, or data snapshot.
- `metrics`: one to 25 entries, each with a bounded `metric_key`, numeric `value`, and bounded `unit`. These are unverified claims only; the schema does not define metric meaning, formula, aggregation, precision, or comparability.

The candidate shape contains no raw events, person identifiers, or dimension/breakdown fields. Undeclared properties are rejected. This is not a guarantee that allowed strings are safe: the schema cannot detect secrets, personal or sensitive data, false claims, or instruction-like text. Do not use real or sensitive data in fixtures or candidate strings.

## Safety boundaries

- No repository, CI, database, telemetry, analytics, HR, calendar, network, or external service is accessed; no source data is read, collected, joined, or aggregated.
- No metric catalog, formula, denominator, filter, comparison baseline, threshold, quality rule, freshness requirement, rounding rule, or definition of “daily” is established or applied.
- A schema-valid entry does not establish that a metric was measured, that its value is accurate or current, or that two values are comparable. Caller-provided names, labels, numbers, and text are untrusted.
- The proposal is aggregate-shaped only. Do not include raw events, personal data, individual rankings, employee or contractor performance scores, or fine-grained dimensions. No identity, consent, minimum-group-size, privacy, or access policy is defined; the schema cannot sanitize allowed strings.
- No report, narrative, recommendation, alert, evaluation, or decision is generated. No high-impact action is authorized or performed; any future such behavior requires separately settled requirements and explicit human approval.
- No candidate or metric is stored, indexed, published, corrected, or deleted. No lifecycle, retention, access log, audit record, or source of truth is defined.
- No CI gate, release decision, staffing or employment decision, operational change, approval path, retry, recovery, or result schema is defined.
- Slack and all other notifications and external side effects are out of scope.

## Acceptance scenarios

See [`tests/wf-24-engineering-metrics.md`](../../tests/wf-24-engineering-metrics.md). Fixtures validate candidate shape only; they do not connect to a source, verify values, compute metrics, or define a reporting service.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The roadmap label is represented by an aggregate-metric candidate envelope only to make one possible input boundary reviewable. Decide whether WF-24 is a metrics catalog, collection pipeline, calculation service, report, or several workflows.
2. Decide how WF-24 relates to WF-21/22 daily brief and reporting: separate ownership and outputs, an upstream source, a consumer, or an overlapping workflow.
3. Decide the intended audience and purpose, metric domains, and whether any metrics are explicitly excluded. Candidate keys and example values here are not an approved metric set.
4. Define every metric's canonical name, formula, unit, numerator/denominator, filters, aggregation, precision, rounding, baseline, and interpretation. Specify whether the schema needs a controlled metric catalog rather than free-form keys.
5. Decide supported source systems, owners, authorization, authentication, source identity, provenance, snapshot/revision pinning, and handling of unavailable, stale, late, duplicated, partial, or conflicting data.
6. Define “daily”: timezone, calendar versus rolling/business-day boundaries, daylight-saving changes, weekends, cutoff time, late-arriving events, and period labeling.
7. Decide whether only organization-level aggregates are permitted or whether team/repository/project breakdowns are required. Explicitly settle whether individual-level data is prohibited; if any finer granularity is proposed, define privacy, consent, access, minimum-group-size, and anti-reidentification controls before real data is handled.
8. Decide numeric bounds, precision, supported units, empty-period behavior, missing values, and what constitutes valid, complete, comparable, or publishable metrics. No semantic validation is proposed here.
9. Decide who may submit candidates, who issues the identifiers, uniqueness and deduplication scope, idempotency, conflict handling, replay, corrections, versioning, and retry behavior.
10. Decide whether records are transient or persisted, the source of truth, access and audit requirements, retention, deletion, correction history, observability, and recovery.
11. Decide whether a metric snapshot is ever rendered or distributed, its audience, authorization, destination, format, and disclosure controls. Slack and all other notifications remain out of scope until explicitly requested and requirements are settled.
12. Decide whether AI may summarize or interpret metrics; define source grounding, evaluation, prompt-injection handling, human review, and whether generated text may be retained or shared.
13. Decide whether results may affect CI, releases, alerts, management, staffing, employment, or other operational outcomes. No gate, recommendation, or high-impact action is authorized by this proposal; any future execution requires explicit human approval and settled policy.
14. Define ownership, status/result semantics, error reporting, monitoring, service-level expectations, and any downstream workflow contract before runtime behavior is designed.
15. Review the schema bounds (100 characters for each identifier and metric key, 255 for `source`, 100 for `period_label`, 32 for `unit`, and at most 25 metric entries); these are proposal-shape limits only, not approved operational limits.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.
