# Fresh-Produce Packing House System Architecture

**Status:** Proposed architecture. This document does not claim that the modules are implemented or production-ready.  
**Repository:** muchlisbstg/business-automation-system  
**Scope:** Digital operations for a fresh-produce export packing house, integrated with export order-to-settlement workflows.

## 1. Goals and boundaries

The system should provide traceable records from supplier delivery through receiving, quality inspection, lot handling, grading, packing, cold storage, dispatch, export documentation, and shipment hand-off.

Initial planning assumption: throughput above 20 tonnes/day, with 30 tonnes/day used as a sizing scenario only. Validate actual commodity mix, peak tonnes/hour, shelf life, temperature bands, washing/treatment needs, export markets, and site constraints before configuring operations.

This document describes software architecture. It does not certify a physical facility, determine legal applicability, or establish that the modules below already exist.

### In scope

- Supplier/farm and commodity master data.
- Receiving appointments, weighing, receipts, and source-lot creation.
- Incoming QC, quarantine, rejection, and disposition.
- Lot traceability through grading, packing, packaging materials, and finished goods.
- Storage locations and temperature observations/alerts.
- Packing work orders, yields, losses, rework, and label generation.
- Final QC, shipment staging, order allocation, and dispatch.
- Export document checklist and shipment evidence hand-off.
- Audit, exception queues, reporting, and integration contracts.

### Out of scope for the first release

- Autonomous AI release decisions.
- Production customs, quarantine, bank, or logistics integration before access and requirements are approved.
- PLC/SCADA facility controls unless separately engineered and security-reviewed.
- Claims of food-safety, regulatory, or Sharia certification.

## 2. Target architecture

    Warehouse / QC / Packing / Export Admin / Management
        | web UI, tablet, barcode/QR scanner, label printer
        v
    Authenticated API + identity, RBAC, site scope, rate limits
        |
        +-- Receiving & Supplier Lots
        +-- QC / Quarantine / Disposition
        +-- Inventory & Locations
        +-- Grading / Packing / Yield
        +-- Cold Storage Observations
        +-- Orders / Shipment Staging / Dispatch
        +-- Export Documents & Evidence
        +-- Audit / Exceptions / Reporting
        |
        v
    PostgreSQL — authoritative transactional records
        |
        +-- Transactional outbox --> queue / n8n orchestration
        |                              +-- notifications
        |                              +-- approved external adapters
        |                              +-- retry / dead-letter handling
        |
        +-- read models / reports / dashboard

    GitHub Actions --> tests, schema/contract checks, security checks

**Authority rule:** API/domain services and database constraints enforce permissions, state transitions, quantity invariants, and release gates. n8n coordinates approved workflows but is not the source of truth. AI may extract or summarize data; it must not independently release quarantined lots, certify compliance, approve regulated documents, or dispatch goods.

## 3. Suggested repository layout

Check for equivalent existing modules before adding paths. Reuse the repository's established runtime, migration tooling, auth middleware, audit helpers, and workflow naming conventions.

    docs/
      export/
        packing-house-system-architecture.md
        packing-house-workflows.md
        packing-house-data-dictionary.md
        packing-house-operational-controls.md
    api/ or apps/
      packing_house/
        receiving/
        quality/
        inventory/
        packing/
        cold_storage/
        dispatch/
        export_documents/
    database/
      migrations/
      schemas/
    workflows/
      packing-house/
        receiving/
        qc-disposition/
        packing-complete/
        cold-storage-alert/
        dispatch-readiness/
    tests/
      unit/
      integration/
      contracts/
      security/
      recovery/

This is a target layout, not a claim that these directories currently exist. Do not duplicate services or schemas already in the repository.

## 4. Domain modules and ownership

| Module | Owns | Important controls |
|---|---|---|
| Master data | Supplier/farm, commodity, grade, packaging, storage zones | Controlled edits; effective-dated configuration |
| Receiving | Appointment, scale readings, receipt, source lot | Idempotency; actual quantities and units recorded |
| QC & disposition | Inspection, measurements, evidence, quarantine, accept/reject/rework | Only authorized QC roles change disposition; reason and evidence required |
| Inventory & traceability | Lot genealogy, stock by location/status, movements | Append-only movement ledger; no negative available stock; actor and source/destination recorded |
| Grading & packing | Work orders, input lots, output lots, yield, waste, labels | Input/output reconciliation; unique labels; rework lineage |
| Cold storage | Zone, target range, observations, excursions, acknowledgement | Timestamped measurements; missing/stale sensor data must not be treated as safe |
| Orders & dispatch | Customer allocation, staging, loading, hand-off | Only eligible stock allocated; dispatch checklist and duplicate prevention |
| Export documents | Requirements, versions, approvals, expiry, shipment linkage | Block release when required evidence is missing/expired |
| Audit & exceptions | Audit events, discrepancy cases, retries, dead letters | Actor, timestamp, reason, correlation ID, state changes, resolution evidence |

## 5. Core logical data model

Use stable IDs, UTC timestamps, explicit units, and database constraints. Store large evidence files in controlled object storage; keep checksum, metadata, and access reference in PostgreSQL.

- Master data: suppliers, farms, commodities, grades, packaging materials.
- Receiving: receipts, receipt lines, source lots, QC inspections/results, lot dispositions.
- Inventory: locations, inventory movements, lot balances (a derived, rebuildable projection).
- Packing: work orders, packing inputs, packed lots, yield records, label records.
- Cold storage: temperature observations, temperature excursions, excursion actions.
- Shipping: customer orders, allocations, staging records, dispatches.
- Documents: export document requirements, document records, approvals.
- Reliability: audit events, outbox events, inbox events, exception cases.

Preserve genealogy across lot splits, merges, grading, rework, and repacking. Do not overwrite a source lot to represent transformed goods; record parent/child relationships and quantity/unit conversions. Derived balances and dashboards must be reconcilable against authoritative movements.

## 6. State transitions and release gates

Use explicit state machines. Reject invalid transitions in the domain service and database where feasible.

- Receipt: scheduled → arrived → inspected → accepted, quarantined, or rejected.
- Lot: quarantined → available, rejected, or rework-required. Only an authorized disposition releases a quarantined lot.
- Packing work order: draft → approved → in-progress → completed or exception.
- Packed lot: pending-final-QC → released, held, or rejected.
- Shipment: draft → allocated → staging → document-check → ready-to-dispatch → dispatched.
- Evidence: missing → uploaded → under-review → approved, rejected, or expired.

Dispatch must be blocked when stock is unreleased, allocations exceed available stock, QC is incomplete, an applicable temperature excursion is unresolved, or required shipment documents are missing/expired. Applicability depends on commodity, destination, buyer contract, and current official rules; an accountable qualified reviewer must confirm the checklist.

## 7. Proposed API boundaries

These are design proposals, not implemented endpoints. Follow existing repository API conventions and versioning.

- POST /v1/receipts; GET /v1/receipts/{id}
- POST /v1/receipts/{id}/inspections
- POST /v1/lots/{id}/dispositions
- GET /v1/lots/{id}/traceability
- POST /v1/inventory/movements; GET /v1/inventory/locations/{id}
- POST /v1/packing-work-orders; POST /v1/packing-work-orders/{id}/complete
- POST /v1/temperature-observations; GET /v1/temperature-excursions
- POST /v1/orders/{id}/allocations
- POST /v1/shipments/{id}/document-checks; POST /v1/shipments/{id}/dispatch

Every write endpoint must authenticate and authorize by role/site, validate units and state, use idempotency where retries could duplicate an action, persist the business record and audit event transactionally, and return a correlation ID. Never trust a client-provided status to bypass a state machine.

## 8. Events and workflow integration

Publish domain events through a transactional outbox so a database commit cannot silently lose its event. Consumers must be idempotent and track processed event IDs. Verify webhook signatures, timestamps, and replay windows where supported. Retry transient errors with bounded backoff; route exhausted events to an owned dead-letter/exception queue. Provide reconciliation for uncertain outcomes.

Suggested events: receipt.accepted, lot.quarantined, lot.released, packing.completed, packed_lot.qc_released, temperature.excursion_detected, temperature.excursion_resolved, shipment.documents_ready, shipment.dispatched.

n8n may send notifications and coordinate approved downstream steps. It must call authenticated service endpoints rather than directly modifying authoritative tables. Workflow failure must not silently change lot, QC, or shipment state.

## 9. Roles and separation of duties

Suggested roles: receiving operator, QC inspector, packing supervisor, inventory controller, export documentation officer, dispatch supervisor, operations manager, compliance reviewer, auditor, and system administrator.

- Separate QC inspection from disposition/release for high-risk or exception cases.
- The requester of a sensitive exception must not be its sole approver.
- Restrict access by site, role, and business purpose; test cross-site isolation if multiple sites/entities are supported.
- Log privileged access, configuration changes, overrides, exports, and evidence access.
- Never commit credentials, access tokens, customer personal data, or production records.

## 10. Test strategy and release gates

### P0 — before the first operational pilot

- Unit tests for state transitions, quantity/unit conversion, allocation, and idempotency.
- PostgreSQL integration tests for transaction boundaries, uniqueness, concurrent stock allocation, and rollback.
- Traceability tests across split, merge, grading, repacking, rejection, and rework.
- Authorization tests for unauthorized release, dispatch, approval, and cross-site access.
- Negative tests for missing/expired documents, unresolved QC, held stock, and unresolved temperature excursions.
- Outbox/inbox duplicate delivery, retry exhaustion, dead-letter, and reconciliation tests.
- Migration upgrade and backup/restore rehearsal.

### P1 — before broader rollout

- Load tests against validated peak tonnes/hour and scanner concurrency.
- Resilience tests for network loss, printer/sensor/provider outage, stale sensor data, and partial workflow failure.
- Operational dashboards, alert routing, retention policy, incident runbooks, and operator training.
- Independent review of applicable food safety, quarantine, export, privacy, security, tax, and Sharia requirements.

CI must report only checks actually run. Passing tests do not establish legal compliance, certification, or production readiness.

## 11. Implementation sequence

1. Discovery: validate commodity mix, target markets, supplier process, peak throughput, units/scales, QC plan, temperature bands, label rules, roles, and existing repository modules.
2. Foundation: migrations, auth/RBAC, audit, idempotency, correlation IDs, API errors, and test fixtures.
3. Receiving + QC: receipts, lot creation, inspections, quarantine/disposition, and evidence upload.
4. Inventory + traceability: movement ledger, locations, genealogy, and balance reconciliation.
5. Packing + labels: work orders, inputs/outputs, yields, labels, final QC, and rework genealogy.
6. Cold storage + dispatch: observations/excursions, allocation, staging, document gates, and dispatch evidence.
7. Automation + reporting: outbox events, n8n notifications, exception queues, and dashboards.
8. Pilot: synthetic data first, followed by controlled acceptance testing. Production integrations remain disabled until reviewed and explicitly approved.

## 12. Decisions required before implementation

- First-release commodities and export destinations.
- Whether washing, treatment, irradiation, or commodity-specific quarantine is required.
- Peak throughput in tonnes/hour and number of shifts.
- Grading standards, measurements, and buyer tolerances.
- Approved temperature ranges and excursion-response procedures.
- Number of sites/legal entities and tenant boundaries.
- Existing runtime, database schema, auth layer, and workflow contracts to extend.
- Official export, food-safety, quarantine, buyer, and Sharia requirements reviewed by accountable specialists.

Until these are answered, keep commodity-specific rules configurable and mark uncertain requirements for review rather than hard-coding assumptions.
