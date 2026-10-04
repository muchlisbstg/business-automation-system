# n8n Workflows

n8n is the orchestration layer for business automation.

Workflow exports must contain no credentials or secrets and should be promoted through Git. Every production workflow should define input validation, correlation IDs, audit logging, idempotency where applicable, error handling, and approval gates for high-impact actions.

The proposal-only [WF-10/11 GitHub integration and AI review contract](WF-10-11-github-ai-review/README.md) defines a request shape only; it does not authorize GitHub access, AI execution, review publication, or notifications.
