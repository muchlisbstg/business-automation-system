# n8n Workflows

n8n is the orchestration layer for business automation.

Workflow exports must contain no credentials or secrets and should be promoted through Git. Every production workflow should define input validation, correlation IDs, audit logging, idempotency where applicable, error handling, and approval gates for high-impact actions.

The proposal-only [WF-10/11 GitHub integration and AI review contract](WF-10-11-github-ai-review/README.md) defines a request shape only; it does not authorize GitHub access, AI execution, review publication, or notifications.


The proposal-only [WF-12 Tests and coverage contract](WF-12-tests/README.md) defines a candidate test-request shape only; it does not resolve source code, execute tests, collect coverage, persist results, or gate CI.


The proposal-only [WF-13 Security findings contract](WF-13-security-findings/README.md) defines a candidate finding-report shape only; it does not run scanners, verify reports, persist findings, or gate CI.

The proposal-only [WF-14/15 Deployment gates and deployment contract](WF-14-15-deployment/README.md) defines a candidate deployment-request shape only; it does not evaluate gates, validate approval, resolve artifacts or targets, deploy, or send notifications.

The proposal-only [WF-16/17 Incident detection and response contract](WF-16-17-incidents/README.md) defines a candidate incident-signal shape only; it does not detect or confirm incidents, evaluate severity, authorize or execute responses, change incident state, persist records, or send notifications.

The proposal-only [WF-18 Technical debt contract](WF-18-technical-debt/README.md) defines a candidate-report shape only; it does not confirm or rank debt, create issues, assign work, recommend or perform remediation, persist records, or send notifications.


The proposal-only [WF-19 Documentation as code contract](WF-19-docs-as-code/README.md) defines a candidate request shape only; it does not read or validate documentation, modify or publish files, create CI results or gates, persist records, or send notifications.

The proposal-only [WF-20 Knowledge Base contract](WF-20-knowledge-base/README.md) defines a candidate-submission shape only; it does not verify, ingest, curate, store, index, retrieve, update, publish, or notify.


The proposal-only [WF-21/22 Daily brief and reporting contract](WF-21-22-reporting/README.md) defines a candidate-envelope shape only; it does not schedule, read or aggregate data, generate, persist, publish, or deliver reports, or send notifications. Slack and all other notifications are out of scope.
