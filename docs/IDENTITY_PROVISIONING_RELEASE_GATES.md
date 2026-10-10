# Identity Provisioning Release Gates

## Purpose

Coordinate delivery of secure identity onboarding and tenant-scoped role administration for enterprise-export-platform-usa, with architecture and portfolio evidence maintained in Full-stack-product-development.

## Current state

The API has OIDC token verification, tenant principal resolution, permission checks, and transactional order lifecycle transitions. Role/permission templates exist, but no administrative role-grant endpoint or customer onboarding workflow is implemented. The first-admin bootstrap path and provider-specific staging integration remain open.

## Work gates

| Gate | Required evidence | Release rule |
|---|---|---|
| G1 — Policy | Threat model, tenant admin policy, separation of duties, audit requirements | No implementation until roles and boundaries are reviewed |
| G2 — Data model | Migration, tenant-safe constraints, audit and idempotency strategy | Migration tested against PostgreSQL and rollback/recovery documented |
| G3 — Service | Identity reconciliation, membership lifecycle, role grant/revoke service | No direct request-body actor identity; all writes transactional |
| G4 — API | Explicit routes, OIDC principal, dedicated permissions, validation | Deny by default; tenant scope derived from active membership |
| G5 — Tests | Positive and negative PostgreSQL integration tests | CI must pass; self-grant and cross-tenant denial required |
| G6 — Bootstrap | Out-of-band first-admin procedure, two-person approval | No default production admin or shared bootstrap secret |
| G7 — Staging | Chosen IdP, real provider-issued token tests, secret configuration, security review | No staging-verified label without observed evidence |
| G8 — Release | Migration rehearsal, approval, deployment, smoke tests, rollback plan | No production claim before approved deployment and verification |

## Automation requirements

- Automation may prepare changes, run checks, capture evidence, and open pull requests.
- CI results are evidence, not authorization to deploy.
- AI output is advisory only and cannot approve its own changes.
- Human approval remains mandatory for production deployment, destructive changes, or elevated access provisioning.
- Audit records must exclude credentials and tokens.
- A failed or missing required check blocks merge/release according to repository policy.

## Cross-repository responsibilities

- enterprise-export-platform-usa: code, migration, OpenAPI, security tests.
- business-automation-system: release gates, approvals, orchestration, evidence capture.
- Full-stack-product-development: ADRs, delivery roadmap, case-study evidence, external portfolio claims.

## Evidence vocabulary

- Implemented — merged implementation exists.
- CI verified — relevant workflow has completed successfully.
- Staging verified — real-provider staging scenario has passed and evidence is recorded.
- Production deployed — approved deployment and post-deployment checks are confirmed.

Do not infer legal/export compliance, certifications, customer readiness, or production status from passing CI.
