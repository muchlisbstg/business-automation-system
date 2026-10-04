# Workflow Roadmap

The automation platform is organized as deterministic, auditable workflows.

| ID | Scope |
|---|---|
| WF-01 | Intake and validation |
| WF-02 | Planning, PRD, and task validation |
| WF-02→WF-03 | [Requirement-level human-review signal bridge](../workflows/WF-02-03-review-signal/README.md) |
| WF-03 | Orchestration |
| WF-04 | ADR generation and review |
| WF-05 | [Figma to development handoff (contract proposal)](../workflows/WF-05-figma-handoff/README.md) |
| WF-06 | [Frontend quality assurance (contract proposal)](../workflows/WF-06-frontend-qa/README.md) |
| WF-07 | [API quality assurance (contract proposal)](../workflows/WF-07-api-qa/README.md) |
| WF-08 | [Database quality assurance (contract proposal)](../workflows/WF-08-database-qa/README.md) |
| WF-09 | [Mobile quality assurance (contract proposal)](../workflows/WF-09-mobile-qa/README.md) |
| WF-10/11 | [GitHub integration and AI review (contract proposal)](../workflows/WF-10-11-github-ai-review/README.md) |
| WF-12 | [Tests and coverage (contract proposal)](../workflows/WF-12-tests/README.md) |
| WF-13 | [Security findings (contract proposal)](../workflows/WF-13-security-findings/README.md) |
| WF-14/15 | [Deployment gates and deployment (contract proposal)](../workflows/WF-14-15-deployment/README.md) |
| WF-16/17 | [Incident detection and response (contract proposal)](../workflows/WF-16-17-incidents/README.md) |
| WF-18 | [Technical debt (contract proposal)](../workflows/WF-18-technical-debt/README.md) |
| WF-19 | [Documentation as code (contract proposal)](../workflows/WF-19-docs-as-code/README.md) |
| WF-20 | [Knowledge base (contract proposal)](../workflows/WF-20-knowledge-base/README.md) |
| WF-21/22 | [Daily brief and reporting (contract proposal)](../workflows/WF-21-22-reporting/README.md) |
| WF-23 | [Learning loop (contract proposal)](../workflows/WF-23-learning/README.md) |
| WF-24 | [Daily engineering metrics (contract proposal)](../workflows/WF-24-engineering-metrics/README.md) |
| WF-25 | [Human approval decision records (proposal; revised candidate)](../workflows/WF-25-human-approval-decision-records/README.md) |

## Governance

A workflow may propose an action automatically, but high-impact production actions require human approval. AI review can identify issues and propose changes but cannot approve its own recommendations.
