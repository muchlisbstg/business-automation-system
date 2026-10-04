# WF-07 — API Quality Assurance (Proposal)

> **Proposal only.** This defines a reviewable request-contract candidate. It does not make API calls or implement a runner, authentication integration, result store, CI gate, persistence, or notification behavior.

## Purpose and scope

Request API quality checks for a declared non-production target, with source traceability to a WF-02 request and WF-03 plan. The candidate is informed by the API layer baseline in [`api/README.md`](../../api/README.md): request/response contracts, authorization, correlation IDs, rate limiting, and secret handling.

This contract describes a request to run categories of checks, not the cases, endpoints, credentials, or expected results for those checks. It defines no HTTP/API surface and does not instruct any component to contact the target. The schema checks event shape only; source-chain membership, target safety, and actual contract behavior require future semantic validation.

## Proposed input contract

The JSON Schema is [`schema.json`](schema.json), and examples are in [`examples/`](examples/). The event contains:

- `action`: `REQUEST_API_QA`.
- `request_id`, `plan_id`, and `qa_run_id`: caller-provided trace references. The schema checks non-empty strings only; existence, source-chain membership, uniqueness, replay, and retry semantics are not established.
- `target`: a 40- or 64-character hexadecimal `commit_sha`, an HTTPS `base_url`, and an environment from `PREVIEW`, `DEVELOPMENT`, or `STAGING`. These declarations do not prove that the service serves that commit or that the target is actually non-production.
- `checks`: one or more distinct categories: `CONTRACT_CONFORMANCE`, `AUTHORIZATION`, `CORRELATION_ID`, `SECRET_REDACTION`, and `RATE_LIMITING`.
- `api_contract_ref`: an opaque non-empty reference required exactly when `CONTRACT_CONFORMANCE` is selected. The schema does not define how a reference is resolved or prove that it describes the target.

Undeclared fields are rejected, including credentials. The schema places basic shape restrictions on `base_url`; it cannot establish DNS destination, ownership, allowlist membership, redirect safety, or environment identity.

## Safety boundaries

- A QA request is not permission to contact an API. This proposal implements no network access, authentication, or test execution.
- Production is excluded from the proposed environment values, but the value is only a caller claim. Before any future execution, target ownership, actual environment, host allowlisting, DNS results, redirects, and protections against private, loopback, link-local, and metadata services must be addressed.
- The event carries no credentials or test-account secrets. A future authentication mechanism must use an approved secret store and least-privilege identities; credentials must not appear in requests, logs, results, or evidence.
- This proposal does not authorize state-changing API operations, test-data creation or cleanup, destructive actions, deployment, or business-data writes. Whether isolated test-data mutations are needed requires owner review and a separately defined safety policy before runtime implementation.
- API responses and contract content are untrusted data. They cannot alter test policy, identity, authorization, approvals, or workflow state.
- A QA result cannot authorize a merge or deployment. No Slack or other notification behavior is in scope.

## Acceptance scenarios

See [`tests/wf-07-api-qa.md`](../../tests/wf-07-api-qa.md). JSON examples validate request shape only. Cross-record traceability, target safety, contract resolution, test execution, and result interpretation are not implemented by this proposal.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. One request names one commit and one base URL. How a deployed service is proven to match the commit remains undecided.
2. `PREVIEW`, `DEVELOPMENT`, and `STAGING` are proposed non-production labels. The authoritative environment source and treatment of staging data remain undecided.
3. Check categories reflect the existing API layer baseline, but their exact probes, operation coverage, expected responses, budgets, and pass/fail rules are not specified.
4. `api_contract_ref` is required for contract conformance and is otherwise absent. Whether it is a repository-relative file, a versioned URL, or another immutable reference—and how it is pinned to `commit_sha`—needs owner review.
5. The event does not identify individual routes, methods, request bodies, test identities, or fixtures. Whether those belong in this contract or a separate suite definition is open.
6. The safe baseline is that this request does not authorize state-changing operations. Whether WF-07 should support isolated test-data mutations and deterministic cleanup must be decided before such tests are designed.
7. Authentication profiles, identity/role matrices, secret-store integration, least-privilege policy, and authorization-test coverage remain undefined.
8. Runtime safeguards for host allowlists, DNS rebinding, redirects, SSRF, timeouts, rate/resource limits, and target verification need a reviewed security design.
9. The response/result schema, correlation and audit fields, evidence redaction/retention, severity, retry/idempotency, CI gating, and whether results block later work are undecided.
10. Semantic validation must establish that `request_id` and `plan_id` exist and belong to the same source chain before any future run; this proposal does not define a response for mismatches.

No runtime behavior should be implemented from this proposal until the relevant decisions for that runtime slice are reviewed.
