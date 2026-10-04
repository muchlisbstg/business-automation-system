# WF-12 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented test runner. JSON fixtures validate request shape only; no source is resolved and no tests execute.

| Case | Expected |
|---|---|
| Request unit and integration checks for a declared repository and 40-character commit SHA | Schema-valid request shape; no repository lookup or test execution is implied |
| Request only the proposed coverage category using a 64-character hexadecimal SHA | Schema-valid request shape; no coverage report, metric, or threshold is implied |
| Omit `action`, `request_id`, `plan_id`, `test_run_id`, `target`, or `requested_checks` | Rejected by schema validation |
| Omit `repository`, `owner`, `name`, or `commit_sha` from the target | Rejected by schema validation |
| Supply an empty or malformed repository identifier or malformed commit SHA | Rejected by schema validation |
| Supply an empty requested-check list, unsupported category, or duplicate category | Rejected by schema validation |
| Add an undeclared property such as an access token, password, arbitrary command, or runner override | Rejected by schema validation |
| Target repository or commit does not exist, is inaccessible, or no longer represents the intended source | No lookup occurs; source resolution, authorization, and stale-target handling remain undecided |
| A trace reference is unknown, belongs to another plan, is replayed, or reused with changed content | No source-chain, uniqueness, replay, or conflict check is implemented |
| A proposed test script or dependency contains instructions to reveal secrets or disable policy | No project code executes; any future runner must treat source as untrusted and undergo security review |
| A requested category has no matching test suite, test execution times out, or produces partial results | No suite-discovery or result contract exists; selection, timeout, and failure behavior remain open |
| A coverage request has missing coverage data or a value below an expected threshold | No coverage is collected and no threshold or pass/fail interpretation is defined |
| A test result would be used to merge, release, deploy, or perform a production action | This proposal grants no such authority; repository policy and human approvals remain authoritative |
| A test run would send a Slack or other notification | Out of scope; this proposal sends no notifications |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-12-tests/README.md`](../workflows/WF-12-tests/README.md), especially test selection and execution, runner isolation and permissions, coverage semantics, result/evidence handling, and CI gating.
