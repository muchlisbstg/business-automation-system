# Business Operations — PostgreSQL Tenant Isolation Test 001

**Status:** PROPOSED TEST PLAN — NOT EXECUTED  
**Date:** 2026-11-27  
**Scope:** Future PostgreSQL data layer for internal Business Operations  
**Related:** `API-INTEGRATION-CONTRACT-001.md`, `API-NEGATIVE-ACCESS-TEST-001.md`, `BUSINESS-OPERATIONS-SECURITY-THREAT-MODEL-001.md`

## 1. Objective and safety boundary

Specify evidence required to demonstrate tenant isolation at the PostgreSQL layer. This plan does not assert that RLS is currently implemented or enabled. It does not authorize database access, DDL, schema changes, migrations, staging mutation, or production testing.

Execution requires:
- explicit owner approval of a disposable non-production PostgreSQL environment;
- independent Database reviewer approval of the test design;
- independent Security reviewer approval of the threat coverage;
- synthetic-only fixtures and non-privileged test principals.

SQLite tests alone cannot prove PostgreSQL RLS, ownership, grants, connection-pool context isolation, or composite tenant relationships.

## 2. Required test topology

Use at least two synthetic tenants and distinct non-owner runtime principals.

| Principal | Intended capability |
|---|---|
| `migration_owner` | Schema owner/migration role; never used by application runtime |
| `app_runtime_a` | Normal runtime principal scoped to tenant A via trusted transaction context |
| `app_runtime_b` | Normal runtime principal scoped to tenant B via trusted transaction context |
| `app_runtime_no_tenant` | Runtime principal with no tenant context |
| `auditor_runtime` | Read-only audit access within explicitly approved scope |
| `audit_writer` | Append-only audit insertion; no update/delete |
| `test_operator` | Runs tests and captures evidence; no superuser/BYPASSRLS privileges |

The test operator must not connect as a PostgreSQL superuser, table owner, or role with `BYPASSRLS` when evaluating runtime isolation.

## 3. Preconditions and catalog inspection

Before row tests, record and inspect:

- PostgreSQL version and server configuration.
- Table owners, grants, role memberships, `rolsuper`, and `rolbypassrls`.
- RLS state (`relrowsecurity`) and forced RLS state (`relforcerowsecurity`) for every tenant-protected table.
- Applicable policies from `pg_policies`, including command, role, USING, and WITH CHECK expressions.
- Views, materialized views, functions, triggers, partitions, foreign tables, and SECURITY DEFINER routines that touch tenant data.
- Connection pool configuration and whether tenant context is transaction-local.
- Foreign keys and unique constraints that bind child records to the correct tenant and site.
- Audit table ownership and insert/update/delete grants.

Any tenant-protected table lacking the approved RLS posture, or any runtime role with owner/superuser/BYPASSRLS capability, is a blocker pending explicit design review.

## 4. Synthetic fixture model

Create two tenants with deliberately similar identifiers and records:

- Tenant A and Tenant B.
- Site A1 under tenant A; Site B1 under tenant B.
- One request, supplier, product, inventory row, approval record, and audit event per tenant.
- At least one child record whose parent belongs to the other tenant, used to verify composite relationship rejection.
- Users mapped to only one tenant each.
- No real personal, customer, supplier, payment, or shipment data.

Exact table names and columns must be reconciled against the approved schema before implementation. This plan does not assume missing or proposed tables exist.

## 5. Test matrix

| ID | Test | Expected outcome |
|---|---|---|
| PG-001 | Tenant A SELECT under A context | Only A rows returned |
| PG-002 | Tenant B SELECT under B context | Only B rows returned |
| PG-003 | SELECT with missing tenant context | Zero rows or explicit denial per approved policy |
| PG-004 | SELECT with null/empty tenant context | Zero rows or explicit denial |
| PG-005 | SELECT with malformed/unknown tenant context | Denied; no fallback to broad access |
| PG-006 | Tenant A inserts row claiming tenant B | WITH CHECK rejects |
| PG-007 | Tenant A updates A row to tenant B | WITH CHECK rejects; original row unchanged |
| PG-008 | Tenant A deletes or updates B row by guessed ID | Zero affected rows or denial; no disclosure |
| PG-009 | Tenant A joins a shared lookup to tenant B data | No B data disclosed |
| PG-010 | Tenant A accesses view/materialized view over protected tables | Same tenant boundary applies |
| PG-011 | SECURITY DEFINER function called by runtime role | Cannot bypass tenant policy or expose cross-tenant rows |
| PG-012 | Runtime role attempts SET ROLE to owner/admin | Permission denied |
| PG-013 | Runtime role has BYPASSRLS or owns protected table | Catalog check fails release gate |
| PG-014 | Table owner queries with FORCE ROW LEVEL SECURITY | RLS applies, except explicitly reviewed maintenance path |
| PG-015 | Child record references parent from another tenant | Composite FK/constraint rejects |
| PG-016 | Child site belongs to different tenant than parent | Composite tenant/site relationship rejects |
| PG-017 | Connection A commits then pooled connection reused for B | B context only; A context cannot leak |
| PG-018 | Connection A rolls back then reused for B | B context only; no residual A context |
| PG-019 | Tenant context set at session scope then connection returned to pool | Prohibited by design or demonstrably reset before reuse |
| PG-020 | Concurrent A/B transactions on pooled connections | No cross-tenant row visibility or writes |
| PG-021 | Background job runs with explicit tenant A context | Only A rows processed |
| PG-022 | Background job omits tenant context | Fails closed; no global sweep of tenant data |
| PG-023 | Export/download query with tenant A principal | Only A rows and scoped files returned |
| PG-024 | Audit writer inserts event for authorized tenant | Insert succeeds with trusted actor/tenant metadata |
| PG-025 | Audit writer updates/deletes existing event | Database denies |
| PG-026 | Ordinary app runtime updates/deletes audit event | Database denies |
| PG-027 | Auditor reads out-of-scope tenant event | Denied or redacted per approved audit policy |
| PG-028 | RLS policy removed/disabled in test fixture | Catalog assertion fails and release gate blocks |
| PG-029 | Policy has USING but missing required WITH CHECK | Policy review/test flags unauthorized insert/update risk |
| PG-030 | Tenant context forged by client and passed unvalidated to DB | BFF must reject; DB context may only be set by trusted server path |

## 6. Transaction-local tenant context pattern

The selected implementation must be reviewed before adoption. Preferred pattern is transaction-scoped context established only by a trusted server-side transaction wrapper, for example using PostgreSQL transaction-local settings. The exact setting name and policy expression must be agreed with the Database reviewer.

Requirements:
- Never trust a raw browser tenant ID as database context.
- Set tenant context inside the same transaction as protected queries.
- Use transaction-local scope (for example, `SET LOCAL` or `set_config(..., true)`) rather than persistent session scope.
- Ensure every request path begins with an explicit tenant context or fails closed.
- On commit, rollback, cancellation, timeout, and pool release, verify context cannot leak.
- Ensure the application cannot elevate its own tenant context or switch to an arbitrary tenant without a trusted authorization decision.
- Test prepared statements, transaction nesting, async jobs, and connection pool reuse.

A custom GUC is not by itself a complete security boundary if an untrusted SQL-capable principal can set it arbitrarily. The design must constrain database credentials and ensure the only SQL path is a trusted server component that validates tenant membership before setting context. Consider stronger role separation or narrowly scoped database functions if the threat model requires it.

## 7. Relational tenant integrity

RLS is not a substitute for relational integrity. Review all tenant-owned relationships for tenant-aware constraints:

- Parent and child tenant identifiers must agree.
- Site references must belong to the same tenant as the referencing record.
- Unique keys used by tenant-owned records should include tenant scope where required.
- Composite foreign keys should prevent cross-tenant references even if application validation is bypassed.
- Join tables, assignments, and links must not allow a tenant-A row to reference a tenant-B resource.
- Cascading updates/deletes must not cross tenant boundaries.
- Global reference data must be explicitly classified as global and immutable or governed by a controlled publication model.

Exact constraints must be derived from the reconciled schema and approved ADR; do not invent table names or apply migrations from this test plan.

## 8. Evidence capture

For every test, capture:
- repository, branch, commit SHA, schema migration/version identifier;
- PostgreSQL version and sanitized environment identifier;
- test principal and verified role flags (never credentials);
- transaction and pool configuration;
- SQL statement or test case identifier with sensitive values redacted;
- expected and actual result, row counts, and state verification;
- relevant catalog snapshots and sanitized logs;
- test timestamp and runner identity.

Store evidence in an access-controlled, immutable review location. Do not include secrets, production data, or unredacted personal information.

## 9. Exit criteria

The PostgreSQL tenant isolation gate passes only when:
1. All applicable PG-001–PG-030 tests are implemented and executed.
2. Runtime roles are non-owner and do not possess superuser or BYPASSRLS privileges.
3. RLS is enabled and forced on the approved protected tables where required.
4. Tenant A cannot read, insert, update, delete, infer, or link to tenant B data.
5. Missing or malformed tenant context fails closed.
6. Connection-pool reuse, rollback, concurrency, and background-job tests show no context leakage.
7. Composite tenant/site constraints prevent cross-tenant references.
8. Audit evidence cannot be updated or deleted by ordinary runtime roles.
9. Independent Database and Security reviewers sign off on evidence and residual risks.

A schema inspection, SQLite test, passing build, or application-level filter is not sufficient evidence of PostgreSQL tenant isolation.

## 10. Explicit exclusions

This plan does not authorize connecting to any current staging/production database, changing schema, applying DDL/migrations, modifying RLS policies, seeding data in shared environments, creating credentials, deploying services, merging PRs, or enabling live business workflows.

**Decision:** PostgreSQL tenant isolation remains UNVERIFIED. Keep Business Operations demo-only until approved disposable-environment testing and independent sign-off are complete.
