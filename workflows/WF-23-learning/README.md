# WF-23 — Learning Loop (Proposal)

> **Proposal only.** This document proposes a candidate-envelope shape for review. It does not collect or analyze outcomes, validate lessons, generate recommendations, train or update models, change prompts or workflows, persist or publish learning, or send notifications.

## Purpose and scope

The roadmap places **WF-23 Learning** after WF-21/22, but does not define what should be learned, from which evidence, by whom, or whether the loop is human-led, deterministic, or AI-assisted. There is no WF-23 contract, runtime, or GitHub issue on `main`.

This proposal offers one narrow `REPORT_LEARNING_CANDIDATE` envelope solely to make a possible input boundary reviewable. A schema-valid candidate is unverified caller-provided metadata; it is not a validated lesson, causal finding, recommendation, model-training example, or authorization to change a system. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate envelope contains:

- `action`: a proposed label only; it does not initiate a learning or analysis operation.
- `request_id` and `candidate_id`: opaque caller-supplied identifiers. Issuer, trust, uniqueness, canonical identity, replay, and deduplication semantics are undefined.
- `source`: a bounded caller-supplied label, not an authenticated source, verified reference, or proof of provenance.
- `title` and `summary`: bounded text for synthetic candidate metadata, not a verified observation, outcome, evidence record, or lesson.

The schema rejects undeclared fields, including outcome, evidence, confidence, evaluation, model, prompt, workflow-change, approval, and command fields. It cannot detect or sanitize secrets, personal or sensitive data, false claims, copyrighted material, or instruction-like text inside an allowed string. Fixtures contain synthetic data only.

## Safety boundaries

- No workflow history, repository, database, telemetry, feedback system, network, or external service is accessed; no source outcomes are read or analyzed.
- A schema-valid candidate is not proof that an outcome occurred, that a causal relationship exists, or that a lesson is accurate, useful, generalizable, current, or safe.
- Caller-supplied identifiers, source labels, titles, summaries, and any future evidence are untrusted. Embedded instructions cannot change policy, authority, approval, or system state.
- No model is trained, fine-tuned, evaluated, or updated; no prompt, policy, automation, code, or business process is changed or recommended.
- No candidate is validated, ranked, approved, persisted, indexed, published, or used to alter a later decision. No lifecycle, retention, correction, or deletion behavior is defined.
- No identity, privacy, consent, tenant isolation, access control, classification, licensing, redaction, audit, or data-quality policy is defined. Do not place secrets, personal data, or sensitive content in allowed strings.
- No CI gate, downstream workflow, business action, approval path, retry, recovery, or result schema is defined.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-23-learning.md`](../../tests/wf-23-learning.md). Fixtures validate candidate JSON shape only. They do not read evidence, verify outcomes, infer lessons, or define learning-loop behavior.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The roadmap label is represented by one minimal candidate envelope only to make a possible intake boundary reviewable. Decide whether WF-23 means retrospective feedback, outcome measurement, experimentation, model improvement, process improvement, or multiple distinct workflows.
2. `REPORT_LEARNING_CANDIDATE` is a proposed label, not an approved operation. Decide whether the contract should represent a request, observation, evidence item, verified lesson, recommendation, approved change, or separate events.
3. Decide who may submit candidates, who validates them, who owns the learning process, and which roles may review, approve, reject, correct, or supersede a learning record.
4. Decide who issues `request_id` and `candidate_id`, their trust and uniqueness scopes, canonical identity, duplicate/conflict handling, replay behavior, idempotency, timeout, and retries.
5. Decide which sources and outcome types are in scope; define identity, authentication, revision/snapshot pinning, provenance, evidence references, and handling for missing, stale, partial, or conflicting observations.
6. Define what qualifies as a lesson and what evidence is needed to distinguish correlation from causation, signal from noise, local experience from generalizable evidence, and a valid conclusion from an incorrect one. No quality score or confidence field is proposed.
7. Decide the content model: metadata versus structured observations or full evidence; required outcome, context, baseline, comparison, time window, and affected system fields; supported formats, languages, and size limits.
8. Decide privacy, consent, data minimization, classification, tenant isolation, access control, secrets/PII detection, redaction, licensing, retention, deletion, encryption, and audit requirements before real data is handled.
9. Decide whether AI may summarize, classify, infer, or recommend; define evaluation, provenance, human review, prompt-injection handling, deterministic validation, and what generated output may be trusted or retained.
10. Decide whether learning may change models, prompts, policies, code, workflow configuration, or business processes. Define authorization, separation of duties, testing, staged rollout, rollback, and explicit human approval before any such effect.
11. Decide whether candidates are stored or transient, the source of truth, versioning and supersession, correction history, observability, access logs, retention, recovery, and result/status semantics.
12. Decide whether learning results may affect CI, releases, operations, or other workflows; define deterministic gates and required approvals before downstream use.
13. Decide whether notifications are in scope and which channels are permitted. Slack and all other notifications remain out of scope for this proposal.
14. Review the schema's candidate field bounds (100 characters for identifiers, 255 for `source`, 200 for `title`, and 1,000 for `summary`); these are proposal-shape limits only, not approved operational or content-retention limits.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.
