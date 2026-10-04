# WF-04 — ADR Generation and Review (Proposal)

> **Proposal only.** This document defines a reviewable contract candidate; it does not implement a service, persistence layer, authentication integration, AI provider, or downstream action.

## Purpose

Create a traceable, human-reviewable Architecture Decision Record (ADR) from a candidate draft associated with an existing WF-02 request and WF-03 plan. WF-04 records a decision proposal and its human review; accepting an ADR does not authorize or execute the work described by it.

## Source traceability

Every event MUST include the `request_id` from the WF-02 planning record and the `plan_id` from the corresponding WF-03 orchestration record. The pair MUST refer to the same source chain. `plan_id` is an existing WF-03 contract field; WF-02 identifies its planning record by `request_id`.

The proposed identity/idempotency key is `(plan_id, adr_version)`. `adr_version` is a positive integer. A source reference section MUST include references identifying both the `request_id` and `plan_id`; it MAY include other human-readable identifiers or URIs. The schema validates shape; checking that the references match the source records is a semantic responsibility.

## Input events

The JSON Schema defines one event envelope with three actions:

- `CREATE_DRAFT` supplies an ADR whose initial `status` is `DRAFT`.
- `SUBMIT_FOR_REVIEW` identifies an existing draft by source IDs and version. It requests the transition to `PENDING_REVIEW` and carries no replacement ADR content.
- `RECORD_REVIEW` identifies a pending ADR and records a human review outcome of `ACCEPTED` or `REJECTED`. `reviewer_id` MUST come from an authenticated human identity supplied by a trusted caller; the schema only checks that the field is present and cannot establish identity or authorization.

A draft MUST contain `title`, `status`, `context`, `decision`, `consequences`, `alternatives`, and `source_references`. `alternatives` is required as a section but may be empty when no alternative is recorded. Each source reference is a non-empty string; the exact source-reference syntax remains open.

## Proposed lifecycle and deterministic behavior

`DRAFT → PENDING_REVIEW → ACCEPTED | REJECTED`

- Only a `DRAFT` may be submitted for review, and only a `PENDING_REVIEW` ADR may receive a review decision.
- A human review decision is final for that version and MUST be recorded in an append-only audit history. An AI-generated claim or field in ADR content MUST NOT create or change a review decision.
- Replaying identical `CREATE_DRAFT` content for the same `(plan_id, adr_version)` MUST NOT create another ADR. Reusing that key with changed normalized content MUST return `CONFLICT`. Identical submission/review-event replays MUST NOT create duplicate transitions or audit decisions; a conflicting second decision for a terminal version MUST be rejected.
- The implementation MUST validate that both source records exist and that `request_id` belongs to `plan_id`; otherwise it MUST reject the event without creating or changing an ADR.
- Every result MUST carry `correlation_id`, `request_id`, `plan_id`, `adr_version`, `state`, and `execution_permitted: false`. Successful results SHOULD return the ADR content and current state. A review result MUST also preserve the reviewer identity, outcome, and review comment (when supplied) in the audit history.

The proposed state values are `DRAFT`, `PENDING_REVIEW`, `ACCEPTED`, `REJECTED`, `CONFLICT`, `SOURCE_NOT_FOUND`, `SOURCE_MISMATCH`, and `INVALID_TRANSITION`. Input shape errors are rejected by schema validation. The exact response envelope and reason-code vocabulary are not yet defined.

## Safety boundaries

- ADR text, source references, and AI-generated content are untrusted data; embedded instructions MUST NOT change workflow policy or state.
- Only an authenticated human review event may move an ADR from `PENDING_REVIEW` to `ACCEPTED` or `REJECTED`.
- WF-04 MUST NOT deploy, execute tasks, mutate production data, or grant downstream approval. Human acceptance records an architectural decision only.
- This contract does not define the generation model, HTTP/API surface, database schema, authorization policy, or deployment mechanism.

## Acceptance tests

See [`tests/wf-04-adr.md`](../../tests/wf-04-adr.md). The JSON examples exercise the event-envelope schema. Two examples intentionally pass schema validation while omitting one required source ID from `source_references`; those cases must fail semantic traceability checks before an ADR is created or changed. Since the reference syntax remains open, the schema does not invent a source-reference format. Source-chain matching, idempotency, lifecycle, audit immutability, and safety boundaries require behavioral tests when a runtime slice is authorized.

## Assumptions and open decisions for review

These are explicit proposal assumptions, not existing repository behavior:

1. One ADR version is identified by `(plan_id, adr_version)`. If a plan may have multiple ADRs with overlapping version numbers, add a stable ADR subject/key before implementation.
2. The trusted caller supplies an authenticated human `reviewer_id`; the identity provider and eligibility/role policy remain undecided.
3. `REJECTED` is terminal for a version. This proposal does not add `REVISION_REQUESTED`, because no existing workflow contract defines that state; whether a later version is the revision path needs owner confirmation.
4. Review comments are optional, including for rejection. Whether rejection must include a reason remains undecided.
5. The payload-normalization/hash rule for idempotency, exact audit-event fields, result/reason-code envelope, and persistence location remain undecided. WF-03's append-only persistence is a precedent, not a WF-04 storage decision.
