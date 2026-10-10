# Multi-Repository Release Coordination

## Purpose

Coordinate the portfolio repository, business automation system, and Enterprise Export Platform without creating hidden cross-repository dependencies or overstating release readiness.

## Repository ownership

| Repository | Owns | Must not claim |
| --- | --- | --- |
| [Full-stack Product Development](https://github.com/muchlisbstg/Full-stack-product-development) | Portfolio narrative and evidence links | That a case study is production software unless runtime evidence exists |
| This repository: Business Automation System | Workflow contracts, automation orchestration patterns, CI/CD and operations policy | That a workflow marked contract/proposal is deployed or active |
| [Enterprise Export Platform USA](https://github.com/muchlisbstg/enterprise-export-platform-usa) | Export order API, schema migrations, order lifecycle and authorization implementation | That identity tables equal authentication, or that the product is export-law compliant or certified |

## Dependency direction

- The portfolio links to evidence; it is not a runtime dependency of either application repository.
- The automation system may orchestrate approved engineering tasks, but it must not bypass repository CI, permission checks, or human approval.
- The export platform owns its business rules, data migrations, and API security. The automation system must not duplicate or silently override those rules.
- Cross-repository automation should pass immutable repository name, commit SHA, workflow run URL, and result status as inputs/evidence.

## Pull-request workflow

1. Create a focused branch in the repository that owns the change.
2. Make changes with tests and documentation; never write directly to production.
3. Run deterministic validation: lint/typecheck/tests/schema validation/security scans as applicable.
4. Inspect the exact commit's check runs. A queued or in-progress check is not a pass.
5. Review schema compatibility, tenant boundaries, secret exposure, and rollback path.
6. Merge only after required checks pass and applicable human review/approval is present.
7. Verify the merge commit and post-merge CI result.
8. Update portfolio evidence after the source repository is verified.

## Release coordination record

For every cross-repository change, capture:

- Change identifier and short purpose
- Owning repository and PR URL
- Source branch and exact head SHA
- Dependent repositories and the minimum required commit
- CI check names, run URLs, and final conclusions
- Migration/deployment impact and rollback strategy
- Human approver for production or destructive changes
- Portfolio evidence link and remaining limitations

## Current security milestone

The export platform has moved beyond the design-only stage. The OIDC verifier and tenant principal resolver were merged in [PR #12](https://github.com/muchlisbstg/enterprise-export-platform-usa/pull/12); the system role/permission catalog was added in [PR #13](https://github.com/muchlisbstg/enterprise-export-platform-usa/pull/13); transactional order lifecycle routes and PostgreSQL integration tests were merged in [PR #14](https://github.com/muchlisbstg/enterprise-export-platform-usa/pull/14). The design boundary remains documented in [ADR-004](https://github.com/muchlisbstg/enterprise-export-platform-usa/blob/main/docs/ADR-004-OIDC-AUTHORIZATION-BOUNDARY.md).

The API now requires configured OIDC issuer and audience at startup, resolves issuer+subject to an active organization membership, and enforces route permissions. System role templates do not automatically grant roles to users. Provider configuration, identity onboarding, an audited admin role-management path, production deployment, and independent security review remain outstanding. A cryptographic JWT regression suite was merged in [PR #15](https://github.com/muchlisbstg/enterprise-export-platform-usa/pull/15) after its CI checks passed.

## Safe automation contract

An automation may prepare branches, validate files, run tests, and open pull requests only within its granted permissions. It must stop on failed, missing, or pending required checks. AI output is advisory, not a source of authorization. Production deployment, deletion, irreversible data changes, and privilege grants require an explicit authorized human approval.

## Recovery and rollback

- For code-only changes, revert the merge commit through a reviewed pull request.
- For database changes, use a reviewed forward-fix or a tested, explicitly approved rollback; never assume dropping a migration's tables is safe.
- Preserve audit evidence and workflow logs needed to diagnose the event.
- Do not automatically retry a non-idempotent operation unless the idempotency behavior has been verified.

## Status semantics

- planned: no implementation evidence yet.
- in progress: work exists on a branch or PR but is not merged.
- implemented: merged code exists; state whether tests cover it.
- verified: the relevant checks passed for a named commit.
- deployed: a specific environment deployment was confirmed independently.
- compliant or certified: use only with separately verified scope and evidence; CI passing is not proof of compliance.
