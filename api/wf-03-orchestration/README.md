# WF-03 Orchestration Service

This TypeScript service validates against the published `workflows/WF-03-orchestration/schema.json` contract and records a deterministic orchestration plan in PostgreSQL. It exposes `OrchestrationService.orchestrate(unknown)` and `PostgresOrchestrationRepository`; it does not add an HTTP endpoint, start n8n, run tasks, invoke business systems, or approve work.

## Contract boundary

The published input schema requires a WF-02 `source` reference with `planning_state: PLANNED` and a `review_signal`, including `review_requirement_ids`, even when no upstream review is needed. WF-02 exposes the persisted `planning_state` separately from its API `state`, so a replay of an invalid record cannot masquerade as a planned record. The source request ID must match the root request ID; the signal's status, reason codes, and requirement IDs must be consistent. A review requirement ID not linked to a task is rejected, with no execution order.

WF-03 retains the established trusted-caller assumption: the caller forwards the actual WF-02 result and matching task list. The service validates the declared source and structure but does not introduce authentication or independently retrieve an authoritative WF-02 record. A pending review signal is not approval; WF-03 has no approval-completion path. Unsupported fields, including approval or completion claims, are rejected.

## Deterministic behavior

- Strings are normalized with Unicode NFKC, canonical newlines, and surrounding-whitespace trimming; object keys are canonicalized while array order is preserved for plan hashing.
- Duplicate task IDs are rejected. Unknown dependency IDs and cycles return their contract states and no execution order.
- Valid graphs use topological ordering with lexical `task_id` tie-breaking.
- A high-impact task is detected using the established WF-01 conservative action-language rule, plus explicit `risk: high|critical` and `environment: prod` values. Destructive actions and production-related changes are gated. The gated task and any transitive dependents are included in `blocked_task_ids`; only the remaining safe topological order is returned.
- Tasks linked to a WF-02 review-required requirement are also gated, together with every transitive dependent. Tasks unrelated by requirement link and dependency remain eligible and retain deterministic topological ordering.
- The canonical payload hash includes the upstream source and review signal. A changed signal for an existing `plan_id` returns `CONFLICT` and cannot replace the stored result.
- A `plan_id` is immutable: an identical normalized replay returns `DUPLICATE`; changed content returns `CONFLICT` and no execution order.
- `execution_order` is a plan only. The service never executes or marks a task complete.

## PostgreSQL

`database/migrations/003_wf_03_orchestration.sql` adds the append-only `wf03_orchestrations` table with a unique `plan_id`; service persistence uses `INSERT ... ON CONFLICT DO NOTHING` followed by a read, never update/delete. Apply the migration with `DATABASE_URL` set:

```sh
npm run migrate
```

Run unit and PostgreSQL integration tests and TypeScript checking with:

```sh
npm test
npm run typecheck
```

The PostgreSQL integration test runs when `DATABASE_URL` is set; CI applies the migration against PostgreSQL before running it.
