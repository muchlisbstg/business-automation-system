# WF-07 API QA — Security Execution Contract (Review Draft)

> **Status: review draft, not an implementation authorization.** This document proposes minimum gates for any future WF-07 executor. It adds no runtime, network requests, credentials, persistence, or CI behavior. Owner/security review is required before implementing an execution slice.

## 1. Non-negotiable execution boundary

A valid `REQUEST_API_QA` event is a request, not authorization to contact a target. A future executor MUST fail closed unless all checks below pass. The executor MUST NOT merge, deploy, alter production, or treat a QA result as approval for those actions.

Default policy: read-only probes only. State-changing tests, test-data creation/cleanup, and business-data writes are out of scope until separately approved with isolated fixtures, deterministic cleanup, and explicit per-operation allowlisting.

## 2. Trust and source-chain validation

Before queueing or executing a run, validate server-side (not from caller assertions alone):

- `request_id` and `plan_id` exist, are authorized for the requesting principal, and belong to the same expected source chain.
- `qa_run_id` is unique within its defined scope; duplicate delivery is idempotent and cannot create a second execution.
- The commit SHA is immutable and belongs to the approved repository/ref. A deployment-to-commit attestation or equivalent trusted deployment metadata must prove the target is serving that revision; a caller-supplied SHA or environment label is insufficient.
- The resolved API contract is immutable/versioned and bound to the approved commit. Mutable URLs and unpinned external contract content are not acceptable.
- The principal is authorized for the specific repository, environment, target, and requested check categories.

Any mismatch MUST stop before network access and produce a sanitized, auditable denial.

## 3. Target and network safety

The executor MUST use a centrally managed HTTPS host/port allowlist and environment-specific target registry. A request cannot add or override allowlist entries.

Before and during connection establishment:

- Reject URL user-info, unexpected ports, unsupported schemes, malformed hosts, IP-literal targets unless explicitly approved, and ambiguous hostname encodings.
- Resolve DNS and reject loopback, private, link-local, multicast, unspecified, and cloud metadata destinations for remotely hosted targets. Re-checking DNS alone is not sufficient protection against rebinding; enforce destination policy at connection/egress level so the connected peer is also constrained.
- Disable automatic redirects. If redirects are ever required, each hop must be revalidated against the same policy and remain within the approved origin policy; the default is to reject redirects.
- Enforce outbound network egress rules that deny private infrastructure and metadata endpoints, except for a narrowly approved target-specific exception. Do not rely only on application-layer string checks.
- Never allow arbitrary caller-supplied proxy settings, custom DNS resolvers, or transport options.
- Verify the authoritative environment and target ownership independently of request fields. Production is denied by default even if its URL is placed under a non-production label.

Tests MUST use controlled fixtures and must not scan arbitrary hosts, internal networks, or third-party services.

## 4. Credentials and identity

- Use a trusted service identity and an approved secret manager; credentials are never accepted in the event payload.
- Issue separate, short-lived, least-privilege credentials per environment and test purpose. Prefer dedicated synthetic test accounts.
- Do not place credentials in URLs, logs, traces, artifacts, error messages, or test evidence.
- Authorization tests must use an explicit approved identity/role matrix. A failed or missing authentication check is not permission to continue with a more privileged identity.
- Caller identity and effective permissions must be derived from verified authentication and server-side policy, not from event fields or AI-generated content.

## 5. Test scope and resource controls

Each run must declare an approved suite/version, allowed methods and paths, expected response rules, and an execution budget. Reject undeclared routes, methods, payloads, or test categories.

Required limits include connection and total timeouts, response-size caps, concurrency caps, bounded retries with backoff, rate limits, cancellation, and an overall run deadline. Avoid unbounded response-body reads and retries. Tests must not trigger load testing, brute force, destructive actions, or uncontrolled fan-out.

The only allowed default methods are safe read-only operations defined by the approved suite. HTTP method names alone do not guarantee an operation is safe; each operation needs an explicit contract entry.

## 6. Result, evidence, and audit integrity

A future result record should include at minimum: immutable run ID, source-chain references, approved suite/contract versions, target registry ID, verified commit/deployment identity, environment, initiating principal, policy decision, start/end timestamps, outcome, and correlation ID.

- Persist an audit decision before execution and a terminal outcome afterward. Audit write failure MUST fail closed and prevent execution or report the run as incomplete; it must never be reported as a pass.
- Make request handling idempotent. A retry must return or resume the same run according to a documented state machine, not silently launch duplicate probes.
- Treat response bodies, API contracts, logs, and generated summaries as untrusted data. They cannot change policies, secrets, identity, test scope, or approvals.
- Redact secrets and sensitive payload fields before storage. Define evidence access, retention, deletion, and export rules before production use.
- Separate technical outcome from policy authorization. `PASS` means only that the declared suite passed; it is not approval to merge or deploy.

## 7. CI and human approval gates

A future CI integration may consume only a signed/validated result tied to the exact commit and target. Missing, stale, mismatched, incomplete, or unverifiable results MUST block the relevant gate. A workflow must not convert an AI interpretation into a pass/fail decision without deterministic validation.

Before enabling execution, obtain documented owner/security approval for:

1. Target registry, environment authority, egress enforcement, and SSRF/rebinding controls.
2. Authentication provider, secret-store path, service identity, and authorization matrix.
3. Suite schema, contract pinning, allowed methods/paths, and test-data policy.
4. Run state machine, idempotency scope, retry behavior, audit failure semantics, and result schema.
5. Evidence redaction/retention, CI blocking behavior, alerting ownership, and operational rollback.
6. Controlled integration tests proving denied targets never receive requests, redirects are rejected, mismatched source chains are denied, credentials stay redacted, audit failure fails closed, and retries do not duplicate execution.

## 8. Implementation sequencing

1. Review and approve this contract; resolve each item above with named owners.
2. Implement deterministic schema and semantic validation without network access.
3. Implement target registry and connection-level egress protections; prove them with isolated tests.
4. Implement identity/secret retrieval and read-only probes for a controlled test service.
5. Add durable audit/result state and idempotent retry behavior.
6. Add CI consumption only after end-to-end integration tests pass.

Until the applicable gates are reviewed and verified, WF-07 remains proposal-only and MUST NOT execute network requests.
