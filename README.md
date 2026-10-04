# business-automation-system

Engineering-focused business automation platform integrating APIs, webhooks, n8n orchestration, AI-assisted processes, backend services, database operations, testing, and controlled CI/CD.

## Engineering principles

- n8n is the orchestration layer only.
- Build, test, security scanning, and deployment run in GitHub Actions or cloud infrastructure.
- AI is advisory and untrusted; deterministic gates remain authoritative.
- Production deployment and destructive data operations require human approval.
- Workflows are idempotent where applicable, auditable, and traceable with correlation IDs.
- Secrets and credentials never enter workflow exports or source control.

## Repository layout

```text
business-automation-system/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── security.md
│   └── workflows.md
├── apps/
├── workflows/
├── api/
├── database/
├── tests/
└── .github/
    └── workflows/
        └── ci.yml
```

## Runtime architecture

```text
Business Applications
        │
        ▼
     REST APIs
        │
        ▼
    API Layer
        │
   ┌────┴────┐
   ▼         ▼
 Webhooks   Backend
   │         │
   └────┬────┘
        ▼
       n8n
        │
   ┌────┼─────────┐
   ▼    ▼         ▼
  AI   Database  External Services
```

## Environments

- **dev** — development and integration
- **staging** — production-like validation
- **prod** — controlled production workloads

Production n8n is intended for queue mode with main and worker processes. PostgreSQL is the primary transactional store and Redis supports queueing where required.

## Workflow roadmap

WF-01 Intake → WF-02 Planning → WF-03 Orchestration → WF-04 ADRs → [WF-05 Figma handoff (contract proposal)](workflows/WF-05-figma-handoff/README.md) → [WF-06 Frontend QA (contract proposal)](workflows/WF-06-frontend-qa/README.md) → [WF-07 API QA (contract proposal)](workflows/WF-07-api-qa/README.md) → [WF-08 Database QA (contract proposal)](workflows/WF-08-database-qa/README.md) → [WF-09 Mobile QA (contract proposal)](workflows/WF-09-mobile-qa/README.md) → [WF-10/11 GitHub + AI review (contract proposal)](workflows/WF-10-11-github-ai-review/README.md) → [WF-12 Tests and coverage (contract proposal)](workflows/WF-12-tests/README.md) → [WF-13 Security findings (contract proposal)](workflows/WF-13-security-findings/README.md) → [WF-14/15 Deployment gates and deployment (contract proposal)](workflows/WF-14-15-deployment/README.md) → [WF-16/17 Incident detection and response (contract proposal)](workflows/WF-16-17-incidents/README.md) → [WF-18 Technical debt (contract proposal)](workflows/WF-18-technical-debt/README.md) → [WF-19 Docs-as-code (contract proposal)](workflows/WF-19-docs-as-code/README.md) → [WF-20 Knowledge Base (contract proposal)](workflows/WF-20-knowledge-base/README.md) → [WF-21/22 Daily brief and reporting (contract proposal)](workflows/WF-21-22-reporting/README.md) → [WF-23 Learning (contract proposal)](workflows/WF-23-learning/README.md) → WF-24 Metrics.

## Quality and governance

CI validates the repository baseline. Future gates should cover tests, coverage, API contracts, authorization, database safety, accessibility/performance, mobile behavior, security findings, deployment health, and auditability. AI-generated recommendations cannot bypass deterministic gates or human approval requirements.

See `docs/architecture.md`, `docs/security.md`, and `docs/workflows.md` for the engineering baseline.
