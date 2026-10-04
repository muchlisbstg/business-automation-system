# WF-08 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented database QA runtime. JSON fixtures validate request shape only; semantic behavior requires a separately reviewed implementation.

| Case | Expected |
|---|---|
| Request migration-safety and schema-consistency checks for a declared development target | Schema-valid event; no database connection or migration execution is implied |
| Request query-plan, index, N+1, or row-level-security review against a declared staging target | Schema-valid event; exact probes and data access remain undefined |
| Omit `request_id`, `plan_id`, `qa_run_id`, `target`, or `checks` | Rejected by schema validation |
| Omit `commit_sha`, `database_ref`, or `environment` from `target` | Rejected by schema validation |
| Use a malformed commit SHA or database reference outside the proposed identifier format | Rejected by schema validation |
| Declare `PRODUCTION` or an unsupported environment | Rejected by schema validation |
| Supply an empty check list, unsupported category, or duplicate category | Rejected by schema validation |
| Include an undeclared field such as `database_url`, `dsn`, `username`, or `password` | Rejected by schema validation |
| The source request or plan is missing, or the IDs do not belong to one source chain | Future semantic validation rejects before any database access; response details are open |
| `database_ref` is unknown, unauthorized, maps to production, or resolves to a target with unapproved data | Future target validation rejects before access; registry and environment-verification rules are open |
| The database state does not correspond to the declared commit | Future semantic validation must reject or apply a reviewed rule; the evidence and matching rule are open |
| A requested check needs SQL, a role matrix, migration paths, workload, or fixture not present in the event | No execution is implied; required scope inputs and their representation need owner review |
| A check would apply DDL, write business data, create/clean test data, or perform a destructive operation | Not authorized by this proposal. Existing migration policy remains unchanged; any isolated test policy requires separate review |
| A check would run schema-changing DDL in n8n | Not permitted by the existing security baseline; migrations remain outside n8n in the CI/CD migration process |
| Database content, SQL comments, a query plan, or AI-generated text instructs a runner to bypass policy | Treated as untrusted input; it cannot alter policy, permissions, approval, or workflow state |
| A check fails or evidence contains SQL/data that may be sensitive | Result states, redaction, retention, severity, and gate behavior remain undecided |
| A request is replayed or `qa_run_id` is reused with changed content | Idempotency, conflict behavior, and retry semantics remain undecided |
| A future result would trigger a merge, deployment, migration, or notification | Not authorized by this proposal; CI gating and all notifications, including Slack, are out of scope |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-08-database-qa/README.md`](../workflows/WF-08-database-qa/README.md), especially target resolution and data classification, check inputs and thresholds, read-only versus isolated execution, migration-test policy, result/evidence handling, retry behavior, and CI gating.
