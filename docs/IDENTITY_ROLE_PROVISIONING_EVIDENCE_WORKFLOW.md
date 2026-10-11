# Identity Role Provisioning Evidence Workflow

## Purpose

Provide a repeatable, human-reviewable evidence trail for the identity-role provisioning milestone across the three repositories. This document defines the evidence workflow; it does not itself authorize deployment or elevated access.

## Source repositories

| Responsibility | Repository |
|---|---|
| API, migrations, authorization and tests | `muchlisbstg/enterprise-export-platform-usa` |
| Release gates, automation and evidence coordination | `muchlisbstg/business-automation-system` |
| Case study and public portfolio claims | `muchlisbstg/Full-stack-product-development` |

## Evidence record

For each milestone, capture the following in a pull request or release record:

- Repository and immutable commit SHA.
- Pull request URL and merge state.
- Workflow run URL, conclusion, and relevant test jobs.
- Migration identifiers and whether a disposable PostgreSQL run passed.
- Security test coverage and known exclusions.
- Human reviewer/approver identity recorded by the platform, review time, and scope of approval.
- Rollback or recovery plan for any database or release change.
- A status label supported by observed evidence: Implemented, CI verified, Staging verified, or Production deployed.

Never copy tokens, authorization headers, secrets, raw identity-provider claims, or customer personal data into the evidence record.

## Gate procedure

1. **Prepare:** open a focused pull request; state behavior, threat boundaries, migration impact, and explicit non-goals.
2. **Validate:** wait for every required CI job to finish. A pending, skipped-required, or failed check is not a pass.
3. **Review:** human reviewer checks tenant isolation, least privilege, self-grant prevention, idempotency, audit atomicity, and tests.
4. **Merge:** merge only after the relevant checks and reviews are satisfied. Record the resulting merge SHA.
5. **Re-verify:** inspect post-merge CI on the target branch; do not infer main-branch health from a pre-merge run alone.
6. **Stage:** require a chosen identity provider, protected environment configuration, real-provider token tests, and operator sign-off before using the Staging verified label.
7. **Release:** production, destructive changes, and elevated access provisioning require explicit human approval, a rollback plan, and post-deployment checks.
8. **Publish:** update the portfolio only with claims matching the strongest observed evidence; link to source PRs and workflow runs.

## Blocking rules

- AI-generated review is advisory and cannot approve its own work.
- CI success is evidence, not permission to deploy.
- Missing or ambiguous evidence blocks a status upgrade.
- Do not automatically grant `roles:grant` or `roles:revoke` to any identity.
- First-administrator bootstrap is a separately reviewed, out-of-band procedure.
- If audit persistence fails, the mutation must fail closed and roll back.
- No compliance, certification, customer-readiness, or production claim is inferred from passing CI.

## Checklist

- [ ] PR and immutable SHA recorded
- [ ] All required CI jobs passed
- [ ] Post-merge target-branch CI passed
- [ ] Human security review recorded
- [ ] Tenant-boundary and self-elevation negative tests covered
- [ ] Audit and idempotency behavior covered
- [ ] Bootstrap and staging gates explicitly addressed
- [ ] Rollback and recovery plan recorded where applicable
- [ ] Portfolio status language reviewed against evidence
