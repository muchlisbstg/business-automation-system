# Business Operations — API Integration Contract 001

**Status:** PROPOSED — design specification only; not an approved implementation contract  
**Date:** 2026-11-27  
**Scope:** `apps/business-operations` in `muchlisbstg/business-automation-system`  
**Branch:** `feat/business-operations-ui-stage-5-7`

## 1. Purpose and non-goals

Define a secure frontend-to-backend integration boundary for the internal Business Operations application. This document does not create endpoints, connect services, provision identity, modify schemas, run migrations, or authorize live business operations.

The frontend must communicate only with a trusted server-side Business Operations Backend-for-Frontend (BFF). Browser code must never connect directly to PostgreSQL, workflow repositories, n8n, or privileged service credentials.

## 2. Evidence-based current state

Source inspection on this branch established:

- WF-01 exposes an `IntakeService.submit(unknown)` service method and persists through a repository. Its response explicitly sets `execution_permitted: false`.
- WF-02 exposes a `PlanningService.plan(unknown)` service method. Its README states that callers must forward the actual WF-01 result; WF-02 does not independently retrieve or authenticate that record. It never approves or executes work.
- WF-03 exposes an `OrchestrationService.orchestrate(unknown)` service method and persists a deterministic plan. Its README states that it does not expose an HTTP endpoint, start n8n, execute tasks, or approve work. It retains a trusted-caller assumption for the WF-02 source.
- Existing NEXUS OIDC configuration belongs to `apps/ai-development-command-center`; it is not evidence of Business Operations authentication and must not be silently reused.
- `docs/security.md` requires least privilege, explicit authorization for production actions, and protected append-only audit history.

Consequently, these services are not yet frontend-ready HTTP APIs. Any future adapter must establish identity, tenant context, authorization, trusted source retrieval, and audit behavior before invoking them.

## 3. Target architecture

```text
Browser (Business Operations UI)
  |
  | Secure session cookie; same-origin requests
  v
Business Operations BFF (server-side)
  |-- Session validation / MFA assurance
  |-- Tenant context from trusted identity
  |-- Permission and resource authorization
  |-- Input validation / rate limits
  |-- Correlation and idempotency
  |-- Audit event emission
  |
  +--> Domain API adapters
         |-- WF-01 Intake
         |-- WF-02 Planning
         |-- WF-03 Orchestration planning
         |-- Approval service (separate, not yet evidenced)
         +-- Domain read services (not yet evidenced)
```

The BFF is a proposed boundary, not an existing deployed service. Domain services must independently enforce authorization where they are exposed beyond a strictly controlled process boundary. Never treat a browser-supplied tenant ID, role, approval state, source object, or execution flag as authoritative.

## 4. Proposed API surface

All routes below are proposals. They must not be treated as existing endpoints.

| Proposed route | Purpose | Required controls | Current status |
|---|---|---|---|
| `GET /api/v1/session` | Current user, tenant, effective permissions | Valid server session; minimal claims | Not implemented |
| `GET /api/v1/dashboard/summary` | Tenant-scoped dashboard read model | Dashboard read permission; tenant scope | Not implemented |
| `GET /api/v1/operations/requests` | Paginated request register | Resource-level read permission; tenant scope | Not implemented |
| `POST /api/v1/requests` | Submit intake request | Intake create permission; schema validation; idempotency | Not implemented |
| `POST /api/v1/requests/{requestId}/plans` | Create/validate plan from authoritative WF-01 record | Planning permission; server-side source lookup | Not implemented |
| `POST /api/v1/plans/{planId}/orchestration-preview` | Produce deterministic orchestration plan only | Planning/orchestration permission; server-side source lookup | Not implemented |
| `GET /api/v1/approvals` | Read approval queue | Approval read permission; tenant scope | Not implemented |
| `POST /api/v1/approvals/{approvalId}/decisions` | Record human decision | Dedicated approval authority; maker-checker; immutable evidence | Not implemented; separate approval domain required |
| `GET /api/v1/audit-events` | Read audit evidence | Auditor/security permission; tenant scope | Not implemented |

No proposed route may imply that an orchestration plan executes work. Approval and execution must remain separate state transitions and separate authorities.

## 5. Identity, session, and tenant contract

Before implementation, the owner must approve an identity provider and policy covering SSO, MFA, session lifetime, revocation, account lifecycle, recovery, and service-to-service credentials.

Minimum requirements:

1. Establish the authenticated principal from a server-validated session.
2. Resolve tenant membership and active tenant context from trusted server-side identity/membership records.
3. Reject missing, suspended, revoked, or ambiguous tenant membership.
4. Treat any tenant selector from the browser as a requested context only; verify membership and authorization server-side before switching.
5. Use secure, HttpOnly, SameSite cookies; apply CSRF protection to state-changing requests where cookie authentication is used.
6. Do not put access tokens, service secrets, or privileged credentials in browser storage or client bundles.
7. Define session invalidation and permission-change propagation.

No identity provider is selected by this specification. NEXUS OIDC must remain isolated unless a separate architecture decision explicitly approves reuse.

## 6. Authorization model

Authorization must be evaluated server-side for every request and every target resource. UI navigation visibility is not a security control.

Proposed permission naming convention:

- `dashboard.read`
- `master_data.read`, `master_data.manage`
- `supplier.read`, `supplier.manage`
- `procurement.read`, `procurement.create`, `procurement.update`
- `sales.read`, `sales.manage`
- `inventory.read`, `inventory.adjust`
- `warehouse.read`, `qc.record`
- `export.read`, `export.manage`
- `finance.read`, `finance.manage`
- `compliance.read`, `compliance.review`
- `sharia.read`, `sharia.review`
- `automation.read`, `automation.request`
- `system_admin.manage`
- `audit.read`

This is a permission vocabulary proposal, not a role assignment. CEO, Operations Manager, Procurement, Warehouse, Finance, Compliance Officer, Sharia Reviewer, System Admin, and Internal Auditor mappings require formal owner approval and independent Security review. High-impact actions require explicit resource-level policy, separation of duties, and a decision record; broad role names alone are insufficient.

## 7. Workflow trust and state invariants

- WF-01 intake acceptance is not approval and is not execution authorization.
- WF-02 planning output is not approval and is not execution authorization.
- WF-03 orchestration output is a deterministic plan, not task execution or completion.
- WF-02 must obtain the canonical WF-01 record through a trusted server-side lookup or verified internal reference; it must not trust a client-supplied source result.
- WF-03 must obtain the canonical WF-02 record through a trusted server-side lookup or verified internal reference; it must not trust a client-supplied planning result or task list as proof.
- Pending review signals must remain pending until a separate authorized approval service records a valid decision.
- An approval decision must bind to immutable request/plan/version identifiers and the exact evidence reviewed.
- Any later mutation that invalidates reviewed evidence must invalidate or re-open the approval according to an explicitly approved policy.
- Execution authorization, if ever introduced, must be a separate server-side capability with explicit policy, audit, and independent approval. It is out of scope here.

## 8. Common request/response envelope

Proposed request metadata:

- `Idempotency-Key`: required for create/decision operations; unique within principal + tenant + operation scope.
- `X-Correlation-ID`: optional client trace value; server validates or replaces it with a generated identifier.
- Content type: `application/json`; strict schema validation and bounded payload sizes.

Proposed response metadata:

- `correlation_id`: server-generated trace identifier.
- `request_id` / `resource_id`: stable domain identifier when applicable.
- `state`: domain state, never inferred from HTTP status alone.
- `reason_codes`: stable machine-readable codes.
- `created_at`: server timestamp.
- `execution_permitted`: must remain false for WF-01/WF-02 planning responses and must not be interpreted as a UI-controlled flag.

Error taxonomy proposal:

| HTTP status | Meaning |
|---|---|
| 400 | Malformed request or schema-invalid payload |
| 401 | Missing, expired, or invalid session |
| 403 | Authenticated but not authorized |
| 404 | Resource absent or intentionally concealed by policy |
| 409 | Idempotency replay with changed content, state conflict, or stale version |
| 422 | Valid envelope but domain validation/transition rejected |
| 429 | Rate limit exceeded |
| 5xx | Unexpected server failure; outcome may require reconciliation |

For timeout or network failure after a state-changing request, the UI must display an indeterminate state and query the operation by its idempotency key/correlation ID. It must not blindly resubmit with a new key or claim success/failure without authoritative reconciliation.

## 9. Audit event minimum

Every privileged read and every state-changing operation must emit an auditable event according to an approved data-classification policy. Minimum fields:

- event ID and server timestamp;
- actor principal and effective tenant;
- action and target resource/type;
- outcome and reason code;
- correlation ID and idempotency key reference;
- authorization policy/version evaluated;
- approver identity and evidence reference when relevant;
- before/after version references or cryptographic evidence where appropriate.

Audit persistence must be append-only for ordinary application/workflow roles. Access to audit records must itself be auditable. Retention, redaction, export, and legal hold requirements remain to be approved.

## 10. Required negative and resilience tests

| ID | Test | Expected result |
|---|---|---|
| AUTH-001 | No session calls any protected route | 401 |
| AUTH-002 | Expired/revoked session | 401; no side effect |
| AUTH-003 | User lacks required permission | 403 or policy-approved concealed 404 |
| TENANT-001 | User guesses another tenant's resource ID | No cross-tenant data disclosure or mutation |
| TENANT-002 | Browser forges tenant ID in body/header | Server ignores or rejects; trusted tenant context wins |
| WF-001 | Client fabricates WF-01 accepted result | WF-02 adapter rejects; canonical server lookup required |
| WF-002 | Client fabricates WF-02 planned result | WF-03 adapter rejects; canonical server lookup required |
| APPROVAL-001 | Pending review signal presented as approval | Rejected; no approval state transition |
| APPROVAL-002 | Restricted maker approves own action | Rejected by separation-of-duties policy |
| APPROVAL-003 | Evidence/version changes after approval | Approval invalidated or re-opened per approved policy |
| IDEM-001 | Same key and same payload replayed | Original outcome returned; no duplicate side effect |
| IDEM-002 | Same key with different payload | 409 conflict |
| AUDIT-001 | Ordinary application role attempts audit update/delete | Database denies operation |
| READONLY-001 | Read-only role invokes mutation route | 403; no side effect |
| RES-001 | Timeout occurs after request reaches server | UI shows indeterminate; reconciliation resolves outcome |
| RES-002 | Downstream partial failure | Durable state and retry/reconciliation policy prevent false success |

These tests must run against disposable non-production infrastructure with seeded synthetic tenants and users. SQLite-only tests are not sufficient evidence for PostgreSQL row-level or tenant-boundary enforcement.

## 11. Data classification and frontend handling

Before live integration, classify each field as public, internal, confidential, personal, financial, or regulated. Define field-level permissions, masking, export/download restrictions, retention, and deletion/legal-hold behavior.

The UI must:
- label all current sample records and KPIs as illustrative/demo;
- avoid storing sensitive business records in local storage or URL query strings;
- clear tenant-scoped client caches on logout and tenant switch;
- avoid logging secrets, tokens, personal data, or full financial payloads;
- present stale/partial/error states explicitly and never replace missing live values with plausible demo figures.

## 12. Approval and implementation gates

This proposal can move to an implementation ADR only after:

1. Product owner approves identity provider, tenant model, permission vocabulary, and role-to-permission mapping.
2. Independent Security reviewer approves session, authorization, threat model, and negative-test coverage.
3. Independent Database reviewer approves tenant-scoped data access, PostgreSQL enforcement, audit persistence, and migration strategy.
4. Domain owners approve versioned WF-01/WF-02/WF-03 adapter contracts and canonical source lookup.
5. Approval authority, maker-checker rules, and immutable decision evidence are formally defined.
6. Legal and Sharia governance review is completed before enabling relevant contract, finance, or payment workflows.
7. Disposable non-production integration tests pass with synthetic data and recorded evidence.

## 13. Explicit exclusions

This document does not authorize:
- production or staging credentials/connections;
- database DDL, migrations, or data mutation;
- live finance, payment, contract, shipment, supplier, or inventory actions;
- approval or execution endpoints becoming active;
- reuse/modification of NEXUS auth or the external USA Automotive Parts Export application;
- PR merge, deployment, or Vercel project creation.

**Decision:** Keep Business Operations demo-only. Stage 9 remains blocked pending approved contracts and independent reviews.
