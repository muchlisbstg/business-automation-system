# NEXUS AI — Engineering Control Plane

Enterprise dashboard starter for multi-team, multi-repository full-stack development governance.

## Scope

- Next.js App Router + TypeScript dashboard shell.
- Server-side GitHub repository read adapter with explicit repository allowlist.
- PostgreSQL schema for teams, memberships, projects, repositories, approvals, audit events, and AI-agent runs.
- Human approval is a mandatory domain rule for high-impact actions.

## Status and limitations

This is an initial scaffold, not a production-ready service. GitHub integration is inactive until server environment variables and repository permissions are configured. PostgreSQL schema is a baseline and is not automatically applied. Authentication/SSO, session-backed RBAC, CSRF protection, approval decision endpoints, webhook signature verification, migrations, integration tests, and deployment pipelines must be implemented and verified before production use. No write-capable GitHub actions or production deployments are exposed by this starter.

## Local development

1. Install Node.js 22+ and PostgreSQL 16+.
2. Copy `.env.example` to `.env.local` and configure secrets locally.
3. Run `npm install`.
4. Apply `database/schema.sql` to a disposable development database.
5. Run `npm run dev`.

## Environment

- `DATABASE_URL`: server-only PostgreSQL connection string.
- `GITHUB_TOKEN`: server-only fine-grained token with read-only metadata/content permissions for explicitly allowed repositories.
- `GITHUB_OWNER`: repository owner.
- `GITHUB_REPOSITORIES`: comma-separated allowlist. Keep this list minimal.

## Security gates

- Never expose GitHub tokens to client-side bundles.
- Do not enable write scopes until authenticated approval workflows exist.
- A requester cannot approve their own request; the database schema enforces this invariant.
- AI agents cannot approve their own changes. Treat agent output as untrusted until deterministic checks and human review pass.
- Require SSO/session auth, RBAC, audit logging, CSRF protections, and GitHub branch protection before enabling mutation workflows.
