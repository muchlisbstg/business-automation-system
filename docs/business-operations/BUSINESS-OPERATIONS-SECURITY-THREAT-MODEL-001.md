# Business Operations — Security Threat Model 001

**Status:** PROPOSED — architecture threat assessment; requires independent Security review  
**Date:** 2026-11-27  
**Scope:** Internal `apps/business-operations`, proposed BFF, and future domain adapters  
**Related:** `API-INTEGRATION-CONTRACT-001.md`, `ROLE-PERMISSION-MATRIX-001.md`, `API-NEGATIVE-ACCESS-TEST-001.md`

## 1. Executive summary

Business Operations is currently a demo UI. The proposed backend integration boundary, authentication/session model, approval service, and PostgreSQL tenant enforcement are not established by this document. The primary risks before integration are broken tenant isolation, client-trusted identity or workflow state, privilege escalation, unauthorized business transitions, and incomplete audit evidence.

**Security posture:** NOT APPROVED FOR LIVE DATA OR BUSINESS OPERATIONS. This is a design-stage threat model, not a penetration test, code audit, or security certification.

## 2. System context and trust boundaries

### In scope

- Browser running `apps/business-operations`.
- Proposed same-origin Business Operations BFF.
- Proposed identity/session validation and permission evaluation.
- Proposed tenant context resolver.
- Future adapters for WF-01 Intake, WF-02 Planning, and WF-03 Orchestration planning.
- Future approval authority and domain read services.
- Future PostgreSQL-backed tenant data and append-only audit evidence.

### Out of scope / explicitly isolated

- `apps/ai-development-command-center` (NEXUS); its OIDC configuration is not automatically trusted by this application.
- External `muchlisbstg/usa-automotive-parts-export` and Vercel project `autrava-buyer-portal`.
- Production payment rails, real shipment release, live customer/supplier records, and real-money execution.

### Trust boundaries

1. **TB-1 Browser ↔ BFF:** all browser input is untrusted; session must be server validated.
2. **TB-2 BFF ↔ Identity provider:** token/session claims and signing keys require secure validation and lifecycle controls.
3. **TB-3 BFF ↔ Domain services:** caller identity, tenant, resource IDs, and workflow provenance must be authenticated and authorized.
4. **TB-4 Services ↔ PostgreSQL:** database role and transaction context determine effective access; pooled connections must not leak tenant context.
5. **TB-5 Application ↔ Audit store:** ordinary application identities must not alter or erase audit evidence.
6. **TB-6 Human approval ↔ Workflow state:** approval must bind to an immutable resource/version/evidence set and a distinct authorized principal.

## 3. Assets and security objectives

| Asset | Security objective |
|---|---|
| Tenant business records | Confidentiality and tenant isolation |
| Identity sessions and MFA state | Authenticity, integrity, revocation |
| Role and permission grants | Integrity, least privilege, auditability |
| Workflow source records | Provenance and integrity |
| Approval decisions | Non-repudiation, separation of duties, version binding |
| Finance and inventory records | Confidentiality, integrity, controlled transitions |
| Contract/compliance/Sharia evidence | Integrity, traceability, restricted access |
| Audit events | Append-only integrity, availability, traceability |
| Service credentials and signing keys | Confidentiality, rotation, least privilege |
| Idempotency and job state | Integrity and replay safety |

## 4. Threat assessment (STRIDE)

Severity is an initial qualitative assessment (Critical / High / Medium). It is not a measured risk score; independent Security review must validate likelihood, impact, and residual risk.

| ID | STRIDE | Threat scenario | Initial severity | Required mitigation / acceptance evidence |
|---|---|---|---|---|
| TM-001 | Spoofing | Forged, stolen, replayed, or revoked session accepted | Critical | Server-validated session, MFA policy, revocation, secure cookies; AUTH-001–004 pass |
| TM-002 | Spoofing | Browser supplies another user's ID or role | Critical | Principal and grants derived only from validated server session; AUTH-005 pass |
| TM-003 | Tampering | Client forges tenant ID, site, workflow source, approval flag, or execution flag | Critical | Server-derived tenant; schema allowlist; canonical source lookup; TENANT-002 and WF-001/002 pass |
| TM-004 | Repudiation | Privileged action has no durable actor, decision, or evidence record | High | Append-only audit, correlation, policy version, actor/effective tenant, evidence binding; AUDIT-003 pass |
| TM-005 | Information disclosure | IDOR/BOLA exposes another tenant's record or restricted fields | Critical | Object-level authorization, tenant predicates, RLS, field filtering; TENANT-001 and AUTH-007 pass |
| TM-006 | Denial of service | Expensive queries, large payloads, brute force, or workflow flooding exhaust resources | High | Rate limits, payload caps, pagination, timeouts, queue bounds, abuse monitoring; RATE-001 and INPUT-001 pass |
| TM-007 | Elevation of privilege | UI-only role checks or mass assignment allow unauthorized mutations | Critical | Default deny, server-side permission checks per operation/resource, strict input schemas; AUTH-006 and RBAC suite pass |
| TM-008 | Tampering | Stale or forged WF-01/WF-02 output is accepted downstream | Critical | Server-side canonical record lookup, immutable IDs/versions, integrity checks; WF-001/002/005 pass |
| TM-009 | Repudiation / Tampering | Approval evidence changes after a reviewer decision | Critical | Bind decision to immutable version/hash; invalidate or reopen on change; APPROVAL-002/003 pass |
| TM-010 | Elevation of privilege | Requester approves own request or incompatible roles combine | High | Maker-checker and role-conflict evaluation; SOD-001/002 pass |
| TM-011 | Tampering | Duplicate or replayed request creates duplicate business effects | High | Atomic idempotency key + payload fingerprint + unique constraint; IDEM-001–002 and RES-003 pass |
| TM-012 | Information disclosure | Logs, traces, errors, or client bundles expose secrets or sensitive records | High | Secret redaction, data minimization, generic client errors, bundle scanning; LOG-001 pass |
| TM-013 | Tampering / Elevation | Pooled DB connection retains prior tenant context | Critical | Transaction-local context, reset/rollback guarantees, separate test principals; PostgreSQL tests pass |
| TM-014 | Tampering | Ordinary application role alters or deletes audit evidence | Critical | Separate owner/migration role; append-only grants/triggers or equivalent; AUDIT-001 pass |
| TM-015 | Denial / Tampering | Downstream timeout or partial failure is shown as success or retried unsafely | High | Durable operation state, idempotency, reconciliation, explicit indeterminate UI state; RES-001/002 pass |
| TM-016 | Information disclosure | Cross-tenant cache, browser history, exports, or download links leak data | High | Tenant-keyed cache, cache purge on switch/logout, signed scoped downloads, no sensitive URL params; TENANT-005 pass |
| TM-017 | Elevation | System Admin or Sharia Reviewer uses technical/review role to execute business actions | Critical | Separate technical, review, approval, and execution authorities; RBAC-003/004 pass |
| TM-018 | Tampering | CSRF or untrusted origin causes cookie-authenticated state change | High | SameSite cookies, CSRF token/origin checks, restrictive CORS; CSRF-001 pass |

## 5. Abuse cases and security invariants

- **Tenant escape:** user from tenant A guesses tenant B resource IDs. Invariant: no cross-tenant record, count, metadata, timing oracle, or mutation is disclosed beyond approved policy.
- **Role spoofing:** user changes local storage, React state, request body, or headers to claim a privileged role. Invariant: permissions are computed server-side.
- **Workflow forgery:** browser submits a fabricated successful upstream result. Invariant: each service resolves canonical source records itself or verifies a signed internal reference with audience, tenant, expiry, and version binding.
- **Approval laundering:** pending review is represented as approved or evidence is swapped after review. Invariant: approval state comes only from a dedicated authority and is bound to exact evidence/version.
- **Replay:** request is retried after timeout. Invariant: one idempotency key and payload fingerprint identify one logical operation.
- **Audit erasure:** application identity updates/deletes its own evidence. Invariant: audit writer can append only; ordinary runtime roles cannot update/delete.
- **Connection context bleed:** tenant A context survives pool reuse for tenant B. Invariant: tenant context is transaction-scoped and cleared on commit/rollback/release.
- **Privilege collision:** a principal holds incompatible roles. Invariant: policy detects conflicts and denies protected transitions unless an approved exception workflow exists.

## 6. Required security controls

### Identity and session
- Select and approve an identity provider; define MFA assurance for sensitive actions.
- Validate issuer, audience, signature, expiry, nonce/state as applicable, and account status.
- Use secure, HttpOnly, SameSite cookies; CSRF controls for state-changing requests.
- Define session rotation, revocation SLA, logout, recovery, and permission freshness.
- Do not expose access tokens or service credentials to browser JavaScript.

### Authorization and tenant boundaries
- Default deny and authorize every route, method, field, and resource.
- Resolve tenant from trusted server-side membership; browser tenant selectors are untrusted context requests.
- Use tenant-scoped query predicates and PostgreSQL RLS as defense in depth.
- Ensure runtime DB roles do not own protected tables and cannot BYPASSRLS.
- Scope background jobs, exports, file access, caches, and service-to-service calls by tenant.
- Keep privileged migrations/ownership credentials out of application runtime.

### Workflow and approval integrity
- Resolve upstream workflow records server-side and bind tenant/resource/version.
- Distinguish intake accepted, planned, reviewed, approved, authorized, executed, and settled states.
- Keep WF-03 orchestration preview non-executing.
- Separate maker, reviewer, approver, and executor duties where risk requires.
- Bind approval to exact evidence and reopen on material change.

### Audit, monitoring, and resilience
- Append-only audit with actor, tenant, action, target, result, correlation ID, policy version, and evidence references.
- Redact secrets and sensitive payloads from logs.
- Alert on repeated denied cross-tenant access, privilege changes, suspicious replay, and audit failures.
- Use bounded payloads, pagination, timeouts, rate limits, idempotency, and reconciliation.
- Define backup, restore, incident response, and security event retention separately.

## 7. Security verification plan

Before integration is approved:
1. Review threat model and data classification with independent Security reviewer.
2. Validate role conflicts and permission boundaries against ROLE-PERMISSION-MATRIX-001.
3. Implement the API-NEGATIVE-ACCESS-TEST-001 cases applicable to the selected architecture.
4. Execute tenant-boundary tests against PostgreSQL with non-owner, non-BYPASSRLS roles.
5. Test session revocation, CSRF, idempotency races, stale evidence, and pooled-connection reuse.
6. Perform dependency, secret, and static analysis checks; document exceptions and remediation owners.
7. Capture reproducible evidence tied to commit SHA and test environment.
8. Obtain explicit Security and Database sign-off; unresolved Critical/High risks block release.

## 8. Open decisions

- Identity provider and MFA policy.
- Tenant membership source of truth and tenant-switch behavior.
- Role conflict policy and privileged access process.
- Data classification, retention, residency, and export controls.
- Approval authority and immutable evidence implementation.
- PostgreSQL role topology, RLS policy design, and connection pool strategy.
- Audit storage, append-only enforcement, monitoring, and incident ownership.
- Recovery objectives, backup ownership, and restore test cadence.

## 9. Explicit exclusions

No production or staging connection, credential provisioning, DDL, migration, live data access, approval execution, payment, shipment release, external B2B application change, NEXUS modification, PR merge, or deployment is authorized.

**Decision:** Keep Business Operations demo-only. Security threat model is proposed and requires independent review before implementation.
