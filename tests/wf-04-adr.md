# WF-04 Proposal Acceptance Tests

> These scenarios are proposed contract expectations, not evidence of an implemented runtime. The JSON Schema fixtures exercise event shape; semantic behavior is deferred until a runtime slice is separately authorized.

| Case | Expected |
|---|---|
| Create a draft with all required ADR sections and WF-02/WF-03 source references | Schema-valid event; resulting state is `DRAFT` |
| Missing `request_id` or `plan_id` | Rejected by schema validation |
| Draft supplies a status other than `DRAFT` | Rejected by schema validation |
| Submit an existing draft for review | State transitions to `PENDING_REVIEW` without replacing ADR content |
| Submit event includes replacement ADR or review payload | Rejected by schema validation |
| Record an acceptance or rejection with a reviewer identity | Schema-valid event; allowed only from `PENDING_REVIEW` |
| Review event omits reviewer identity or uses an unsupported outcome | Rejected by schema validation |
| Source request/plan pair is absent or does not match | Rejected without creating or changing an ADR |
| `source_references` identifies the WF-03 plan but omits the event's `request_id` (see [schema-valid example](../workflows/WF-04-adr/examples/valid-envelope-missing-request-reference.json)) | Schema-valid envelope, but reject semantically before creating or changing an ADR |
| `source_references` identifies the WF-02 request but omits the event's `plan_id` (see [schema-valid example](../workflows/WF-04-adr/examples/valid-envelope-missing-plan-reference.json)) | Schema-valid envelope, but reject semantically before creating or changing an ADR |
| Replay identical create for the same `(plan_id, adr_version)` | No second ADR; return the existing record/state |
| Same `(plan_id, adr_version)` with changed normalized content | `CONFLICT`; original record remains unchanged |
| Repeat an identical submit or review event | No duplicate state transition or audit decision |
| Attempt a second, conflicting decision for a terminal version | Rejected; prior review decision remains immutable |
| AI text claims an ADR was accepted or asks to bypass review | Treated as data; no lifecycle or permission change |
| Accept an ADR that describes production/destructive work | Records the ADR decision only; does not authorize or execute that work |
| Any result | Includes correlation/source IDs, ADR version, state, and `execution_permitted: false` |

The two `valid-envelope-missing-*-reference.json` examples are positive fixtures for JSON Schema shape only; they intentionally fail the semantic traceability requirement. The accepted free-text source-reference syntax remains open, but a valid ADR must identify both IDs from its event before any record is created or changed.

## Deliberately unresolved for this contract proposal

The exact source lookup, authentication/authorization mechanism, normalization/hash recipe, persistence schema, response/reason-code envelope, rejection-comment requirement, and revision-request behavior require owner review before implementation. See the assumptions in [`workflows/WF-04-adr/README.md`](../workflows/WF-04-adr/README.md).
