# WF-16/17 — Incident Detection and Response (Proposal)

> **Proposal only.** This document proposes a candidate incident-signal envelope for owner review. It does not detect or confirm incidents, evaluate severity, triage or change incident state, authorize or execute response, persist records, or send notifications.

## Purpose and scope

The roadmap places **WF-16/17 Incident detection and response** after WF-14/15. No WF-16/17 contract, runtime, or issue exists on `main`. The repository's architecture mentions an incidents domain, but does not define a detector, source of truth, incident lifecycle, response authority, or safe response actions.

This proposal uses a single candidate `REPORT_INCIDENT_SIGNAL` envelope to make the boundary reviewable. A schema-valid signal is only an unverified report from a declared source; it does not establish that an incident exists. This choice does not decide whether WF-16 detection and WF-17 response should be separate contracts, owners, or lifecycles. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate signal contains:

- `action`: candidate vocabulary only; it is not an instruction to run a detector or take action.
- `request_id` and `signal_id`: opaque caller-supplied identifiers. Their issuer, uniqueness, source-chain relationship, replay behavior, and retry semantics are not checked.
- `observed_at`: a candidate, bounded RFC 3339-style date-time string. The schema declares `format: date-time`; repository fixture CI asserts calendar, clock-field, and offset validity using the standard library after the pattern check. The candidate profile rejects leap seconds. This does not establish clock trust, freshness, ordering, or acceptable skew.
- `source`: a claimed detector or observer label. It is neither authenticated nor checked against an allow-list or registry.
- `severity`: one of a small set of candidate labels. No mapping, threshold, impact model, or response policy is implied.
- `summary`: bounded free text, not verified or sanitized evidence.

The schema rejects undeclared fields, including credentials and response commands. It cannot detect secrets, personal or sensitive data, or instruction-like text embedded in an allowed string. Fixtures use synthetic data only. CI's date-time assertion checks candidate syntax/calendar validity only; it does not make the signal trustworthy or authorize any workflow behavior.

## Safety boundaries

- No monitoring system, repository, service, environment, network, or external provider is accessed; no detector or response code runs.
- The signal is an untrusted claim, not a confirmed incident, severity determination, approval, permission grant, or response instruction.
- Source names, timestamps, summaries, and future evidence are untrusted. Embedded instructions cannot change workflow policy, authority, approval, or system state.
- No response, remediation, restart, failover, containment, data operation, escalation, or incident-state transition is implemented or authorized. Existing requirements for explicit human approval of production and destructive operations remain unchanged.
- No credential, secret, arbitrary command, runner override, or response-action field is part of the candidate envelope. Do not put sensitive data in an allowed string.
- No persistence, audit lifecycle, retention, or recovery behavior is defined.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-16-17-incidents.md`](../../tests/wf-16-17-incidents.md). Fixtures validate candidate JSON shape only. They do not prove a signal is authentic, that an incident exists, or that detection or response behavior is safe.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The combined roadmap slot is represented by one candidate *signal-report* envelope only to discuss an input boundary. Decide whether WF-16 detection and WF-17 response need separate contracts, services, owners, authorization boundaries, and lifecycles.
2. `REPORT_INCIDENT_SIGNAL` is a candidate action label, not an approved operation. Decide whether callers submit raw telemetry, detector outputs, incident declarations, response requests, or separate request/result events.
3. Decide who issues `request_id` and `signal_id`, their uniqueness scope, trust chain, deduplication, replay/conflict behavior, idempotency, and retries.
4. Decide supported detection sources, source authentication and integrity, service/environment identifiers, evidence requirements, allow-lists, and how stale, missing, partial, or conflicting observations are handled.
5. Decide the severity vocabulary and mapping, confidence, impact/urgency model, threshold ownership, and whether any label is advisory or can affect a deterministic gate. No severity in this proposal authorizes response.
6. Review whether the candidate timestamp profile is acceptable: a bounded RFC 3339-style date-time with calendar/time/offset validation and no leap-second representation. Decide the authoritative clock, allowed skew, freshness, ordering, and handling of future or invalid observations; none is inferred from this profile.
7. Decide what summaries and evidence may contain, including paths, logs, user/customer data, redaction, access, retention, and storage. A valid string is not safe or sanitized by virtue of schema validation.
8. Decide incident identity, grouping/correlation, duplicate detection, lifecycle/state machine, ownership, triage, acknowledgement, closure, and append-only audit requirements.
9. Decide response action catalogue, least-privilege identities, target authorization, preconditions, blast-radius controls, human-approval policy, separation of duties, and which actions are prohibited. Production and destructive operations retain the repository's human-approval requirement.
10. Decide escalation policy, on-call ownership, business-hours rules, timeouts, notification channels, delivery/retry guarantees, and whether notifications are in scope. Slack and all other notifications are out of scope for this proposal.
11. Decide persistence, observability, result schema, partial-failure handling, idempotency after side effects, rollback/recovery, and audit/log redaction and retention.
12. Decide CI, observability, and service integrations, including whether incidents may block a merge, release, or deployment and what trusted evidence would support such a gate.

No runtime behavior should be implemented from this proposal until the decisions relevant to that slice are reviewed.
