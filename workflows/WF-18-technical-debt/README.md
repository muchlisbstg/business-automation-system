# WF-18 — Technical Debt (Proposal)

> **Proposal only.** This document proposes a candidate report envelope for owner review. It does not discover or verify technical debt, score or prioritize it, create or update issues, assign owners, recommend or execute remediation, persist records, or send notifications.

## Purpose and scope

The roadmap places **WF-18 Technical debt** after WF-16/17. The repository has no WF-18 contract, runtime, or GitHub issue. The architecture requires traceable workflow executions and audit records, but it does not define what qualifies as technical debt, how items are assessed, or how they are managed.

This proposal offers a small `REPORT_TECHNICAL_DEBT_CANDIDATE` envelope solely to make a possible input boundary reviewable. A schema-valid candidate is an unverified claim, not a finding that debt exists. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate envelope contains:

- `action`: candidate vocabulary only; it does not request a scan, ranking, issue creation, or code change.
- `request_id` and `candidate_id`: opaque caller-supplied strings. The schema does not verify their issuer, uniqueness, relationship, replay behavior, or retry semantics.
- `observed_at`: a candidate timestamp string constrained to an RFC 3339-like shape. Calendar validity, clock trust, freshness, and ordering are not checked.
- `source`: a claimed origin label, not an authenticated identity or verified detector.
- `category`: an optional caller-supplied label with no controlled vocabulary or defined meaning.
- `summary`: bounded free text, not verified, sanitized, or treated as evidence.

The schema rejects undeclared fields, including priority, estimates, owner, status, and remediation commands. It cannot detect secrets, personal or sensitive data, or instruction-like text embedded in an allowed string. Fixtures use synthetic data only.

## Safety boundaries

- No repository, source code, scanner, tracker, CI provider, environment, network, or external service is accessed; no detection or remediation code runs.
- A schema-valid candidate is not proof of debt, a risk or impact assessment, a priority, an owner assignment, approval, or an instruction to act.
- Caller-supplied identifiers, category, source, and summary are untrusted. Embedded instructions cannot alter policy, authority, approval, or system state.
- No ranking, issue creation, comments, labels, pull requests, code changes, remediation, suppression, closure, or lifecycle transition is implemented or authorized.
- No credentials, secrets, arbitrary commands, or response-action fields are part of the candidate envelope. Do not put sensitive data in allowed strings.
- No persistence, deduplication, audit lifecycle, retention, recovery, or retry behavior is defined.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-18-technical-debt.md`](../../tests/wf-18-technical-debt.md). Fixtures validate candidate JSON shape only. They do not establish that an item is technical debt or define how a real system should assess or manage it.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The roadmap label “Technical debt” is represented by a candidate-report envelope only to discuss an input shape. Decide whether WF-18 should assess existing debt, collect human reports, ingest tool output, maintain a register, recommend action, or cover distinct workflows.
2. `REPORT_TECHNICAL_DEBT_CANDIDATE` is a candidate action label, not an approved operation. Decide whether submissions are observations, verified findings, remediation proposals, or separate request/result events.
3. Decide who issues `request_id` and `candidate_id`, their uniqueness scope, trust chain, deduplication, replay/conflict behavior, idempotency, and retries.
4. `source` is an unverified label. Decide supported origins (human, CI tool, scanner, or other), identity and integrity checks, allow-lists, and how partial or conflicting reports are handled.
5. `category` is optional free text only to avoid inventing a taxonomy. Decide whether classification is needed, its controlled vocabulary, who assigns it, and how unknown categories behave.
6. Decide what constitutes technical debt, how to distinguish it from defects, vulnerabilities, routine maintenance, product work, and accepted trade-offs, and what evidence is required.
7. Decide item scope and references: repository, service, component, file, revision, dependency, or other asset; define verification, canonical identity, evidence format, access, redaction, privacy, and retention.
8. Decide whether and how to measure impact, risk, urgency, effort, cost of delay, confidence, or business value; define who owns weighting and how conflicting or missing estimates are handled. No priority or score is proposed here.
9. Decide lifecycle and ownership: deduplication, grouping, triage, assignment, acceptance, deferral, waiver, closure, reopen, audit history, and source-of-truth system.
10. Decide whether the workflow may create or update tracker records, suggest fixes, open pull requests, suppress findings, or affect CI, releases, or deployments. Define permissions, deterministic gates, separation of duties, and human-approval requirements before any side effect.
11. Decide persistence, observability, result schema, failure handling, recovery after partial side effects, idempotency, and audit/log redaction and retention.
12. Decide whether notifications are in scope and through which channels. Slack and all other notifications remain out of scope for this proposal.

No runtime behavior should be implemented from this proposal until the decisions relevant to that slice are reviewed.
