# Business Automation System — Export Operations Architecture

An engineering platform and evolving reference architecture for business-process automation, with a documented target direction for export operations and Sharia-aware compliance controls.

> **Current status:** This repository contains working engineering components and workflow contracts alongside proposals and implementation roadmaps. It is **not evidence that every export workflow is implemented, legally compliant, Sharia-certified, or production-ready**. Check each module's documentation and CI results before relying on it.

## Who this repository is for

- **Developers:** understand service boundaries, contracts, migrations, tests, and contribution expectations.
- **Export operations:** understand the proposed order-to-settlement workflow and exception handling.
- **Compliance, legal, tax, customs, finance, and Sharia reviewers:** review control requirements and evidence expectations.
- **Auditors and business partners:** locate the architecture and control documents; implementation and assurance claims must be verified independently.

## Business scope and target workflow

The export-operations target covers:

1. Product, HS classification, supplier, buyer, and destination screening.
2. Quotation, contract versions, Incoterms, and required approvals.
3. Export documentation, permits, certificates, and customs milestones.
4. Inventory reservation, packing, shipment tracking, and delivery evidence.
5. Invoicing, receivables, bank receipts, settlement, and reconciliation.
6. Exceptions, complaints, corrective transactions, audit evidence, and reporting.

This list describes the **target business scope**, not a claim that all capabilities are currently implemented. Use the status of the specific service, workflow, and tests as the source of truth.

## Implementation status: read before use

Use these labels consistently in documentation and pull requests:

- **Implemented** — code exists; the relevant path has been inspected.
- **Tested** — named tests ran successfully on a stated commit/environment.
- **In progress** — implementation is underway.
- **Proposed** — design or contract only; not a claim of runtime behavior.
- **Not verified** — evidence is missing or insufficient.

The workflow roadmap includes contract proposals as well as existing components. A workflow name, schema, passing contract test, or architecture diagram does not by itself prove end-to-end production behavior. CI checks only what the configured jobs actually execute.

## Architecture principles

- Transactional business records belong in the authoritative database; Redis, where used, is for queue/cache functions, not the system of record.
- n8n coordinates workflows. Authorization, financial invariants, regulatory decisions, and approval rules must be enforced in trusted application services, not solely in workflow nodes or prompts.
- AI output is advisory and untrusted. It cannot approve a contract, certify a product, clear a restricted-party match, release a shipment, or authorize payment.
- Use idempotency, deduplication, bounded retries, explicit state transitions, and reconciliation for uncertain external outcomes.
- Keep traceable audit events with actor, action, timestamp, reason, correlation ID, decision evidence, and approver where applicable.
- Separate development, staging, and production environments; use least privilege and never commit credentials or production data.
- High-impact actions require appropriate authorization and independent approval; users must not approve their own restricted actions.

### Target architecture

```text
Sales / Supplier / Buyer / Logistics / Financial Providers
                         |
                Authenticated API / Portal
                         |
          Identity, RBAC, tenant and rate controls
                         |
 Product & HS | Counterparty | Contract | Export Controls
 Shipment & Docs | Invoice & Settlement | Sharia Review
                         |
             Transactional Services + PostgreSQL
                         |
                Outbox / Queue / n8n
                         |
       External adapters, monitoring and audit trail

       GitHub Actions: configured tests and CI checks
```

This is a target architecture. Verify each component's actual implementation before assuming it is deployed or connected.

## Compliance and Sharia governance

The repository documents controls; it does not provide a legal opinion, customs ruling, tax determination, fatwa, or certification.

- Evaluate export rules against the actual goods, HS classification, destination, sector, transaction facts, and rule version. Do not apply one sector's requirements to every export.
- Every applicable rule should retain the official source, rule identifier, effective dates, version/source snapshot, goods/HS and jurisdiction scope, accountable reviewer, verification time, approval status, and evidence used in the decision.
- **Fail closed:** hold the affected workflow and create a case for an authorized reviewer if HS classification is unclear or disputed, mandatory evidence is missing/expired, a screening match is unresolved, the applicable rule set is stale/unverified, or applicability cannot be established.
- AI may extract candidate information but must not make final legal classifications or release a compliance hold.
- Sharia-related decisions require an approved policy and qualified review appropriate to the product, contract, financing, and transaction. A product or service is not compliant merely because it is described as “Islamic” or “halal.”
- Legal, customs, tax, banking, destination-market, and Sharia applicability must be reviewed by appropriately qualified owners before production use.

See the [Sharia-compliant export architecture baseline](docs/export/sharia-compliant-export-architecture.md) and [Indonesia export regulatory control matrix](docs/export/indonesia-export-regulatory-controls.md). Revalidate official sources and amendments before each relevant release.

## Repository map

```text
README.md
docs/                  Architecture, security, workflows, export controls
apps/                  Application areas (check each directory's status)
api/                   API/service implementations and contracts
database/              Database assets (service-specific instructions apply)
workflows/             Workflow definitions, schemas, examples, proposals
tests/                 Configured automated tests and fixtures
.github/workflows/     GitHub Actions CI workflows
```

Not every directory or workflow represents a production-ready export feature. Consult the relevant subdirectory README and test suite.

## Local development and verification

There is no single repository-wide setup command guaranteed to start every service. Follow the instructions for the specific service you intend to work on.

1. Install the runtime and tool versions documented by that service. Do not assume every service uses the same runtime.
2. Clone the repository and install dependencies using the service's lockfile and documented package manager.
3. Configure local environment variables from the service's example configuration, if provided. Use synthetic data and local/test-only credentials.
4. Start only the documented local dependencies. Confirm database versions match the service's integration-test environment.
5. Apply migrations using that service's documented migration command. Do not run destructive reset commands against shared or production databases.
6. Run the service's type checks, unit tests, and relevant integration/contract tests.
7. Inspect the GitHub Actions results for the exact commit and confirm which jobs ran before reporting success.

### Current CI scope

The repository CI configuration includes baseline/path checks, JSON syntax and contract/schema validation, Python unit tests for contract-validation regressions, and configured PostgreSQL-backed tests for selected WF-01, WF-02, and WF-03 services. These checks do **not** prove all export capabilities, every regulatory rule, all security properties, or production readiness. Review [the CI workflow](.github/workflows/ci.yml) for the current exact commands and jobs.

Test credentials and fixture data in CI are for disposable test services only. Never use production credentials, live bank/customs/logistics accounts, real-money operations, or real customer data in local development or CI.

## Security, reliability, and operations

Before exposing a capability to real business traffic, verify at minimum:

- Authentication, role authorization, tenant isolation, and independent approval for sensitive actions.
- Secret handling, dependency/security scanning, webhook signature verification where supported, replay protection, and duplicate-event handling.
- Migration safety, backup and restore procedures, retention and access policies, and recovery testing.
- Monitoring and alerts, correlation IDs, retry/dead-letter behavior, reconciliation queues, and documented manual recovery.
- Negative-path, concurrency, partial-failure, timeout, provider-outage, and permission-denial tests.
- Incident ownership, escalation paths, and evidence preservation.

These are readiness criteria, not a statement that every item has already been implemented or verified. Do not enable production integrations until the responsible technical and business owners approve the relevant release gates.

## Documentation index

- [Technical architecture](docs/architecture.md)
- [Security baseline](docs/security.md)
- [Workflow documentation](docs/workflows.md)
- [Sharia-aware export architecture](docs/export/sharia-compliant-export-architecture.md)
- [Indonesia export regulatory controls](docs/export/indonesia-export-regulatory-controls.md)
- [GitHub portfolio remediation tracker](docs/operations/github-portfolio-remediation-tracker.md)

## Contributing and change control

For each change:

1. Describe the business/technical problem and affected workflow.
2. Identify security, data, regulatory, financial, and Sharia-control impacts where applicable.
3. Add or update tests, fixtures, schemas, migrations, and documentation.
4. Never include secrets, production data, or unredacted sensitive records in commits or test output.
5. Report commands actually run and their results; do not claim checks passed without evidence.
6. Require appropriate review and CI results before merging. Database and workflow changes must include rollback/recovery considerations.

## Limitations and assurance

This repository is an evolving engineering project. Documentation and passing tests are not a substitute for independent legal, customs, tax, security, financial-control, destination-market, or Sharia review. No certification, regulatory approval, guaranteed export clearance, or production service-level commitment is implied.

Before using any capability for a live transaction, verify its implementation, authorization model, current applicable rules, required evidence, operational monitoring, recovery procedures, and approvals.

## License and support

Check the repository's license file and contribution/support policies before redistribution or external use. If a license or support policy is absent, do not assume one; establish it explicitly with the repository owner.
