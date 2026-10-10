# Deterministic Release Gates

## Purpose

Make every release decision traceable to a commit, reproducible checks, environment, and authorized human decision. AI-generated summaries may assist reviewers but are never the authority for passing a gate.

## Gate sequence

1. **Change hygiene** — scope is documented; secrets and generated artifacts are excluded.
2. **Static validation** — formatting, linting, schema validation, and type checks appropriate to the changed package.
3. **Automated tests** — unit and contract tests; integration tests for changed persistence or external boundaries.
4. **Security checks** — secret scanning, dependency review, and permission-boundary review.
5. **Artifact identity** — build once and identify the artifact by immutable commit SHA or digest.
6. **Staging** — deploy the identified artifact and run health checks and smoke tests.
7. **Human production approval** — an authorized approver reviews test evidence, change scope, impact, and rollback plan.
8. **Post-deploy verification** — health, error rate, queue depth, and key business signals are checked; incidents trigger rollback or mitigation.

## Required release record

Each production release record should include:

- repository and commit SHA;
- workflow run and artifact identifier;
- target environment;
- test/security evidence links;
- migration and compatibility notes;
- approver identity, timestamp, and decision;
- rollback plan and owner;
- post-deployment verification result.

## Fail-closed rules

- Missing required evidence means **BLOCKED**, not passed.
- Failed required checks mean **BLOCKED**.
- AI recommendations cannot set approval state or bypass policy.
- Approval applies only to the reviewed commit and scope; a changed commit requires re-evaluation.
- Destructive data operations require a separately scoped approval and recovery plan.
- A timeout, missing integration, or unknown status must not be treated as success.

## Workflow engine responsibilities

n8n may collect evidence, route notifications, and request approvals. GitHub Actions or an equivalent CI runner executes build/test/deploy commands. The application/API remains responsible for authorization and durable audit records.

## Minimum audit fields

`event_id`, `correlation_id`, `subject_type`, `subject_id`, `action`, `decision`, `actor_id`, `timestamp`, `commit_sha`, `environment`, `evidence_refs`.

Do not store tokens, passwords, private keys, or unnecessary personal data in audit payloads.

## Rollout checklist

- [ ] Map existing workflows to the gate sequence.
- [ ] Define mandatory checks by change risk.
- [ ] Verify approval actor authorization server-side.
- [ ] Exercise denied approval and missing-evidence cases.
- [ ] Test rollback in staging.
- [ ] Confirm audit records survive retries and duplicate webhook delivery.
- [ ] Publish a release runbook before enabling production deployment.
