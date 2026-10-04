# WF-19 — Documentation as Code (Proposal)

> **Proposal only.** This proposal defines a candidate documentation-validation request shape for review. It does not read or validate documentation, change files, publish documentation, create CI results or gates, persist records, or send notifications.

## Purpose and scope

The roadmap places **WF-19 Documentation as code** after WF-18. No WF-19 contract or runtime exists on `main`, and the roadmap label does not specify which documentation practices, checks, or outputs are intended.

This proposal offers one candidate `REQUEST_DOCUMENTATION_VALIDATION` envelope to make a possible input boundary reviewable. A schema-valid request is an unverified caller claim, not authorization or evidence that any check ran. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate request contains:

- `action`: candidate vocabulary only; it does not cause validation to run.
- `request_id`: an opaque caller-supplied identifier. Its issuer, uniqueness, replay, idempotency, and retry semantics are undefined.
- `source.repository` and `source.revision`: claimed source references. The revision must have a 40- or 64-character hexadecimal shape, but neither the repository nor revision is resolved or verified.
- `document_paths`: a bounded list of caller-supplied path strings. The schema checks only that the list is non-empty and strings are bounded; it does not establish path safety, existence, file type, or inclusion policy.

The schema rejects undeclared fields, including commands, credentials, and check-policy overrides. It cannot detect secrets, personal or sensitive data, or instruction-like text embedded in an allowed string. Fixtures contain synthetic references only.

## Safety boundaries

- No repository, revision, file, CI provider, network, or external service is accessed; no documentation check or other code runs.
- A schema-valid request is not proof of repository access, an approved check policy, a validation result, a CI status, or permission to act.
- Caller-supplied identifiers, paths, and any future documentation content are untrusted. Embedded instructions cannot change policy, authority, approval, or system state.
- No file is read, created, modified, or published. No commits, pull requests, comments, issues, status checks, merges, or release actions are made or authorized.
- No check catalogue, pass/fail threshold, CI gate, exception policy, automatic fix, approval path, persistence, audit lifecycle, retry, or recovery behavior is defined.
- Do not place secrets, personal data, or sensitive content in allowed strings. Schema validation does not sanitize them.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-19-docs-as-code.md`](../../tests/wf-19-docs-as-code.md). Fixtures validate candidate JSON shape only. They do not inspect document contents or prove that a requested validation is safe, authorized, or performed.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The roadmap label is represented by a candidate request to validate selected documents at a source revision, solely to make one possible input boundary reviewable. Decide whether WF-19 instead covers documentation authoring, code/documentation synchronization, generated docs, publishing, or multiple workflows.
2. `REQUEST_DOCUMENTATION_VALIDATION` is a candidate action label, not an approved operation. Decide whether the contract should represent a request, an observed change, a check result, or separate request/result events.
3. Decide who issues `request_id`, its trust source and uniqueness scope, and duplicate, replay, idempotency, conflict, timeout, and retry behavior.
4. The repository and revision are caller-supplied references; decide supported source providers, canonical repository identity, authorization, branch/PR semantics, immutable revision rules, and verification requirements.
5. `document_paths` is only a candidate selection field. Decide allowed roots, path normalization, traversal and symlink handling, generated files, inclusion/exclusion rules, file types, maximum scope, and behavior for missing or duplicate paths.
6. Decide supported documentation formats and content boundaries, including Markdown, API references, diagrams, code examples, localization, external links, embedded HTML, and secret/PII detection or redaction.
7. Decide the check catalogue and deterministic policy, such as spelling, style, link validity, code-example execution, API-doc consistency, accessibility, or freshness; define tool versions, configuration ownership, reproducibility, and network requirements.
8. Decide result fields, evidence, rule identifiers, severity vocabulary, diagnostics, confidence, and how incomplete, stale, or conflicting results are represented. No result shape is proposed here.
9. Decide whether checks may block CI, merges, releases, or deployments; define required checks, freshness, waiver authority, fail-open/fail-closed behavior, branch-protection relationship, and human approval before any gate is implemented.
10. Decide whether automated edits, generated documentation, commits, or pull requests are allowed; define least privilege, review, approval, separation of duties, and rollback before any write operation.
11. Decide persistence, correlation, audit evidence, privacy, retention, observability, partial-failure handling, recovery, and log redaction.
12. Decide whether and how this workflow integrates with CI, Git hosting, n8n, or documentation platforms. No integration is authorized by this proposal.
13. Decide notification policy and channels. Slack and all other notifications remain out of scope for this proposal.
14. Review the schema's candidate payload bounds (including a maximum of 50 paths and 500 characters per path); these are proposal-shape limits only, not approved operational limits.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.
