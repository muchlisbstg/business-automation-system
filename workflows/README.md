# n8n Workflows

n8n is the orchestration layer for business automation.

Workflow exports must contain no credentials or secrets and should be promoted through Git. Every production workflow should define input validation, correlation IDs, audit logging, idempotency where applicable, error handling, and approval gates for high-impact actions.

The proposal-only [WF-10/11 GitHub integration and AI review contract](WF-10-11-github-ai-review/README.md) defines a request shape only; it does not authorize GitHub access, AI execution, review publication, or notifications.


The proposal-only [WF-12 Tests and coverage contract](WF-12-tests/README.md) defines a candidate test-request shape only; it does not resolve source code, execute tests, collect coverage, persist results, or gate CI.


The proposal-only [WF-13 Security findings contract](WF-13-security-findings/README.md) defines a candidate finding-report shape only; it does not run scanners, verify reports, persist findings, or gate CI.

The proposal-only [WF-14/15 Deployment gates and deployment contract](WF-14-15-deployment/README.md) defines a candidate deployment-request shape only; it does not evaluate gates, validate approval, resolve artifacts or targets, deploy, or send notifications.
