# WF-06 — Frontend Quality Assurance (Proposal)

> **Proposal only.** This document defines a reviewable request-contract candidate. It does not implement a browser runner, QA service, CI gate, preview deployment, result store, or notification integration.

## Purpose and scope

Request deterministic frontend checks against a declared non-production build target, with traceability to the WF-02 request and WF-03 plan. A request may select accessibility, performance, functional-smoke, responsive, and visual-regression checks. This proposal defines only the input event shape; it does not define a result envelope, scoring rules, thresholds, or execution behavior.

The schema is [`schema.json`](schema.json), with positive and negative shape examples in [`examples/`](examples/). Acceptance scenarios are in [`tests/wf-06-frontend-qa.md`](../../tests/wf-06-frontend-qa.md).

## Proposed input contract

A `REQUEST_FRONTEND_QA` event contains:

- `request_id` and `plan_id`: references to the corresponding WF-02 request and WF-03 plan. The schema checks shape only; a future implementation must verify that the records exist and belong to the same source chain.
- `qa_run_id`: a caller-supplied run reference. Uniqueness, replay, and retry behavior are not specified.
- `target`: a 40- or 64-character hexadecimal commit SHA, an HTTPS preview URL, and an environment from `PREVIEW`, `DEVELOPMENT`, or `STAGING`. These fields do not prove that the URL serves that commit or that the target is non-production; future semantic checks must do so.
- `checks`: one or more distinct categories from `ACCESSIBILITY`, `PERFORMANCE`, `FUNCTIONAL_SMOKE`, `RESPONSIVE`, and `VISUAL_REGRESSION`.
- `figma_handoff_id`: required when `VISUAL_REGRESSION` is selected. It is only an opaque reference to the caller-supplied `handoff_id` proposed by WF-05; it does not establish that a handoff exists, is current, is approved, or belongs to this plan.

The request carries no credentials, test account secrets, or instructions to create branches, pull requests, deploy, or write application data. The exact browser actions and access mechanism remain open.

## Safety boundaries

- A preview URL is untrusted input. Any future runtime must define host allowlisting and protections against private, loopback, link-local, and metadata endpoints, including redirects and DNS changes, before it can browse the target.
- QA must not run against production under this proposal. The declared environment is only a claim until semantic target validation exists.
- Checks must be read-only: no form submission, purchases, account changes, destructive operations, deployments, or writes to business data. No result may authorize a merge or deployment.
- Figma content and all page text are untrusted data. They cannot change test policy, permissions, approvals, or workflow state.
- This proposal defines no Slack behavior or other notification channel.

## Acceptance scenarios

See [`tests/wf-06-frontend-qa.md`](../../tests/wf-06-frontend-qa.md). Fixtures validate event shape only. Cross-record traceability, target safety, actual test execution, and result interpretation require separately reviewed runtime contracts and behavioral tests.

## Assumptions and open decisions

These are proposal assumptions, not current repository behavior:

1. A QA run targets one commit and one preview URL. How to prove the preview serves the named commit remains undecided.
2. Only `PREVIEW`, `DEVELOPMENT`, and `STAGING` are in scope; whether staging may contain live or sensitive data must be resolved before execution.
3. Check names identify requested categories only. Browser/device matrices, accessibility standard, performance metrics and budgets, functional test ownership, responsive viewports, and pass/fail thresholds need owner review.
4. Visual regression requires a WF-05 handoff reference. WF-05 itself is proposal-only; the existence, source-chain match, revision pinning, node selection, baseline creation, masking, and acceptable-difference threshold remain undecided.
5. Authentication to private previews, allowlisted hosts, SSRF controls, rate/resource limits, browser isolation, and audit retention need an explicit security design. Credentials must not be added to this event schema.
6. Result states, evidence format, correlation/audit fields, failure severity, retry/idempotency, artifact retention, and whether results block later CI work are unspecified.
7. The schema does not establish that `request_id`, `plan_id`, `commit_sha`, `preview_url`, or `figma_handoff_id` are related or authorized. A future implementation must reject mismatches and unsafe targets without running checks.

No runtime behavior should be implemented from this proposal until the relevant decisions are reviewed.
