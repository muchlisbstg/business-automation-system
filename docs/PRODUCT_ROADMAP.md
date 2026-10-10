# Business Automation System — Delivery Roadmap

## Product objective

Provide a reliable automation foundation for business processes using API services, webhooks, n8n orchestration, PostgreSQL-backed state, auditable approvals, and deterministic CI/CD controls.

**Current positioning:** engineering platform and workflow-contract repository. A documented workflow or contract is not, by itself, proof that the workflow is deployed or production-operational.

## Product boundaries

- n8n coordinates business workflows; it is not the build, test, or deployment engine.
- Application services own validation, authorization, persistence, and business rules.
- GitHub Actions runs repeatable CI checks and controlled delivery jobs.
- AI may summarize, classify, or recommend. It cannot approve its own output or bypass deterministic policy checks.
- Production deployment, destructive operations, and sensitive policy changes require explicit authorized human approval.

## Delivery phases

### Phase 0 — Baseline and governance
- [ ] Inventory workflow contracts, APIs, migrations, tests, and CI jobs.
- [ ] Define owners, risk tiers, data classifications, and environment boundaries.
- [ ] Define a common correlation ID and audit-event schema.
- [ ] Document secrets management, retention, backup, and recovery expectations.

**Exit criteria:** all current workflows have an owner, contract, risk level, and test approach.

### Phase 1 — Intake and planning
- [ ] Validate WF-01 intake request shape and required fields.
- [ ] Validate WF-02 planning output and requirement-level review signals.
- [ ] Reject malformed or incomplete requests with stable error codes.
- [ ] Test idempotency and duplicate submissions.

**Exit criteria:** positive and negative fixtures pass; repeated requests do not create unintended duplicate work.

### Phase 2 — Orchestration and persistence
- [ ] Validate WF-03 orchestration transitions and authorization.
- [ ] Apply migrations to an ephemeral PostgreSQL test database.
- [ ] Persist execution state and audit events transactionally where required.
- [ ] Cover retry, timeout, duplicate event, and partial failure cases.

**Exit criteria:** CI proves migrations and service tests pass; failure paths remain observable.

### Phase 3 — Quality and security integrations
- [ ] Connect Figma, frontend, API, database, and mobile QA contracts incrementally.
- [ ] Add schema, unit, integration, and end-to-end validation where applicable.
- [ ] Add secret scanning and dependency review.
- [ ] Treat AI review as advisory; a deterministic policy engine decides gate status.

**Exit criteria:** each integration has a documented input/output contract and positive/negative fixtures.

### Phase 4 — Controlled delivery and operations
- [ ] Separate build artifacts from deployment execution.
- [ ] Bind deployments to immutable commit SHA and environment.
- [ ] Require approval for production and destructive changes.
- [ ] Add health checks, rollback procedure, incident records, and post-deployment verification.

**Exit criteria:** staging deployment and rollback are tested before production use.

### Phase 5 — Reporting and continuous improvement
- [ ] Report workflow success/failure rates, duration, retries, and queue depth.
- [ ] Track incidents, technical debt, coverage, and escaped defects.
- [ ] Keep metrics definitions versioned and auditable.
- [ ] Review automation value and operational cost regularly.

## Cross-cutting acceptance criteria

1. Inputs are validated at trust boundaries.
2. Authorization is checked server-side, not inferred from UI state.
3. Sensitive values are not committed to source control or emitted to logs.
4. Side-effecting operations are idempotent where practical.
5. Errors have stable, documented semantics and a traceable correlation ID.
6. Every approval records actor, scope, timestamp, decision, and evidence.
7. Tests cover both allowed and denied paths.
8. A workflow cannot self-approve an AI-generated recommendation.
9. Production release evidence links to the tested commit SHA.
10. Documentation labels proposals, implemented behavior, and verified results separately.

## Release gates

| Gate | Required evidence |
|---|---|
| Contract | Schema and fixture validation |
| Code | Typecheck/lint and unit tests for changed services |
| Data | Migration and persistence tests where applicable |
| Security | Secret scan and review of permission boundaries |
| Staging | Health check and smoke-test results |
| Production | Named human approval, commit SHA, rollback plan, and audit record |

## Not claimed by this roadmap

This document does not assert that all listed work is implemented, that the platform is deployed, or that it has a security or compliance certification. Mark each item complete only after evidence is attached.
