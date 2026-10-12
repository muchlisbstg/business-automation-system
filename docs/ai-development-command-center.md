# AI Development Command Center — Implementation Plan

## Implemented in the security branch

- OIDC SSO entry point using Auth.js and server-side session validation.
- PostgreSQL-backed team membership and repository-specific role overrides.
- Versioned migrations with advisory locking.
- Transactional approval decisions with row-level locking, independent human approver, expiry, required rejection reason, persisted approver identity, and audit event.
- CI workflow with PostgreSQL 16 service, migration execution, unit/integration tests, typecheck and production build.

## Explicitly not production-ready

- Real OIDC tenant, client credentials, session-secret management, and account lifecycle are not configured by code alone.
- No admin UI or API for safely provisioning team/repository memberships.
- Existing dashboard metrics are illustrative; GitHub integration still requires real server-side credentials and access validation.
- Approval decisions record a decision only; no GitHub mutation, deploy, or other high-impact action executor is exposed.
- CI must be observed as passing on the final commit before this implementation slice can be called verified.
- Production database privileges, TLS, backup/restore evidence, SAST/dependency/secret scans, SBOM, branch protection, staging and deployment approvals remain outstanding.

## Architecture

Browser → Auth.js OIDC session → scoped API authorization → PostgreSQL. Roles are resolved from team_members and repository_members; IdP-provided role claims are not authoritative. Approval decision → transaction → SELECT FOR UPDATE → expiry / self-approval / repository-role checks → conditional state update → audit event → commit. No action executes as a side effect of approval.

## Required release gates

1. Verify OIDC login, logout, session expiry, and deprovisioning against the actual corporate identity provider.
2. Verify the full team/repository role matrix and deny-by-default behavior.
3. Run migrations and transactional integration tests on PostgreSQL in GitHub Actions; all jobs must pass on the final head commit.
4. Configure least-privilege production DB roles, TLS, backups and restore tests.
5. Add security scanning, branch protection and protected environments.
6. Validate in staging and obtain explicit human approval before production deployment.
