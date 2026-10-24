# Sharia-Compliant Export Business Architecture Baseline

**Status:** architecture proposal and control baseline; not a fatwa, legal opinion, certification, or production-readiness claim.  
**Scope:** export business operations, from product and buyer screening through order, trade documentation, shipment, settlement, reconciliation, and audit.  
**Implementation rule:** controls described as “must” are acceptance requirements before the relevant capability is enabled. Existing repository code must be verified against these requirements.

## 1. Objectives and non-goals

Build a traceable export-operations platform that supports Sharia-aware product and transaction review while complying with applicable origin-country, destination-country, customs, sanctions, tax, product-safety, privacy, and trade-control requirements.

This baseline does not automatically certify a product, company, buyer, financing arrangement, or transaction as Sharia-compliant. A qualified Sharia adviser/board and authorized compliance personnel must review the applicable business model, product, contract, financing, and evidence. Regulatory requirements vary by jurisdiction and product.

## 2. Target architecture

```text
Sales / Supplier / Buyer / Logistics / Bank or Islamic Finance Provider
                              |
                 Authenticated API / Portal
                              |
       API Gateway + Identity, RBAC, tenant and rate controls
                              |
  ---------------------------------------------------------------
  | Product & HS Classification | Buyer/Supplier Due Diligence   |
  | RFQ / Quote / Contract      | Export Controls & Documents     |
  | Inventory / Shipment        | Invoice / Receivable / Payment |
  | Sharia Review & Evidence    | Reconciliation / Exceptions    |
  ---------------------------------------------------------------
                              |
           Transactional Service + PostgreSQL
                              |
     Transactional outbox -> Queue/Redis -> n8n orchestration
                              |                  |
                   Immutable audit trail   External adapters
                              |          Customs/logistics/banks/
                     Monitoring/alerts     certification providers
                              |
            GitHub Actions: tests, scans, migration gates
```

- PostgreSQL is the authoritative source for business transactions. Redis is a queue/cache, never the financial system of record.
- n8n coordinates approved workflows; it must not be the sole enforcement point for authorization, financial invariants, or Sharia policy.
- External callbacks are authenticated, signature-checked where supported, deduplicated, and reconciled against provider records.
- AI may classify, summarize, or suggest exceptions. It cannot grant certification, approve contracts, clear sanctions, release goods, or authorize payment.

## 3. Required business domains

1. **Product master and screening:** SKU, composition/materials, intended use, origin, HS code with classification rationale, destination restrictions, shelf life, certificates, and evidence expiry. Unknown or ambiguous products enter manual review; no unsupported “halal” label is generated.
2. **Counterparty due diligence:** legal identity, beneficial ownership where required, sanctions/restricted-party checks, country risk, payment account ownership, credit limits, and review timestamps. A screening hit blocks the affected transaction until an authorized reviewer resolves it.
3. **Quotation and contract:** currency, quantity, quality/specification, delivery point, Incoterms version/rule, title/risk transfer, inspection/acceptance, claims, cancellation, governing law, dispute resolution, and payment schedule must be explicit and consistent.
4. **Export documentation:** commercial invoice, packing list, certificate of origin, customs declaration, transport document, permits, insurance/takaful evidence where used, and product-specific certificates. Store version, issuer, issue/expiry dates, source, and reviewer.
5. **Inventory and fulfilment:** reserve stock atomically; prevent over-selling; track lot/batch and traceability where relevant; record packing, handover, shipment milestones, claims, returns, and loss/damage events.
6. **Receivables and settlement:** model invoice, due date, payment attempts, partial/over/under-payment, fees, FX conversion, bank references, chargebacks, and reconciliation differences explicitly. Never infer settlement solely from a client redirect or an unverified webhook.
7. **Sharia review and evidence:** record the policy version, transaction/product scope, evidence references, reviewer identity/role, decision, rationale, conditions, timestamp, and expiry/review date. Preserve rejected and superseded decisions.
8. **Complaints, returns, and corrective actions:** link credit notes, refunds, replacement shipments, and write-offs to the original order/invoice and require appropriate approval.

## 4. Sharia governance gates

- Maintain an approved policy register reviewed by a qualified Sharia adviser/board. Record version, scope, effective date, approving authority, rationale, and review schedule.
- Screen product and business activity for prohibited or restricted goods/uses according to the approved policy. Sector-level assumptions are insufficient; evaluate the actual SKU, composition, end use, destination, and supporting evidence.
- Review contract terms for excessive uncertainty (gharar), gambling/speculation (maysir), prohibited interest (riba), unfairness, and non-permitted subject matter as applicable to the chosen transaction structure.
- Do not label conventional interest-bearing finance as Sharia-compliant. Financing and trade-finance products must be reviewed individually; structures such as murabaha, wakala, or istisna are not automatically compliant merely because they are named.
- For each transaction, determine whether the seller has the required ownership/possession and authority to sell under the approved contract structure. Define responsibility for damage, delivery, and title/risk transfer.
- Keep fees, profit, agency compensation, penalties, rebates, and FX arrangements transparent and contractually defined. Any late-payment clause or charity treatment requires specific adviser approval and must not create prohibited income.
- Separate commercial approval, Sharia review, payment release, and reconciliation duties. High-risk exceptions require two-person approval by distinct authorized people.
- Reassess when product composition, buyer/end-use, destination, contract, financing, or policy changes. A prior approval must not silently carry over to a materially different transaction.

## 5. State machine and fail-closed rules

Recommended order lifecycle:

`DRAFT -> SCREENING_PENDING -> REVIEW_REQUIRED | APPROVED -> CONTRACTED -> FULFILMENT_READY -> SHIPPED -> INVOICED -> PARTIALLY_PAID | SETTLED -> RECONCILED -> CLOSED`

Any stage may transition to `ON_HOLD`, `REJECTED`, or `EXCEPTION` according to a documented transition matrix. Only explicit, authorized transitions are allowed.

- Do not accept shipment release while mandatory permits/certificates are missing, expired, or under review.
- Do not release payment while sanctions, fraud, account-ownership, contract, or approval checks are unresolved.
- Do not permit a user to approve their own high-impact action.
- Never delete posted financial records. Use linked reversing/correcting entries with reason, actor, approver, and source reference.
- Use idempotency keys and unique provider event IDs; retries must not duplicate orders, invoices, receipts, or journal entries.
- Route timeouts and uncertain outcomes to reconciliation; do not blindly retry non-idempotent external actions.

## 6. Data and financial controls

Minimum logical entities (adapt to existing schema after database review):

- `organizations`, `users`, `roles`, `role_bindings`
- `products`, `product_evidence`, `hs_classifications`, `certificates`
- `counterparties`, `screening_checks`, `screening_cases`
- `quotes`, `orders`, `order_lines`, `contracts`, `contract_versions`
- `shipments`, `shipment_events`, `export_documents`
- `invoices`, `receipts`, `payment_attempts`, `settlements`, `reconciliation_runs`, `reconciliation_exceptions`
- `sharia_policies`, `sharia_reviews`, `approvals`, `audit_logs`, `outbox_events`, `idempotency_keys`

Controls:
- Enforce tenant/org boundaries at service and database layers; test cross-tenant access denial.
- Store monetary values as fixed-precision decimal or integer minor units with explicit ISO currency. Never use binary floating-point for money.
- Keep journal/source records authoritative; derived balances and reports must be rebuildable and reconciled.
- Use migrations reviewed in CI, least-privilege database roles, backups, restore drills, retention rules, and controlled data exports.
- Append-only audit events should record actor, action, object, before/after references where appropriate, reason, timestamp, correlation ID, and approval. Do not put credentials or unnecessary sensitive personal data in logs.

## 7. Security and integration controls

- Separate dev/staging/prod credentials, encryption keys, webhook secrets, and infrastructure. No production credentials in local development or CI.
- Apply MFA/SSO where available, least privilege, short-lived credentials where supported, secret rotation, dependency/SAST/secret scanning, and protected deployment environments.
- Verify webhook signatures, timestamps, replay windows, payload schemas, and provider event IDs. Use an inbox/deduplication table and transactional outbox.
- Restrict outbound network destinations for workers and integrations; use timeouts, bounded retries with backoff, circuit breakers, and dead-letter handling.
- Encrypt sensitive data in transit and at rest; define data minimization, retention, access logging, incident response, and breach escalation.
- Treat documents, email, RFQs, API payloads, and AI output as untrusted input. Prevent prompt injection from changing policy or approval state.

## 8. CI/CD and test acceptance gates

Before a capability is considered ready, CI must include as applicable:

- Unit and integration tests against a supported PostgreSQL version, schema/migration checks, and rollback/restore exercises.
- API contract, authentication/authorization, tenant-isolation, input validation, and negative-path tests.
- Property/concurrency tests for inventory reservation, idempotency, duplicate webhooks, invoice/payment allocation, and reconciliation.
- Workflow tests for retries, timeouts, dead letters, partial failures, provider outage, and manual recovery.
- Security/dependency/secret scans, static analysis, audit-log integrity checks, and permission tests.
- Sharia policy tests using approved synthetic fixtures: prohibited/unknown SKU blocks, expired evidence blocks, policy-version change triggers review, self-approval is denied, and unreviewed finance terms cannot be marked approved.
- Export operations tests for missing/expired documents, destination restrictions, HS-code uncertainty, shipment release gate, and contract/invoice mismatch.
- Staging smoke tests with mock providers before any production enablement.

CI green is evidence of tested code paths, not proof of legal compliance, Sharia certification, market access, or production readiness.

## 9. Operational dashboards and exception queues

Track at least: orders held by reason, certificate expiry, screening cases awaiting review, shipments missing documents, contract-to-invoice mismatches, overdue receivables, provider callback failures, unreconciled settlements, duplicate events, dead-letter backlog, approval latency, and audit gaps.

Each exception must have an owner, severity, created/updated timestamps, linked business record, next action, SLA, resolution reason, and auditable closure. Alerts must not include secrets or unnecessary personal data.

## 10. Phased implementation plan

**P0 — Governance and discovery**
- Inventory current code, schemas, workflows, integrations, and active environments.
- Name accountable owners for trade compliance, finance, information security, and Sharia review.
- Approve product-screening policy, transaction structures, and a country/product legal checklist.
- Create threat model, data classification, state-transition matrix, and architecture decision record.

**P1 — Safe transactional foundation**
- Implement identity/RBAC/tenant isolation, product and counterparty master, evidence registry, order/contract state machine, audit trail, idempotency, and approval service.
- Add mock customs/logistics/payment adapters and integration tests.
- Keep production integrations disabled.

**P2 — Export execution**
- Add inventory reservation, shipment and document checklist, invoice/receivable lifecycle, receipt allocation, reconciliation, and exception queues.
- Validate country/product-specific document requirements with qualified trade-compliance owners.

**P3 — Sharia and production governance**
- Add versioned policy decisions and reviewer evidence, dual control, monitoring, backup/restore drills, incident runbooks, and production deployment gates.
- Perform independent security review, operational acceptance, and Sharia/legal review before enabling live transactions.

## 11. Definition of done

A module is not “complete” until its owner, data model, API contract, authorization matrix, state machine, migrations, tests, observability, runbook, recovery procedure, and evidence requirements are documented and verified. Production activation requires separate written approvals from technical operations, trade/legal compliance, finance, and the designated Sharia authority where relevant.
