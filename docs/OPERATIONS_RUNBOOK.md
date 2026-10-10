# Operations Runbook

This runbook defines a safe first-response process for the business automation platform. Adapt commands and alert names to the actual deployment; the repository does not imply that every operational integration is already deployed.

## 1. First response

1. Identify the affected workflow, environment, run ID, and correlation ID.
2. Check the latest deployment/change and compare the failing run with the last known-good run.
3. Determine whether the failure is isolated, repeated, or affecting multiple tenants.
4. Pause the affected workflow only when doing so is safe and authorized.
5. Preserve relevant logs and audit events before retrying or replaying work.
6. Record the incident owner, severity, time detected, and customer/business impact.

## 2. Retry decision

Retry only after confirming the operation is safe to repeat.

- **Validation error:** correct the source input; do not blindly retry.
- **Rate limit or transient dependency error:** use bounded retry with backoff and jitter when the operation is idempotent.
- **Timeout with unknown outcome:** inspect downstream state before replaying.
- **Duplicate/idempotency conflict:** compare request identity and payload hash; do not mint a new key merely to bypass a conflict.
- **Authorization or policy denial:** stop and obtain an authorized decision; do not weaken the gate to make the workflow pass.
- **Database migration failure:** stop subsequent rollout, capture the failing statement and migration version, and follow the reviewed recovery plan.

## 3. Production approval

Before a production deployment or destructive operation, verify:
- The exact commit SHA or artifact digest is immutable and matches the reviewed change.
- Required CI, security checks, and staging verification are complete.
- Database changes have a reviewed migration and recovery strategy.
- The approval identifies the actor, environment, operation, request/artifact hash, timestamp, and reason.
- The approval is still valid and has not been reused for a different artifact.
- A named operator owns post-change verification and rollback.

AI output and workflow status are advisory evidence only. Neither is a substitute for authorized human approval.

## 4. Data and secrets

- Never paste tokens, credentials, customer records, or sensitive payloads into issues or logs.
- Rotate credentials after suspected exposure and review access logs.
- Use separate credentials and resources for dev, staging, and production.
- Confirm tenant scope before inspecting or repairing records.
- Prefer a reviewed, reversible correction over direct database edits.
- Validate backup restoration periodically; a successful backup job alone is not proof of recoverability.

## 5. Recovery and closure

1. Confirm the triggering condition is understood.
2. Apply the approved fix or rollback.
3. Verify health, expected business state, audit trail, and duplicate prevention.
4. Reconcile any partially completed downstream side effects.
5. Communicate impact and recovery status to the designated stakeholders.
6. Write a post-incident review with timeline, root cause, contributing factors, and corrective actions.
7. Convert follow-up actions into owned, testable backlog items.

## 6. Minimum incident record

Record: incident ID, environment, workflow/run ID, correlation ID, first observed time, severity, affected scope, summary, decision log, approvals, actions taken, outcome, evidence links, and follow-up owners. Exclude secrets and unnecessary personal data.

## Scope and limitations

This is an operational guide, not a live monitoring integration or a claim of service-level objectives, disaster-recovery readiness, or regulatory compliance. Link real deployment-specific dashboards, alerts, and tested recovery evidence before relying on this runbook.
