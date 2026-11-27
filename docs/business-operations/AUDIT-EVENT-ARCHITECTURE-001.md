# Business Operations — Audit Event Architecture 001

**Status:** PROPOSED — architecture specification only  
**Scope:** Future Business Operations BFF and domain service integrations  
**Implementation status:** Not implemented or independently reviewed

## 1. Objective

Specify an attributable, tamper-evident audit trail for sensitive reads and consequential business actions. Audit records provide evidence; they do not grant authorization or replace domain ledgers.

## 2. System-of-record boundaries

| Record | Authoritative purpose |
|---|---|
| Domain transaction / contract record | Commercial and contractual state |
| Payment ledger | Settlement and financial posting truth |
| Evidence register | Evidence of obligations and their fulfillment |
| Audit event stream | Who/what/when/where evidence of access and attempted or completed actions |
| Server-side authorization decision | Sole authority for permitting protected operations |

Audit events must reference authoritative object IDs; they must not become a parallel business ledger.

## 3. Event envelope

Required logical fields:
- event_id: globally unique immutable identifier.
- occurred_at: server-generated UTC timestamp.
- actor_id: authenticated principal; use service identity for service-to-service actions.
- actor_type: human, service, or system.
- tenant_id and applicable site_id: resolved and validated server-side.
- action: stable machine-readable action name.
- object_type and object_id: target resource reference.
- result: allowed, denied, succeeded, failed, or pending.
- reason_code: normalized policy or failure reason; avoid free-form sensitive payload.
- correlation_id and request_id: trace across BFF and domain adapters.
- source: application/service identifier and version.
- before_hash / after_hash: optional integrity references for approved state transitions; avoid storing full sensitive snapshots.
- evidence_refs: references to related evidence, when applicable.

## 4. Event classes

- Authentication and session lifecycle.
- Authorization allow/deny for sensitive resources.
- Tenant/site context resolution failures.
- Confidential/Restricted record access and export.
- Master-data changes.
- Supplier/customer commercial data changes.
- Approval request, decision, cancellation, and delegation.
- Contract lifecycle and document access.
- Inventory adjustment, QC disposition, and shipment state transitions.
- Financial preparation, posting, reversal, and reconciliation.
- Compliance and Sharia review decisions.
- Privileged administration and policy/configuration changes.

High-risk actions require correlation with the relevant domain record and evidence references.

## 5. Integrity, access and operations

- Append-only semantics; application identities must not update/delete prior events.
- Restrict audit read access to authorized Security, Compliance and Internal Audit roles.
- Separate audit writer identity from audit reader and application administrator identities.
- Use database/platform controls to prevent silent mutation; independently validate immutability and retention.
- Encrypt in transit and at rest; protect keys and credentials outside application code.
- Monitor gaps, ingestion failures, clock skew, unusual denied-access spikes, and privileged changes.
- Define retention, legal hold, archival, and deletion exceptions with Legal/Compliance.
- Never log passwords, tokens, full bank/payment credentials, private keys, or full Restricted payloads.
- Log denied attempts without leaking resource existence to the caller.

## 6. Failure policy

- For protected state-changing operations, inability to durably record the required audit event must fail closed or use a formally approved transactional outbox pattern.
- Do not claim an operation succeeded until the authoritative domain service confirms it.
- Use idempotency keys and correlation IDs to reconcile retries and duplicate delivery.
- Audit pipeline availability must not silently weaken authorization or tenant isolation.

## 7. Negative tests required before integration

- Cross-tenant event injection and read attempts are denied.
- Browser cannot forge actor, tenant, site, timestamp, result, or event ID.
- Application roles cannot update/delete prior audit records.
- Audit reader cannot perform business mutations.
- Failed/denied operations are recorded without exposing secrets.
- Retry and duplicate delivery preserve idempotent event semantics.
- Missing audit persistence blocks protected state changes unless approved outbox guarantees apply.
- Correlation links resolve to the correct domain object and evidence references.
- Retention and legal hold behavior is tested under authorized reviewer supervision.

## 8. Review gates

- [ ] Security reviewer approves threat model, immutability, access, alerting and failure policy.
- [ ] Database reviewer approves schema, constraints, partitioning, retention and RLS.
- [ ] Product/domain owners approve event taxonomy and authoritative object references.
- [ ] Legal/Compliance approves retention, access, disclosure and legal-hold requirements.
- [ ] Sharia reviewer approves evidence requirements for relevant akad, payment and transaction workflows.

## 9. Explicit exclusions

No audit database/table, trigger, RLS policy, API endpoint, event bus, or application logging implementation is created by this document. This specification is not evidence that audit controls currently exist or are operational.

**Decision:** Do not integrate consequential business actions until an independently reviewed audit implementation and negative-test evidence exist.
