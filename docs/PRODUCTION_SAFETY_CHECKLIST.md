# Production Safety Checklist

This checklist complements the platform's release gates. It is a review aid, not proof of compliance or a replacement for system-specific threat modeling.

## 1. Workflow intake and trust boundaries

- [ ] Validate the input against a versioned schema before planning or execution.
- [ ] Treat prompts, issue descriptions, webhook bodies, repository content, and AI output as untrusted data.
- [ ] Do not let user-supplied content alter system instructions, tool permissions, or approval policy.
- [ ] Assign a correlation ID and stable request identity.
- [ ] Apply request size, rate, timeout, and retry limits.
- [ ] Reject unknown fields when a contract requires a closed schema.

## 2. Identity and authorization

- [ ] Authenticate the caller independently of payload claims.
- [ ] Authorize every action against actor, resource, environment, and requested operation.
- [ ] Use least-privilege service credentials scoped to the smallest required repository/project.
- [ ] Never treat an AI review result, workflow status, or client-provided boolean as authorization.
- [ ] Re-check authorization immediately before each high-impact side effect.
- [ ] Keep development, staging, and production identities separate.

## 3. Human approval gates

Human approval is required for production deployment, destructive changes, data export/deletion, permission changes, financial actions, and other high-impact operations.

An approval record should bind to:
- Immutable request ID and payload hash.
- Exact repository, commit SHA or artifact digest.
- Target environment and requested operation.
- Approver identity and authorization evidence.
- Decision, timestamp, expiry, and reason.
- Policy version and any required second approver.

Approval must be single-use or explicitly scoped, expire, and be invalidated if the request payload or target artifact changes. A new commit requires a new evaluation and approval.

## 4. Idempotency and retries

- [ ] Identify the business operation that must happen at most once.
- [ ] Scope idempotency keys to tenant/organization and operation.
- [ ] Store a canonical request hash and final result atomically with the business change.
- [ ] Reject reuse of a key with a different request hash.
- [ ] Define retention and cleanup for idempotency records.
- [ ] Use bounded exponential backoff with jitter only for retry-safe failures.
- [ ] Do not retry non-idempotent side effects unless downstream deduplication exists.

## 5. Audit and observability

Record actor/service identity, correlation ID, action, resource, environment, outcome, timestamp, policy decision, and artifact/request identity. Do not log secrets, access tokens, full sensitive payloads, or unnecessary personal data.

- [ ] Logs are access-controlled and retention is defined.
- [ ] Security-relevant events cannot be silently overwritten by the workflow caller.
- [ ] Alerts have an owner, severity, and response runbook.
- [ ] Failed and partially completed operations have a reconciliation path.

## 6. Release gate

- [ ] Required tests and contract validation pass on the exact candidate commit.
- [ ] Dependency and secret scanning are enabled where applicable.
- [ ] Database migrations are reviewed for locking, backfill, rollback, and tenant isolation.
- [ ] Staging smoke tests pass.
- [ ] Backup/restore or rollback is rehearsed for risky changes.
- [ ] Human release approval is recorded against the immutable candidate.
- [ ] Post-release verification and rollback owner are assigned.

## 7. Incident response

1. Stop or disable the affected workflow when safe.
2. Preserve relevant audit evidence.
3. Assess scope, affected tenants, data exposure, and downstream effects.
4. Revoke or rotate compromised credentials.
5. Recover using a reviewed procedure; do not let an AI agent independently make destructive repairs.
6. Record root cause, corrective actions, owners, and verification evidence.

## Scope statement

A checklist item is complete only when evidence is linked. This document does not assert that all controls are implemented in this repository or that the system meets any specific legal, regulatory, security, or certification standard.
