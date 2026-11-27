# Business Operations — API Negative Access Test 001

**Status:** PROPOSED TEST PLAN — not executed  
**Date:** 2026-11-27  
**Scope:** Future Business Operations BFF/API and domain adapters  
**Related:** `API-INTEGRATION-CONTRACT-001.md`, `ROLE-PERMISSION-MATRIX-001.md`

## 1. Objective

Define negative authorization, tenant isolation, workflow-trust, audit-integrity, and resilience tests required before any live integration. These are acceptance criteria, not test results. No endpoint is assumed to exist.

## 2. Test environment and safety

- Use disposable, isolated non-production infrastructure only.
- Seed synthetic tenants A and B, users with distinct roles, and synthetic resources.
- Never use production credentials, customer data, real payment rails, real supplier accounts, or real shipment operations.
- Obtain Security and Database reviewer approval before provisioning test infrastructure or running database-level tests.
- Capture test run ID, commit SHA, environment identifier, policy version, sanitized request/response, and server-side audit evidence.
- A test passes only when the expected denial is observed and no unauthorized state change or data disclosure occurs.

## 3. Required fixtures

| Fixture | Description |
|---|---|
| Tenant A / Tenant B | Two isolated synthetic tenants |
| User A1 | Tenant A procurement requester |
| User A2 | Tenant A procurement reviewer; separate identity |
| User A3 | Tenant A warehouse operator |
| User A4 | Tenant A read-only auditor |
| User B1 | Tenant B authorized user |
| User X | No active tenant membership |
| Revoked user | Previously valid session revoked before request |
| Resource A / Resource B | Same-shaped resources in different tenants |
| Workflow records | Synthetic WF-01 intake, WF-02 plan, WF-03 preview |
| Audit principal | Ordinary application role with no audit administration grant |

## 4. Negative test catalogue

| ID | Attack / invalid condition | Expected control | Expected result |
|---|---|---|---|
| AUTH-001 | No session calls protected route | Authentication middleware | 401; no data |
| AUTH-002 | Expired session | Session validation | 401; no side effect |
| AUTH-003 | Revoked session replay | Session revocation check | 401; no side effect |
| AUTH-004 | Suspended account | Account status check | 401/403 per policy; no side effect |
| AUTH-005 | User changes local role value to Admin | Server-derived permissions | No privilege change; deny |
| AUTH-006 | User calls hidden route directly | Backend authorization | 403 or policy-approved 404 |
| AUTH-007 | User requests field outside field-level grant | Field authorization | Field omitted/redacted or request denied |
| TENANT-001 | Tenant A guesses Resource B ID | Resource tenant check | No cross-tenant disclosure or mutation |
| TENANT-002 | Browser forges tenant header/body | Trusted tenant context | Ignore/reject forged value |
| TENANT-003 | Tenant A changes URL tenant segment to B | Membership validation | Deny; no B data |
| TENANT-004 | User has membership in A but membership in B is revoked | Current membership check | Deny B context immediately per revocation SLA |
| TENANT-005 | Cache populated under A then switch to B | Tenant-scoped cache lifecycle | A data not visible in B |
| RBAC-001 | Warehouse user invokes finance mutation | Permission and domain policy | 403; no state change |
| RBAC-002 | Auditor invokes any mutation route | Read-only policy | 403; no state change |
| RBAC-003 | System Admin attempts business approval | Domain authority boundary | Deny; no approval record |
| RBAC-004 | Sharia Reviewer attempts payment release | Separate authority boundary | Deny; no payment action |
| RBAC-005 | CEO read grant used to approve transaction | Explicit transition permission | Deny unless separately authorized by approved policy |
| SOD-001 | Requester approves own request | Maker-checker enforcement | Deny and audit event |
| SOD-002 | Same principal prepares and releases restricted transaction | Separation-of-duties policy | Deny |
| WF-001 | Client fabricates successful WF-01 response | Canonical server-side source lookup | WF-02 adapter rejects fabricated source |
| WF-002 | Client fabricates WF-02 plan/task list | Canonical server-side source lookup | WF-03 adapter rejects fabricated source |
| WF-003 | WF-01 intake accepted then UI claims approval | Explicit state model | State remains intake accepted/pending; no approval |
| WF-004 | WF-03 preview submitted as execution command | Execution boundary | Reject; no task/n8n execution |
| WF-005 | Stale source version used for planning | Version binding | Conflict/revalidation required |
| APPROVAL-001 | Pending review evidence treated as approved | Approval state validation | Deny transition |
| APPROVAL-002 | Approval references different resource/version | Immutable evidence binding | Reject |
| APPROVAL-003 | Reviewed evidence changes after decision | Version/hash invalidation policy | Re-open/invalidate per approved rule |
| IDEM-001 | Same idempotency key and same payload replay | Idempotency store | Original outcome; no duplicate effect |
| IDEM-002 | Same key reused with changed payload | Payload fingerprint | 409; no second effect |
| CSRF-001 | Cross-origin state-changing cookie request | CSRF/origin protection | Reject |
| INPUT-001 | Oversized/malformed payload | Schema and size validation | 400/413; no side effect |
| RATE-001 | Repeated login or mutation attempts | Rate limiting/abuse control | 429 and security telemetry |
| AUDIT-001 | Ordinary role updates/deletes audit event | Append-only DB policy | Database denies |
| AUDIT-002 | Unauthorized user reads restricted audit details | Audit read permission | Deny or redact |
| AUDIT-003 | Privileged mutation succeeds without audit event | Transactional audit requirement | Operation fails closed or enters explicit recoverable state |
| RES-001 | Client timeout after server commits request | Idempotency/reconciliation | UI shows indeterminate; lookup resolves authoritative outcome |
| RES-002 | Downstream service fails after partial processing | Durable state/retry policy | No false success; safe retry/reconciliation |
| RES-003 | Duplicate concurrent requests race | Unique idempotency constraint | One logical operation only |
| LOG-001 | Request contains secret/token and error occurs | Log redaction | No secret in logs/traces |
| AUTHZ-001 | Permission removed during active session | Policy freshness/revocation | Sensitive next request denied within approved SLA |

## 5. Test execution protocol

For each test:
1. Record repository, branch, commit SHA, test suite version, environment, and policy version.
2. Authenticate using the designated synthetic identity, or deliberately omit/revoke session as required.
3. Execute exactly one adversarial request with a unique correlation ID.
4. Capture sanitized HTTP status, response reason code, and relevant server audit event.
5. Query authoritative state using an independent read path and verify no unauthorized mutation or disclosure occurred.
6. For tenant tests, verify both the API response and the underlying PostgreSQL enforcement using a role that does not bypass RLS.
7. Record PASS only when all expected controls are evidenced. Record FAIL, BLOCKED, or NOT RUN otherwise.

## 6. PostgreSQL-specific verification

SQLite unit tests do not establish PostgreSQL tenant isolation. Before claiming tenant isolation:
- verify RLS is enabled and forced where required;
- verify application roles do not own protected tables or possess RLS bypass privileges;
- test tenant A and B with separate database principals/session context;
- test missing, null, malformed, and forged tenant context;
- verify transaction-local tenant context cannot leak through pooled connections;
- verify joins, foreign keys, background jobs, views, and stored procedures preserve tenant boundaries;
- verify audit tables reject ordinary update/delete;
- verify tenant/site composite relationships prevent cross-tenant references.

Database reviewer approval and a disposable PostgreSQL environment are prerequisites. No DDL or migration is authorized by this plan.

## 7. Evidence and exit criteria

Stage 9 negative-access gate cannot pass until:
- all applicable tests are implemented and executed against the approved non-production architecture;
- no cross-tenant read or write succeeds;
- no unauthorized role can mutate or approve protected resources;
- no workflow source can be forged by the browser;
- idempotency and retry behavior are demonstrated;
- audit evidence is complete and protected;
- PostgreSQL RLS and relational tenant boundaries are independently reviewed;
- Security and Database reviewers sign off on the evidence bundle.

A passing build or frontend unit test is not evidence that backend authorization or tenant isolation works.

## 8. Explicit exclusions

This test plan does not authorize production access, staging mutation, schema changes, migrations, real financial or shipment operations, approval execution, deployment, or PR merge.

**Decision:** Stage 9 remains blocked until the backend boundary exists, reviewers approve the plan, and tests are run with synthetic data in disposable non-production infrastructure.
