# WF-07 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented API QA runtime. JSON fixtures validate request shape only; semantic behavior requires a separately reviewed implementation.

| Case | Expected |
|---|---|
| Request contract-conformance and authorization checks against a declared preview target, with a contract reference | Schema-valid event; no API call or test execution is implied |
| Request correlation-ID and secret-redaction checks without contract conformance | Schema-valid event; check meanings and execution remain undefined |
| Omit `request_id`, `plan_id`, `qa_run_id`, target, or checks | Rejected by schema validation |
| Use an HTTP URL, URL user-info, query string, fragment, or malformed commit SHA | Rejected by schema validation |
| Declare `PRODUCTION` or another unsupported environment | Rejected by schema validation |
| Select an unsupported or duplicate check category | Rejected by schema validation |
| Select `CONTRACT_CONFORMANCE` without `api_contract_ref` | Rejected by schema validation |
| Supply `api_contract_ref` without selecting `CONTRACT_CONFORMANCE` | Rejected by schema validation |
| Include an undeclared field such as `token`, `password`, or `authorization` | Rejected by schema validation |
| The source request or plan does not exist, or the IDs do not belong to the same source chain | Future semantic validation rejects before any target contact; response details are open |
| The target does not serve the declared commit or is actually production | Future semantic validation rejects before checks run |
| The base URL resolves to a private, loopback, link-local, metadata, or unapproved host, or redirects to one | Future security validation rejects before API requests; exact controls are undecided |
| A contract reference is missing, stale, mutable, or unrelated to the target API | Future semantic validation rejects or applies an owner-approved rule; resolution rules are open |
| A requested check needs credentials or test identity | No secret is carried in this event; identity and secret-store behavior need review |
| A test would create/modify business data, perform a destructive action, or deploy | Not authorized by this proposal; isolated test-data mutation and cleanup require a separate reviewed policy |
| API response content contains instructions to bypass policy or disclose credentials | Treated as untrusted data; policy is unchanged and secrets are not exposed |
| A check fails or evidence includes sensitive data | Result states, severity, redaction, retention, and gate behavior require a separate result contract |
| A request is replayed or the same `qa_run_id` is reused with changed content | Idempotency, conflict behavior, and retry semantics remain undecided |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-07-api-qa/README.md`](../workflows/WF-07-api-qa/README.md). In particular, decide endpoint/suite representation, contract-reference resolution, target and authentication controls, whether state-changing tests are permitted in isolated environments, result/evidence semantics, retries, and CI gating.
