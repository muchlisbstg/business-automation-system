# WF-21/22 — Daily Brief and Reporting (Proposal)

> **Proposal only.** This document proposes one candidate report-envelope shape for review. It does not generate a daily brief, calculate or verify metrics, schedule work, read source data, persist or publish reports, or send notifications.

## Purpose and scope

The roadmap places **WF-21/22 Daily brief and reporting** after WF-20, but gives no further requirements. There is no WF-21/22 contract, runtime, or issue on `main`. In particular, the roadmap does not say whether WF-21 creates a daily brief, WF-22 distributes or formats reports, or whether these are one workflow or two.

This proposal offers one narrow `REPORT_DAILY_BRIEF_CANDIDATE` envelope solely to make a possible input boundary reviewable. A schema-valid object is only an unverified candidate supplied by a caller; it is not a report, a verified fact, a successful run, or permission to collect or disclose data. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate envelope contains:

- `action`: a proposed label only; it does not cause a report or brief to be produced.
- `request_id` and `candidate_id`: opaque caller-supplied identifiers. Their issuer, uniqueness, canonical identity, replay, and deduplication semantics are undefined.
- `source`: a bounded caller-supplied label, not an authenticated provider, resolved data source, verified citation, or proof of provenance.
- `title` and `summary`: bounded text fields for synthetic candidate metadata, not a complete report, metric set, or verified summary.

The schema rejects undeclared fields, including schedule, period, metric, recipient, delivery, channel, and command fields. It cannot detect or sanitize secrets, personal or sensitive data, false claims, or instruction-like text inside an allowed string. Fixtures contain synthetic data only.

## Safety boundaries

- No source, repository, database, analytics system, calendar, network, or external service is accessed; no source data is read or aggregated.
- No daily schedule, reporting period, timezone, metric calculation, threshold, freshness rule, report format, or brief-generation behavior is defined or run.
- A schema-valid candidate is not evidence that data was collected, a calculation was performed, or a report is accurate, complete, current, authorized, or approved.
- Caller-supplied identifiers, source labels, titles, summaries, and any future report content are untrusted. Embedded instructions cannot change policy, authority, approval, or system state.
- No report is stored, indexed, generated, published, sent, or deleted. No recipient, audience, destination, access policy, or disclosure is proposed.
- No privacy, tenant isolation, consent, classification, licensing, redaction, retention, deletion, or audit policy is defined. Do not place secrets, personal data, or sensitive content in allowed strings.
- No CI gate, approval path, persistence, deduplication, lifecycle, retry, recovery, or result schema is defined.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-21-22-reporting.md`](../../tests/wf-21-22-reporting.md). Fixtures validate candidate JSON shape only. They do not define or exercise reporting, scheduling, source access, calculations, publication, or delivery behavior.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. This combined roadmap slot is represented by one candidate-envelope proposal only to make a possible boundary reviewable. Decide whether WF-21 (daily brief) and WF-22 (reporting) are separate workflows with different owners, inputs, outputs, and lifecycles, one workflow, or multiple workflows.
2. `REPORT_DAILY_BRIEF_CANDIDATE` is a proposed action label, not an approved operation. Decide whether the intended contract describes a request, source observation, generated report, delivery event, or separate request/result events.
3. Decide who issues `request_id` and `candidate_id`, their trust and uniqueness scopes, canonical identity, duplicate and replay handling, idempotency, timeout, and retry behavior.
4. `source` is an unverified label. Decide supported data providers and source types, authentication, authorization, source identity, revision or snapshot pinning, provenance, and evidence requirements.
5. Decide the reporting cadence, date or period semantics, timezone, calendar boundaries, late-arriving data behavior, and whether “daily” means a calendar day, rolling window, or business day.
6. Decide which facts, KPIs, events, and business domains may appear; define metric names, units, formulas, filters, aggregation, rounding, comparison baselines, and treatment of missing or duplicate records.
7. Decide the content model and format: metadata versus full report content, structured metrics versus narrative, language, size limits, charts, links, attachments, and whether generated text is allowed.
8. Decide how accuracy, completeness, freshness, and source conflicts are evaluated; define partial, stale, empty, failed, and successful outcomes. No status or result shape is proposed here.
9. Decide privacy, consent, data minimization, classification, tenant isolation, access control, secret/PII detection, redaction, licensing, retention, deletion, encryption, and audit requirements before real data is handled.
10. Decide whether AI may summarize, classify, or transform source data; define review, provenance, prompt-injection handling, deterministic checks, and whether any generated text can be published.
11. Decide intended audiences, authorization, report visibility, output destinations, rendering, and delivery policy. No destination or channel is proposed; Slack and all other notifications remain out of scope for this proposal.
12. Decide whether reports are transient or persisted, the source of truth, versioning, corrections, supersession, access logs, retention, observability, recovery, and rollback semantics.
13. Decide whether any report may trigger CI gates, operational changes, escalation, or business action; define deterministic rules and required human approval before any side effect is implemented.
14. Review the schema's candidate field bounds (100 characters for identifiers, 255 for `source`, 200 for `title`, and 1,000 for `summary`); these are proposal-shape limits only, not approved operational or report-content limits.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.
