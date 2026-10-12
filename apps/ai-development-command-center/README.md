# NEXUS AI — Engineering Control Plane

Enterprise dashboard starter for multi-team, multi-repository full-stack development governance.

## Implemented security slice

- OIDC SSO using Auth.js; configure the trusted issuer, client ID/secret and AUTH_SECRET before sign-in can work.
- Server session identity is the OIDC subject (sub). Application roles are not trusted from identity-provider claims; they come from PostgreSQL membership records.
- Team membership and repository-specific membership tables. Repository roles override team roles for that repository.
- PostgreSQL connection pool and versioned, advisory-locked SQL migrations.
- Approval decision API with row locking, pending-state checks, expiry handling, independent approver, scoped reviewer role, required rejection reason, and approver identity in both approval row and audit log.
- GitHub Actions uses a disposable PostgreSQL 16 service to run migrations, unit tests, transactional integration tests, typecheck and build.

## Not production-ready

This is still a development scaffold until the release gates below are verified. No real SSO provider, production database, GitHub credentials, branch protection, or production environment are configured by this change. Dashboard KPI values remain illustrative. Approval decisions do not execute GitHub writes or deploy software.

## Local development

1. Use Node.js 22+ and PostgreSQL 16+.
2. Copy .env.example to .env.local; configure DATABASE_URL, AUTH_SECRET, AUTH_OIDC_ISSUER, AUTH_OIDC_CLIENT_ID, and AUTH_OIDC_CLIENT_SECRET from your organization's identity provider.
3. Install dependencies with npm install.
4. Apply migrations with npm run migrate (only against a disposable/local database unless an operator has approved the target).
5. Run tests with npm test, typecheck with npm run typecheck, and build with npm run build.
6. Start with npm run dev.

## Role model

| Role | Read scoped resources | Decide approvals |
| --- | --- | --- |
| owner / admin | Yes | Yes |
| engineering_lead | Yes | Yes |
| reviewer | Yes | Yes |
| developer | Yes | No |
| auditor | Yes | No |

Membership subjects must exactly match the OIDC sub claim. Assign team membership in team_members; use repository_members for repository-specific access. The repository-specific role overrides the team role.

## API

POST /api/approvals/:approvalId/decision

JSON body: { "decision": "approved" | "rejected", "reason": "..." }. Authenticated session required. Browser requests must include the same-origin Origin header. Rejection requires a reason of at least 8 characters. Approval must have a repository_id, requester and approver must differ, and the actor must have an approver role in that team/repository. The endpoint records decided_by, decided_at, decision reason, and an audit event in one database transaction. It does not execute the approved action.

## Environment

- DATABASE_URL: server-only PostgreSQL connection string.
- DATABASE_POOL_MAX: connection pool size (default 10).
- DATABASE_SSL=true: enable TLS with certificate verification.
- AUTH_SECRET: high-entropy Auth.js session secret.
- AUTH_OIDC_ISSUER, AUTH_OIDC_CLIENT_ID, AUTH_OIDC_CLIENT_SECRET: trusted corporate OIDC provider.
- AUTH_TRUST_HOST: enable only when the hosting/proxy trust boundary is understood.
- GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPOSITORIES: read-only GitHub integration settings.

## Release gates

- Verify CI passes on the current commit, including real PostgreSQL migration and integration tests.
- Configure the real SSO issuer and test login, logout, session expiry, and account deprovisioning.
- Provision least-privilege database roles, managed TLS, backups and a tested restore.
- Add authenticated admin provisioning for team/repository memberships and review the access matrix.
- Add CSRF/browser security tests, SAST, dependency and secret scanning, SBOM, branch protection, and protected deployment environments.
- Validate in staging and obtain explicit approval before any production deployment.
