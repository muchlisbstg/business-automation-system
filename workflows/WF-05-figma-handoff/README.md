# WF-05 — Figma-to-Development Handoff (Proposal)

> **Proposal only.** This document defines a reviewable contract candidate. It does not implement a Figma connector, fetch design data, create code or GitHub work, persist records, or start an n8n workflow.

## Purpose and scope

Capture a traceable handoff that points selected WF-03 plan tasks at specific nodes in a Figma design and records proposed acceptance criteria for those task/design pairs. The event refers to an existing WF-02 request and WF-03 plan; it carries references, not a copy of the design file.

The proposal is deliberately limited to a `CREATE_HANDOFF` input envelope. It specifies neither an HTTP/API surface nor a runtime response, storage model, authentication integration, or Figma API behavior. The schema checks payload shape only. CI now exercises the deterministic cross-field rule that every task-mapped node must appear in `design_reference.node_ids`; checking the source chain and plan membership requires source records and remains future semantic/runtime work.

## Proposed input contract

The JSON Schema defines one event with these required fields:

- `action`: `CREATE_HANDOFF`.
- `request_id` and `plan_id`: identifiers for the corresponding WF-02 request and WF-03 plan.
- `handoff_id`: caller-supplied identifier for this proposed handoff.
- `design_reference`: an HTTPS Figma file URL, one or more opaque node IDs, and an optional opaque `revision_id`.
- `task_mappings`: one or more selected WF-03 `task_id` values, each mapped to one or more referenced design node IDs and one or more non-empty acceptance criteria.

The schema rejects undeclared fields. It cannot prove that the request and plan exist or belong together, that each task belongs to the plan, or that each mapped node belongs to the design reference. Those relationships are semantic checks, not JSON Schema constraints.

Example payloads are in [`examples/`](examples/); the schema is [`schema.json`](schema.json). The proposed scenarios are in [`tests/wf-05-figma-handoff.md`](../../tests/wf-05-figma-handoff.md). `semantic-invalid-unreferenced-task-node.json` is intentionally schema-valid and is rejected by the CI fixture validator for violating only the declared-node relationship.

## Safety boundaries

- Figma text, design labels, acceptance-criteria text, and other imported or AI-generated content are untrusted data. Embedded instructions MUST NOT change validation policy, identity, permissions, approvals, or workflow state.
- A design link or recorded handoff MUST NOT be treated as approval to implement, merge, deploy, or perform a destructive or production action.
- This proposal does not request or carry Figma credentials, and it does not authorize reading private design files.
- The proposal does not create code, branches, issues, pull requests, or downstream workflow executions. Any such side effect requires a separately reviewed contract and authorization.

## Assumptions and open decisions

The following are **proposal assumptions**, not existing repository behavior:

1. **Existing-task mapping:** a handoff maps already-defined WF-03 task IDs; WF-05 does not create, split, or reprioritize tasks.
2. **Reference-only design input:** a Figma HTTPS URL plus opaque node IDs is sufficient for the proposed schema. The contract does not snapshot design content or claim that a reference is immutable.
3. **Selected-task scope:** one event contains at least one task mapping. Whether a handoff may cover only part of a plan or must cover every frontend-relevant task needs owner review.
4. **Opaque handoff identity:** the caller supplies `handoff_id`. Whether it is unique globally or within a plan, how identical replays behave, and how changed content is versioned remain undecided.
5. **Optional revision reference:** `revision_id` is optional and opaque. Whether a revision must be pinned, how it is resolved, and what to do when a design changes after handoff remain undecided.
6. **Acceptance-criteria authority:** criteria are supplied as text in this event. Who may author or attest to them, and whether a human must review the handoff before development, remain undecided.
7. **Handoff detail:** the proposal does not define component inventory, responsive breakpoints, interaction states, asset delivery, design tokens, accessibility annotations, or implementation estimates. The owner should decide which, if any, belong in a later contract revision.
8. **Runtime behavior:** authentication/authorization, response and reason-code vocabulary, persistence, audit retention, Figma access policy, notification behavior, and retry semantics are not defined.

No runtime behavior should be implemented from this proposal until the material open decisions for the intended slice are reviewed.
