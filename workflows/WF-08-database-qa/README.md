# WF-08 — Database Quality Assurance (Proposal)

> **Proposal only.** This defines a reviewable request-contract candidate. It does not connect to a database, inspect or change data, run SQL or migrations, create a QA runner, persist results, gate CI, or send notifications.

## Purpose and scope

Request database-quality checks against a declared non-production database reference, with traceability to a WF-02 request and WF-03 plan. The proposed check categories reflect the existing database principles in [`database/README.md`](../../database/README.md): migration safety, schema changes, query plans, indexes, N+1 patterns, and row-level security.

This proposal specifies only an input event shape. It defines no API surface, database connection mechanism, query set, migration execution, result contract, or runtime behavior. The schema validates payload shape only; it cannot prove the source chain, target identity, environment, commit/deployment relationship, authorization, or safety of any future check.

## Proposed input contract

The JSON Schema is [`schema.json`](schema.json); positive and negative examples are in [`examples/`](examples/). A `REQUEST_DATABASE_QA` event contains:

- `request_id` and `plan_id`: opaque references to the WF-02 request and corresponding WF-03 plan. Existence and source-chain membership are not established by the schema.
- `qa_run_id`: a caller-supplied run reference. Uniqueness, replay, and retry semantics are not specified.
- `target`: a 40- or 64-character hexadecimal `commit_sha`, a safe-format opaque `database_ref`, and a declared environment of `DEVELOPMENT` or `STAGING`. These values do not establish that the database is associated with the commit or that the target is actually non-production.
- `checks`: one or more distinct categories: `MIGRATION_SAFETY`, `SCHEMA_CONSISTENCY`, `QUERY_PLAN_REVIEW`, `INDEX_REVIEW`, `N_PLUS_ONE_REVIEW`, and `ROW_LEVEL_SECURITY`.

Undeclared fields are rejected, including connection strings, usernames, and passwords. `database_ref` is a proposed logical identifier, not a URI, DSN, credential, or authorization grant. The schema neither resolves nor verifies it.

## Safety boundaries

- A QA request is not permission to connect to, inspect, or modify a database. This proposal implements no database access, SQL execution, migration application, or result production.
- Production is excluded from the proposed environment values, but the declared environment is only a caller claim. Any future runtime needs an authoritative target mapping and checks that prevent access to production, private/unapproved targets, and environments containing data that has not been approved for testing.
- No operation that changes schema or data, creates or cleans up test data, or performs a destructive action is authorized by this request. Whether isolated disposable-database execution is appropriate requires owner review. Existing repository policy remains in force: n8n must not execute schema-changing DDL; migrations run through CI/CD, and destructive migrations require explicit approval and backup evidence.
- Database contents, migration SQL, query plans, imported metadata, and AI-generated recommendations are untrusted input. They cannot change identity, permissions, approvals, validation rules, or workflow state.
- No QA result authorizes a merge, deployment, migration, or production action. No Slack or other notification behavior is in scope.

## Acceptance scenarios

See [`tests/wf-08-database-qa.md`](../../tests/wf-08-database-qa.md). Fixtures validate request shape only. Source-chain validation, safe target resolution, authorization, database access, test execution, and result interpretation are not implemented by this proposal.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. One request names one repository commit and one logical database reference. Whether `commit_sha` identifies migrations, application code, or a deployment manifest—and how the database is proven to correspond to it—remains undecided.
2. `DEVELOPMENT` and `STAGING` reuse the repository's existing environment names; production is excluded. The authoritative source for environment identity, staging-data classification, and whether a separately isolated `TEST` target is needed remain open.
3. `database_ref` is an opaque non-secret alias. Its registry, ownership, resolution rules, and authorization mapping are not defined.
4. Check names identify requested categories only. The migration analyzers, schema-drift rules, query-plan inputs and limits, index recommendations, N+1 evidence, RLS policies, thresholds, and pass/fail criteria need owner review.
5. This event has no migration paths, schema/table scope, workload, SQL statement, fixture, or role matrix. Whether any of those references belong in this contract or a separate reviewed suite definition is open.
6. The safe proposal baseline grants no database access or mutation. Read-only role requirements, isolated migration testing, test-data creation/cleanup, and treatment of sensitive or production-derived data must be decided before runtime implementation.
7. Authentication, secret-store integration, least-privilege roles, network/TLS restrictions, audit fields, and approval requirements need a reviewed security design. Credentials must not be added to this event.
8. Result states, evidence format, SQL/plan redaction, retention, severity, retry/idempotency, CI gating, and whether results block downstream work are undefined.
9. A future implementation must validate that the WF-02 request and WF-03 plan exist and belong to the same chain, and that the resolved database is authorized and non-production, before any access. The rejection envelope and reason codes remain undecided.

No runtime behavior should be implemented from this proposal until the relevant decisions for the intended slice are reviewed.
