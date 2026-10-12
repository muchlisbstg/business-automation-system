# AI Development Command Center — Implementation Plan

## Current implementation slice

- Editable Figma design-system page with local dark tokens and reusable button, badge, KPI card, navigation, and agent-status components.
- Next.js App Router + TypeScript dashboard shell with responsive dark UI.
- Server-only GitHub client and explicit repository allowlist endpoint.
- PostgreSQL schema baseline for teams, team memberships, projects, repositories, approvals, audit logs, and agent runs.
- Health/configuration endpoint that reports whether required integration variables are present.
- GitHub Actions workflow for TypeScript validation and production build.

## Not yet production-ready

- No authentication/SSO, session management, or enforced application RBAC.
- No live PostgreSQL connection, migration runner, repository sync persistence, or audit writes.
- No approval decision endpoint or action executor. The dashboard is intentionally read-only.
- No AI provider/agent runtime, queue, n8n workflows, or live CI run ingestion.
- No end-to-end tests, dependency/security scanning, deployment workflow, or environment-specific secrets configured.

## Target architecture

Browser → Next.js UI → server-side API layer → PostgreSQL and read-only GitHub API adapter.

High-impact action proposal → persisted approval request → independent authorized human decision → deterministic policy validation → separately authenticated executor → immutable audit event. The requester cannot approve their own request. AI identities are never valid approvers.

## Release gates

1. Implement SSO/OIDC and server-side session validation.
2. Enforce team/project/repository-scoped RBAC on every API route.
3. Add SQL migrations, connection pooling, transactions, least-privilege DB role, and backup/restore tests.
4. Add signed webhook verification and idempotent GitHub event processing.
5. Implement approval state machine with optimistic locking, expiry, independent approver, reason, and audit persistence.
6. Add unit/integration/E2E tests, SAST, dependency scanning, secret scanning, and SBOM.
7. Configure branch protection and required CI checks; keep production deploy behind a protected environment with required reviewers.
8. Validate in staging before any production rollout.
