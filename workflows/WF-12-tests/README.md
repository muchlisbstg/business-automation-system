# WF-12 — Tests and Coverage (Proposal)

> **Proposal only.** This contract defines a candidate request shape, not a test-runner or execution policy. It does not resolve source code, launch tests, build or download artifacts, collect coverage, persist results, gate CI, publish comments/statuses, or send notifications.

## Purpose and scope

The roadmap places **WF-12 Tests and coverage** after WF-10/11. No WF-12 runtime or contract existed when this proposal was prepared. This document proposes only a request-shape candidate so owners can review the intended boundary before execution behavior is designed.

The JSON Schema is [`schema.json`](schema.json); positive and negative shape examples are in [`examples/`](examples/). The candidate event contains:

- `action`: `REQUEST_TEST_RUN`.
- `request_id`, `plan_id`, and `test_run_id`: caller-supplied opaque trace references. Their existence, source, relationship, uniqueness, replay behavior, and retry semantics are not verified.
- `target`: a declared repository owner/name and a 40- or 64-character hexadecimal commit SHA. These are identifiers only; the repository and commit are not looked up or authorized.
- `requested_checks`: one or more distinct proposed categories: `UNIT`, `INTEGRATION`, `API_CONTRACT`, `END_TO_END`, and `COVERAGE`. These labels request categories only; they do not identify a runner, suite, command, test inventory, metric, threshold, or pass/fail rule.

Unknown properties are rejected, including credential-like fields. A schema-valid request is not proof of repository access, commit existence, test availability, or permission to execute code.

## Safety boundaries

- No GitHub, repository, network, artifact, or test-runner access occurs. No project code or tests execute and no coverage is collected under this proposal.
- No credential, secret, arbitrary command, runner configuration, or prompt override is represented by the event.
- Repository contents, test definitions, fixtures, dependencies, logs, and any future test output must be treated as untrusted. Any future execution requires a reviewed isolation, least-privilege, secret-handling, and network-access design; this proposal defines none.
- A requested test category or hypothetical test result cannot authorize a merge, release, deployment, production operation, or bypass of repository policy. Deterministic gates and required human approvals remain authoritative.
- Production data, destructive operations, external side effects, and real communications are not authorized. Data handling and cleanup rules remain undecided.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-12-tests.md`](../../tests/wf-12-tests.md). Fixtures validate JSON request shape only. Repository resolution, source-chain validation, authorization, test selection and execution, coverage measurement, result interpretation, persistence, and CI gating are not implemented.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The next roadmap milestone is WF-12 Tests and coverage. Whether unit, integration, API-contract, end-to-end, and coverage checks belong to one workflow or separate workflows is open.
2. The action name and three trace-reference fields are candidate vocabulary only. Their source of truth, relationship to WF-02 planning, uniqueness scope, idempotency, replay handling, and retry behavior are undecided.
3. A repository plus immutable commit SHA is proposed as the target. Repository hosting, fork handling, source provenance, authorization, commit eligibility, and the treatment of a changed or stale target require a reviewed design.
4. The five `requested_checks` values are illustrative labels, not an exhaustive or approved taxonomy. Owners must decide the supported test layers and whether `COVERAGE` is a request category or a result/metric.
5. Test inventory, commands, framework and toolchain versions, dependency resolution, operating system, runner/provider, containerization, caching, sharding, timeouts, concurrency, and resource limits are unspecified.
6. Coverage dimensions (line, branch, function, or other), exclusions, report format, baseline comparison, thresholds, and the meaning of missing or partial coverage require explicit decisions.
7. Data and fixtures need ownership and privacy rules. Whether isolated writes, cleanup, external API calls, network access, or synthetic identities are allowed remains open; production data and destructive actions are excluded by default.
8. Test scripts and dependencies may execute arbitrary code. Secret exposure, network egress, permissions, sandboxing, artifact integrity, and supply-chain controls must be resolved before any runner is authorized.
9. Result schema, evidence and log retention, redaction, failure and partial-result states, flaky-test classification, retries, severity, and human acknowledgement are not defined.
10. CI integration, branch protection, blocking versus advisory behavior, and the authority to gate a merge are open. Test output cannot override deterministic policy or required human approval.
11. No notification destination is defined; Slack and other notifications remain out of scope.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.