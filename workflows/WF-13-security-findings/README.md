# WF-13 — Security Findings (Proposal)

> **Proposal only.** This document proposes a candidate shape for reporting security findings. It does not run a scanner, inspect a repository, verify a report, store or triage findings, create a CI gate, publish a status, or send notifications.

## Purpose and scope

The roadmap places **WF-13 Security findings** after WF-12. No WF-13 contract, runtime, or issue exists on `main`. This proposal chooses a scanner-neutral **finding-report envelope** for review; it is not an approved requirement or current repository behavior. Whether WF-13 should instead request scans, normalize scanner results, or cover both remains open.

The JSON Schema is [`schema.json`](schema.json), with positive and negative shape examples in [`examples/`](examples/). The candidate report contains:

- `action`: `REPORT_SECURITY_FINDINGS`.
- `request_id`, `plan_id`, and `security_run_id`: caller-supplied opaque trace references. Their source, existence, relationship, uniqueness, replay behavior, and retry semantics are not verified.
- `target`: a declared repository owner/name and a 40- or 64-character hexadecimal commit SHA. These are identifiers only; neither repository nor commit is looked up or authorized.
- `findings`: zero or more proposed records, each carrying an opaque `finding_id`, `source`, `rule_id`, a candidate severity label, and a bounded human-readable `summary`. The report is an unverified claim; it does not establish that a scan ran or that the findings are complete or accurate.

The schema rejects undeclared properties, including credential-shaped fields. It cannot detect a secret or sensitive excerpt placed inside an allowed string. No real findings, credentials, source excerpts, or sensitive data belong in fixtures or a future request without an approved data-handling policy.

## Safety boundaries

- No repository, scanner, artifact, network, or external-service access occurs; no code executes and no finding is verified or persisted.
- No credential, secret, arbitrary command, runner configuration, or prompt override is represented by the event.
- Repository contents, scanner output, finding summaries, and any future evidence are untrusted. Embedded instructions cannot alter policy, access, approval, or workflow state.
- The candidate report grants no authority to block or approve a merge, release, deployment, production operation, or security exception. Deterministic policy and required human approval remain authoritative.
- This proposal does not authorize code changes, issue creation, comments, checks/statuses, alerts, remediation, suppression, or exception handling.
- Production data, destructive operations, external side effects, and real communications are not authorized.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-13-security-findings.md`](../../tests/wf-13-security-findings.md). Fixtures validate candidate JSON shape only. Scanner selection and execution, report authenticity, target resolution, severity interpretation, deduplication, persistence, triage, and gating are not implemented.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. This proposal models a **finding report**, not a scan request. Owners must decide whether WF-13 reports findings, requests a scan, normalizes scanner output, or has separate request/result contracts.
2. Supported security domains and tools are undefined. Decide whether and how to cover source analysis, dependency vulnerabilities, secret detection, infrastructure/configuration, containers, or other categories, and select any scanner formats or standards.
3. Repository plus immutable commit SHA is a candidate target only. Artifact/image targets, forks, branches, source provenance, target authorization, eligibility, and stale-target behavior need a reviewed policy.
4. The `source` field is an unverified label. Scanner identity, authentication, report integrity/attestation, trust boundaries, and source allowlists are undecided.
5. `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`, and `UNKNOWN` are candidate severity labels only. Mapping to CVSS, CWE, vendor taxonomies, confidence, exploitability, and policy thresholds is open.
6. Finding identity, scope of `finding_id`, duplicate handling, deduplication across runs, stable IDs, re-scan behavior, lifecycle, triage, false-positive handling, suppression, and waivers are undefined.
7. The candidate `summary` must not be treated as sanitized evidence. Decide whether to include paths, line numbers, code snippets, proof-of-concept data, remediation guidance, or external references, and define redaction, privacy, storage, access, and retention before accepting real reports.
8. Empty reports, partial scans, scanner errors, timeouts, unavailable checks, and malformed or conflicting results need distinct semantics. An empty `findings` array is schema-valid but does not prove a successful clean scan.
9. A report does not define whether findings are advisory or blocking, what CI/branch-protection gates apply, who may acknowledge them, or whether any exception is possible. AI or scanner output must not bypass deterministic policy or required human approval.
10. No persistence, audit-evidence, remediation, or notification lifecycle is defined. Slack and other notification destinations remain out of scope.

No runtime behavior should be implemented from this proposal until the decisions relevant to that slice are reviewed.
