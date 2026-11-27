# Business Operations — Role & Permission Matrix 001

**Status:** PROPOSED — requires Product Owner and independent Security review  
**Date:** 2026-11-27  
**Scope:** Internal `apps/business-operations` only  
**Related:** `API-INTEGRATION-CONTRACT-001.md`

## 1. Policy baseline

- Default deny. A user receives no access unless an explicit, approved grant exists.
- Backend authorization is authoritative. Hiding a menu or button is not authorization.
- Permissions are tenant-scoped and, where applicable, resource/site-scoped.
- Role membership alone is insufficient for sensitive operations; evaluate resource ownership, workflow state, segregation of duties, and assurance level.
- A user may hold multiple roles only where an approved policy permits it. Conflicting privileges must be detected and denied or escalated.
- No role in this proposal can bypass server-side authorization, tenant isolation, audit, or approval controls.
- This matrix is a design proposal, not an approved production access-control policy.

## 2. Permission vocabulary

| Domain | Read permission | Proposed write/review permissions |
|---|---|---|
| Executive dashboard | `dashboard.read` | None |
| Master data | `master_data.read` | `master_data.manage` |
| Supplier | `supplier.read` | `supplier.manage` |
| Procurement | `procurement.read` | `procurement.create`, `procurement.update` |
| Sales | `sales.read` | `sales.manage` |
| Inventory | `inventory.read` | `inventory.adjust` |
| Warehouse & QC | `warehouse.read` | `qc.record` |
| Export operations | `export.read` | `export.manage` |
| Finance | `finance.read` | `finance.manage` |
| Compliance | `compliance.read` | `compliance.review` |
| Sharia governance | `sharia.read` | `sharia.review` |
| Automation | `automation.read` | `automation.request` |
| System administration | `system_admin.read` | `system_admin.manage` |
| Audit | `audit.read` | No ordinary update/delete permission |

Additional permissions such as `approval.decide`, `payment.initiate`, `payment.release`, `shipment.release`, `contract.execute`, and `tenant.manage` are intentionally excluded. They require separate domain design, explicit business authority, threat modelling, and approval.

## 3. Proposed role-to-permission matrix

Legend: **R** = read; **W** = proposed operational write; **V** = review/oversight only; **—** = no grant. Every grant remains subject to tenant/resource scope and backend policy.

| Domain | CEO | Operations Manager | Procurement | Warehouse | Finance | Compliance Officer | Sharia Reviewer | System Admin | Internal Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | R | R | — | — | — | — | — | — | R |
| Master data | R | R | R | R | R | R | R | W* | R |
| Supplier | R | R | W | R | R | R | R | — | R |
| Procurement | R | W | W | R | R | R | R | — | R |
| Sales | R | R | — | — | R | R | R | — | R |
| Inventory | R | W | R | W | R | R | R | — | R |
| Warehouse & QC | R | W | R | W | R | R | R | — | R |
| Export operations | R | W | R | R | R | R | R | — | R |
| Finance | R | R-limited | — | — | W | R | R | — | R |
| Compliance | R | R | R-limited | R-limited | R-limited | V/W* | V | — | R |
| Sharia governance | R | R | R | R | R | R | V | — | R |
| Automation | R | W-limited | W-limited | — | — | R | R | W* | R |
| System administration | — | — | — | — | — | — | — | W* | — |
| Audit records | — | — | — | — | — | R-limited | R-limited | — | R |

* System Admin write access is limited to technical configuration, identity lifecycle operations explicitly delegated to them, and system settings. It does not grant business-data approval, financial authority, compliance clearance, Sharia decisions, or permission to alter audit evidence. Master-data administration and automation configuration require scoped, separately audited grants.

**R-limited** means read access only to the minimum records required for the role's approved operational purpose.  
**V** means review and recommendation, not approval of unrelated business or financial actions.  
**V/W** for Compliance Officer means review plus narrowly scoped compliance case annotation/recording; clearance authority must be separately defined and approved.

## 4. Mandatory separation-of-duties constraints

1. A requester must not approve their own request where the workflow requires independent approval.
2. A preparer must not be the sole reviewer/releaser of the same high-impact financial or operational transaction.
3. System Admin must not grant themselves business permissions or modify evidence/audit history.
4. Sharia Reviewer may review contract structures and evidence within an assigned review scope; this role does not execute payments, release goods, or override legal/compliance controls.
5. Compliance Officer review does not constitute Sharia approval, legal advice, payment authorization, or shipment release.
6. CEO read visibility does not confer transaction approval or execution authority.
7. Internal Auditor is read-only and cannot mutate business state.
8. Multiple-role combinations must be checked for privilege conflicts and incompatible duties at assignment and at request time.

## 5. Resource and tenant scope

Every permission decision must evaluate:
- authenticated principal and active account status;
- trusted tenant membership and tenant status;
- permission grant and policy version;
- target resource tenant and ownership/site scope;
- workflow state and permitted transition;
- separation-of-duties constraints;
- required MFA/session assurance for sensitive operations;
- record classification and field-level restrictions.

Client-provided tenant IDs, role names, site IDs, approval flags, or ownership claims are untrusted input. Cross-tenant access is denied even when a user guesses a valid resource identifier.

## 6. UI presentation mapping

The UI may use this matrix to render navigation and affordances only after an approved server session supplies effective permissions. It must:
- show an explicit access-denied/insufficient-permission state for deep links;
- never infer permissions from a locally selected role or hardcoded demo persona;
- clear cached tenant data when session or tenant context changes;
- distinguish read, edit, review, approve, and execute actions;
- keep unimplemented capabilities disabled and visibly marked as demo/not connected.

## 7. Approval gates

Before this matrix is implemented:
1. Product Owner validates each role's actual job responsibilities and scope.
2. Security reviewer validates least privilege, privilege escalation paths, role conflicts, and negative tests.
3. Database reviewer validates tenant/site scoping and enforcement at the data layer.
4. Domain owners define who can approve, release, settle, or execute each business transition.
5. Legal and Sharia reviewers validate roles touching contracts, finance, goods release, and compliance.
6. Approved grants are versioned, auditable, and tested against synthetic tenants.

**Decision:** Keep the current Business Operations UI demo-only. This matrix does not authorize live access or business actions.
