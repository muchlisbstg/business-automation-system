# Business Operations — Data Classification & Handling 001

**Status:** PROPOSED — requires Product Owner, Security, Database, Legal and Sharia review  
**Scope:** Internal Business Operations UI and future BFF/domain integrations  
**Implementation:** Specification only; no data migration or live integration

## 1. Objective

Define minimum handling controls before the internal ERP UI is connected to business systems. Classification must be assigned by the authoritative domain owner; UI labels are not a security boundary.

## 2. Classification levels

| Level | Examples | Minimum handling |
|---|---|---|
| Public | Approved product descriptions, published company profile | May be displayed publicly after owner approval |
| Internal | Operational status, non-sensitive work queues, internal reference IDs | Authenticated workforce access; least privilege |
| Confidential | Supplier quotations, customer commercial terms, purchase/sales orders, inventory valuation, export documents | Explicit role + tenant/site scope; encryption in transit/at rest; access logging; controlled export |
| Restricted | Credentials, session tokens, payment credentials, bank details, identity documents, legally protected personal data, security secrets | Do not expose in general UI/logs; dedicated service boundary, strict authorization, masking, limited retention, audited access |

Classification is contextual. A field may be elevated by contract, jurisdiction, data-subject rights, or business risk.

## 3. Handling requirements

- No secrets, access tokens, passwords, private keys, or full payment credentials in browser bundles, local storage, analytics, or application logs.
- Server-side services are authoritative for authentication, tenant isolation, authorization, and data filtering.
- Tenant and site context must be derived from validated server-side identity/session claims, never trusted from arbitrary browser input.
- Confidential exports require authorization, purpose limitation, audit event, and appropriate watermark/expiry controls where applicable.
- Restricted values must be masked by default and revealed only through a separately authorized action.
- Demo/mock data must be synthetic and visibly labeled; never copy production records into demo fixtures.
- Error responses must not disclose stack traces, secrets, cross-tenant existence, or internal infrastructure details.
- Retention and deletion rules must be set by Legal/Compliance and domain owners before production integration.

## 4. Data-flow control points

1. Browser receives only fields needed for the current authorized view.
2. Business Operations BFF validates session, tenant/site context, permission, request schema, and purpose.
3. Domain adapter calls the authoritative service using service credentials unavailable to the browser.
4. Response is filtered and classified before returning to the UI.
5. Audit events record access to sensitive objects and high-risk actions without copying restricted payloads into logs.

## 5. Review checklist

- [ ] Product Owner approves data ownership and purpose.
- [ ] Security approves classification, access control, encryption, secrets handling and logging.
- [ ] Database reviewer confirms tenant/site keys, RLS strategy and data minimization.
- [ ] Legal/Compliance confirms jurisdictional privacy, export-control, retention and disclosure requirements.
- [ ] Sharia reviewer evaluates any contract, payment, financing, or transaction data use where relevant.
- [ ] Domain owners approve field-level classification and masking rules.

## 6. Explicit exclusions

This document does not establish legal compliance, certify a privacy program, authorize production data use, or implement controls. No database schema, RLS policy, API, or application behavior is changed by this specification.

**Decision:** Treat all future connected business records as at least Internal until their owner assigns a higher or lower classification. Confidential and Restricted data remain out of the UI until approved server-side controls and independent reviews exist.
