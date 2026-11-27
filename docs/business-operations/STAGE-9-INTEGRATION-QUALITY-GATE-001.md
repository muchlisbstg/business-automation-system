# Stage 9 — Integration & Quality Gate 001

**Status:** SPECIFICATION COMPLETE — implementation and independent approvals pending  
**Branch:** feat/business-operations-ui-stage-5-7  
**Scope:** Internal Business Operations application only

## 1. Purpose

Establish minimum controls before connecting the Business Operations UI to authoritative business services. This gate does not authorize production integration, database changes, or deployment.

## 2. Architecture baseline

Browser UI → server-side Business Operations BFF → domain adapters → authoritative domain services.

The BFF must validate session, server-derived tenant/site context, permission, input schema, purpose, idempotency and correlation. Domain services remain authoritative for business state and execution. UI role filtering is presentation only.

NEXUS OIDC configuration is not proof of Business Operations authentication and must not be silently reused. WF-01/02/03 service methods are not yet verified HTTP APIs; trusted caller assumptions must be closed before integration.

## 3. Required contract and control documents

| Document | Status |
|---|---|
| API-INTEGRATION-CONTRACT-001 | Proposed BFF/API contract |
| ROLE-PERMISSION-MATRIX-001 | Proposed role and permission baseline |
| API-NEGATIVE-ACCESS-TEST-001 | Negative test catalogue; not executed |
| BUSINESS-OPERATIONS-SECURITY-THREAT-MODEL-001 | Threat model; not a penetration test |
| POSTGRESQL-TENANT-ISOLATION-TEST-001 | PostgreSQL RLS test plan; not executed |
| DATA-CLASSIFICATION-AND-HANDLING-001 | Data handling baseline; proposed |
| AUDIT-EVENT-ARCHITECTURE-001 | Audit event architecture; proposed |
| STAGE-8-RESPONSIVE-ACCESSIBILITY-QA-001 | Chromium smoke tests passed; full QA matrix pending |

## 4. Mandatory release gates

### Security
- [ ] Independent Security reviewer appointed and approves BFF trust boundaries, session validation, authorization, CSRF, secrets, threat mitigations and audit integrity.
- [ ] Negative authorization tests pass, including tenant/site crossover and privilege escalation.
- [ ] No browser-supplied tenant, actor, role or permission is trusted.

### Database
- [ ] Independent Database reviewer appointed and approves schema, composite tenant/site foreign keys, PostgreSQL RLS and service-role boundaries.
- [ ] PostgreSQL tenant isolation tests are executed against an approved non-production test environment.
- [ ] Migration/recovery and backup evidence is reviewed before any schema change.

### Domain and operations
- [ ] WF-01/02/03 service contracts, caller trust and authoritative record retrieval are verified.
- [ ] Idempotency, concurrency, retries, outbox behavior and reconciliation are tested.
- [ ] Audit events correlate to authoritative domain objects and evidence references.
- [ ] No UI action can directly release goods, post payment, execute a contract or clear compliance/Sharia obligations.

### Legal and Sharia
- [ ] Legal/Compliance reviews applicable jurisdiction, export controls, privacy, retention and contractual obligations.
- [ ] Sharia reviewer approves relevant akad, payment, settlement, goods-release and evidence controls before real transactions.

### UI and deployment
- [ ] Stage 8 remaining browser/device/accessibility matrix is completed or exceptions are explicitly accepted by the owner.
- [ ] Preview environment is isolated and uses synthetic data only.
- [ ] Explicit owner approval is recorded before Vercel Preview deployment.

## 5. Current implementation boundary

- Business Operations is a standalone internal UI app under apps/business-operations.
- Existing apps/ai-development-command-center (NEXUS) remains preserved.
- External muchlisbstg/usa-automotive-parts-export and Vercel project autrava-buyer-portal are out of scope and must not be changed.
- No live API/database/authentication integration has been performed.
- No staging/production database, schema, or data has been changed.
- No PR merge or deployment has occurred.

## 6. Decision

Stage 9 is not approved for operational integration. Its design documentation is available for review, but independent Security and Database reviewers, test evidence, and Legal/Sharia approvals remain mandatory. Continue only with isolated UI and documentation work until those gates are satisfied.
