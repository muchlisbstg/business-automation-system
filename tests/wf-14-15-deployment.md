# WF-14/15 Proposal Acceptance Scenarios

> These are candidate contract expectations, not evidence of a deployment runtime. JSON fixtures validate request shape only; no source, artifact, gate, approval, or target is resolved and no deployment occurs.

| Case | Expected |
|---|---|
| Submit a candidate request for a declared repository commit, artifact reference, service, and `staging` environment | Schema-valid shape only; no artifact verification, gate evaluation, or deployment is implied |
| Submit a candidate request with `prod` as the environment | Schema-valid shape only; this is not human approval, gate evidence, permission, or authorization to deploy |
| Use `dev`, `staging`, or `prod` as the environment | Accepted by the candidate schema; environment access and eligibility are not checked |
| Omit `action`, `request_id` (see [negative request-ID fixture](../workflows/WF-14-15-deployment/examples/schema-invalid-missing-request-id.json)), `source`, `artifact_ref`, or `target` | Rejected by schema validation |
| Omit `repository`, `owner`, `name`, `commit_sha`, `service_id`, or `environment` | Rejected by schema validation |
| Supply an empty/malformed repository identifier, malformed commit SHA, empty artifact reference, or unsupported environment | Rejected by schema validation |
| Add an undeclared field such as a token, password, command, runner override, or approval claim | Rejected by schema validation |
| Put sensitive content or instruction-like text inside an allowed string | The schema cannot detect or sanitize it; no request is processed, and future redaction and input-handling rules remain open |
| Source repository/commit, artifact reference, service, or environment is missing, stale, inaccessible, unauthorized, or mismatched | No lookup occurs; provenance, target authorization, and mismatch behavior remain undecided |
| A prerequisite gate is failed, missing, skipped, partial, stale, or advisory | No gate is evaluated; gate set, evidence, freshness, and blocking semantics remain open |
| A production request lacks approval or carries a caller-supplied approval claim | No approval is validated and no deployment occurs; explicit human approval remains required by the repository baseline |
| Repeat a deployment identifier with identical or changed content, or retry after a partial side effect | No idempotency, replay, conflict, recovery, or exactly-once behavior is defined |
| Deployment fails or health checks regress | No rollout, cancellation, rollback/roll-forward, or failure-state behavior is implemented |
| Request would trigger a Slack or other notification | Out of scope; this proposal sends no notifications |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-14-15-deployment/README.md`](../workflows/WF-14-15-deployment/README.md), especially the WF-14/WF-15 boundary, artifact provenance and immutability, production approval evidence, gate policy, execution identity/isolation, rollout and rollback, auditability, and CI integration.
