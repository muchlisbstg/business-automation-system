# Indonesia Export Regulatory Control Matrix

**Status:** implementation checklist; obtain qualified legal, customs, tax, banking, and Sharia review before production use. This document is not legal advice or a compliance certification.
**Last reviewed:** 2026-10-24. Regulations and product/country requirements change; revalidate before each release and periodically thereafter.

## 1. Regulatory control domains

| Domain | System control | Evidence and accountable owner |
|---|---|---|
| Business licensing | Maintain NIB, relevant business licenses, KBLI, and risk-based OSS requirements for the actual activity. Block activation when mandatory license evidence is absent or expired. | License record, issuing authority, validity, verification timestamp; Legal/Compliance |
| Customs export | Maintain export declaration/PPE, commercial invoice, packing list, transport evidence, origin documents, and permits as applicable. Validate export prohibition/restriction and export-duty requirements by HS code, product, destination, and current rule set. | Customs broker/export operations sign-off and linked documents; Trade Compliance |
| HS classification | Store HS code, classification basis, reviewer, effective date, and rule source. Unknown/contested classifications require manual review; do not infer legal treatment from AI alone. | Classification decision and source snapshot; Trade Compliance |
| Restricted goods and destinations | Screen goods, end-use, destination, buyer, beneficial owner where legally required, vessel/carrier and other relevant parties against applicable Indonesian and destination rules. Handle possible matches through a case queue. | Screening result, list/version, reviewer decision, timestamp; Compliance |
| Tax and accounting | Model export VAT/tax documentation and accounting treatment using current tax rules; preserve invoice and supporting evidence. Avoid hardcoding tax rates or assuming all exports have identical treatment. | Tax calculation version, invoice, filing references; Tax/Finance |
| DHE/DPI and foreign exchange | Determine whether each export is within DHE SDA or other applicable reporting/placement rules based on commodity/sector, export declaration, value threshold, timing and currently effective rules. Track expected receipt, actual receipt, currency, bank/account, placement/use, evidence and deadlines. | PPE, bank statements/confirmations, DHE/DPI reports and exception trail; Treasury/Finance |
| Halal assurance | Determine whether product/category and destination rules require halal certification or other conformity evidence. Track certificate scope, issuer, validity, product/site coverage, recognition and label claims. A halal certificate is not inferred from ingredients or a supplier statement alone. | Verified certificate and applicable BPJPH/foreign-market evidence; Halal Assurance/Compliance |
| Personal data and cybersecurity | Minimize personal data; define lawful purpose, retention, access, breach response, processor/vendor controls and cross-border transfer review under applicable Indonesian law. | Data inventory, access logs, retention schedule, incident register; DPO/Privacy/Security |
| Electronic records and signatures | Preserve contract/document versions, signer identity, timestamps, evidence of consent/authority and tamper-evident audit history in line with applicable electronic information and transaction rules. | Signed document, verification metadata, audit event; Legal/IT |
| Trade finance and Sharia | Review each financing, insurance/takaful, FX, guarantee, agency and late-payment term under the approved Sharia governance process. Do not classify a product as compliant solely by its marketing name. | Approved contract/policy version, Sharia reviewer and rationale; Sharia adviser/board |

## 2. DHE control must be configurable

Do not hardcode a universal DHE percentage, value threshold, placement period, eligible bank, or permitted use into application logic. Rules differ by sector and change over time.

As of this review date, Bank Indonesia lists PBI No. 5 of 2026 amending PBI No. 7 of 2023 on DHE/DPI, effective 1 June 2026. Its summary describes changes concerning placement of DHE SDA through state-owned banks, additional foreign-currency government securities/SBSN instruments, and permitted Rupiah conversion/use. The actual rule applicability and transitional provisions must be checked against the full regulation, PP DHE SDA as amended, and the exporter's facts.

Required implementation:
- Version rule sets by effective-from/effective-to date, sector/commodity, PPE date, value/currency threshold, and transaction type.
- Record the rule version and decision basis on each export transaction.
- Calculate due dates from authoritative event dates with timezone-safe logic and calendar tests.
- Alert Treasury before deadlines; escalate missing/late receipt or placement evidence.
- Reconcile invoice receivable, bank receipt, FX conversion, placement/use and required reporting; differences create owned exceptions.
- Never automatically initiate an investment, FX trade, or transfer based only on a rule engine or AI output.

## 3. Halal assurance and export-market rules

The product must not be labelled or represented as halal unless the required evidence and approval are valid for that product and claim. Applicability depends on product category, domestic rules, destination market, recognition arrangements, and effective dates. For products containing non-halal elements, applicable disclosure and trade restrictions must be reviewed rather than silently treating them as halal.

For each SKU maintain:
- category, ingredients/materials, manufacturing site/process and traceability scope where relevant;
- certification requirement decision, jurisdiction and legal/policy source;
- certificate identifier, issuer, scope, expiry, verification result and last checked time;
- label/artwork version and approved claim;
- manual hold and escalation path for expired, mismatched or unverified evidence.

The BPJPH Regulation No. 4 of 2026 concerns conformity assurance for foreign halal products entering Indonesia; do not treat it as a blanket export rule. Verify the relevant export destination's rules separately.

## 4. Release gates

A shipment or payment must remain on hold when any applicable mandatory license, permit, classification, restricted-party case, product certificate, contract approval, DHE assessment, or payment-account verification is unresolved. Provide a documented override only where legally permitted, with independent approval, reason, scope, expiry, and immutable audit evidence. Never provide an override for a legally prohibited action.

## 5. CI acceptance tests

- Missing/expired NIB, license, permit or required certificate blocks the applicable operation.
- HS classification ambiguity and restricted-party possible matches create review cases; AI cannot auto-clear them.
- DHE applicability uses the correct effective-dated rule version and records its decision basis.
- Due-date, currency, threshold boundary, sector classification, and regulatory transition tests cover boundary cases.
- Duplicate bank callbacks do not duplicate receipts; unmatched receipts and short/overpayments create reconciliation exceptions.
- Shipment release is denied if a required document or approval is absent.
- Halal claims fail closed when evidence is missing, expired, outside product/site scope, or not verified.
- Tenant-isolation, role authorization, dual approval, audit integrity, secret scanning and recovery tests pass.
- Tests use synthetic data and mock providers; no live bank, customs or logistics action occurs in CI.

## 6. Official source register and implementation rules

Revalidate these sources before each relevant release and whenever an authority publishes an amendment or implementing rule:

- **Customs export procedure:** Directorate General of Customs and Excise, https://www.beacukai.go.id/tata-laksana-ekspor. The workflow must track the applicable export customs declaration (PEB), supporting documents, document review/physical inspection when directed, loading and departure evidence, and any cancellation/reporting process applicable to the case. Do not treat an uploaded invoice or packing list alone as customs clearance.
- **Export policy and HS-specific restrictions:** Permendag No. 5 of 2026, amending Permendag No. 23 of 2023 on export policy and regulation; effective 1 April 2026. Official metadata and status: https://peraturan.bpk.go.id/Details/347106/permendag-no-5-tahun-2026. Kemendag announcement: https://www.kemendag.go.id/berita/siaran-pers/kemendag-terbitkan-permendag-5-dan-6-tahun-2026-pangkas-hambatan-dan-perizinan-ekspor. Apply the regulation together with relevant amendments, annexes and HS/commodity-specific requirements; do not infer a permit requirement from the regulation title alone.
- **Prohibited exports:** also verify Permendag No. 6 of 2026, which amends Permendag No. 22 of 2023 on goods prohibited for export, effective 1 April 2026, against the actual commodity and current official lists.
- **DHE/DPI:** Bank Indonesia, PBI No. 5 of 2026 amending PBI No. 7 of 2023, effective 1 June 2026: https://www.bi.go.id/id/publikasi/peraturan/pages/pbi_052026.aspx. Read with the applicable PP DHE SDA and implementing PADG, including current amendments and transitional provisions. The rule engine must first determine whether the export is within DHE SDA or another applicable reporting/receipt regime; do not apply SDA-specific placement, bank, percentage or use rules indiscriminately to every export.
- **Previous DHE/DPI regulation for change history:** Bank Indonesia, PBI No. 3 of 2025: https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_032025.aspx.
- **Halal assurance (scope-specific):** BPJPH JDIH, Regulation No. 4 of 2026 on foreign halal product conformity entering Indonesia: https://jdih.halal.go.id/jdih/dokumen/3458fb8c-5f45-42a5-9fdf-72c0e65a3ba3. This is not a blanket export-market rule; verify the destination's requirements separately.

### Required configuration and evidence model

For every rule store: jurisdiction/authority, regulation identifier and article/annex where applicable, official source URL, commodity/HS scope, destination or sector scope, effective-from/effective-to dates, version/hash of the source snapshot, reviewer, verification timestamp and approval status. A transaction must retain the exact rule version and evidence used for its decision.

**Fail-closed release gate:** if HS classification is missing or disputed, the applicable rule set is stale/unverified, a mandatory permit/document is missing, a prohibition match is unresolved, or DHE applicability cannot be established, hold the shipment/payment workflow and create a compliance case for an authorized reviewer. AI may extract candidate data but must not determine final legal classification or clear a hold.

This source register is a starting point, not an exhaustive list. Legal/compliance owners must confirm current amendments, implementing rules, destination-country law, sector-specific restrictions and applicability to the actual goods and contracts.
