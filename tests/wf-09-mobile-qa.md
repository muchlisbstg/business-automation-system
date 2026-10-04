# WF-09 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented mobile QA runtime. JSON fixtures validate request shape only; semantic behavior requires a separately reviewed implementation.

| Case | Expected |
|---|---|
| Request install/launch, functional-smoke, and accessibility checks for a declared iOS development target | Schema-valid event; no installation or test execution is implied |
| Request network-resilience and performance checks for a declared Android staging target | Schema-valid event; network access, device selection, test execution, and thresholds remain undefined |
| Omit `request_id`, `plan_id`, `qa_run_id`, `target`, or `checks` | Rejected by schema validation |
| Omit `commit_sha`, `app_ref`, `platform`, or `environment` from `target` | Rejected by schema validation |
| Use a malformed commit SHA or an app reference outside the proposed identifier format | Rejected by schema validation |
| Declare a platform other than `IOS` or `ANDROID` | Rejected by schema validation |
| Declare `PRODUCTION` or another unsupported environment | Rejected by schema validation |
| Supply an empty check list, unsupported category, or duplicate category | Rejected by schema validation |
| Include an undeclared property such as a signing secret, access token, password, or credential | Rejected by schema validation |
| The source request or plan is missing, or the IDs do not belong to one source chain | A future semantic validator must reject before access; response details are open |
| `app_ref` is unknown, unauthorized, resolves to production, or maps to unapproved data | A future target resolver must reject before access; registry and environment-verification rules are open |
| The resolved app artifact was not built from the declared commit | A future provenance check must reject or follow a reviewed rule; evidence and matching policy are open |
| The request lacks an approved build, device/OS matrix, locale, or test-suite reference required by a check | No execution is implied; required scope inputs and their representation need owner review |
| A check would write business data, change account state, send real SMS/email/push, purchase, or perform a destructive action | Not authorized by this proposal; test identity, isolation, cleanup, and any allowed mutation need separate review |
| A check would access a private network, use unapproved test credentials, or distribute/install a production application | Not authorized by this proposal; future access-control and target-safety rules need security review |
| App text, accessibility labels, network responses, or AI-generated recommendations instruct a runner to bypass policy | Treated as untrusted input; they cannot alter policy, permissions, approval, or workflow state |
| A check fails or captures screenshots, recordings, logs, or traces containing sensitive data | Result states, evidence redaction, privacy, retention, severity, and gate behavior remain undecided |
| A request is replayed or `qa_run_id` is reused with changed content | Idempotency, conflict behavior, and retry semantics remain undecided |
| A future result would trigger a merge, release, deployment, store submission, or notification | Not authorized by this proposal; CI gating and all notifications, including Slack, are out of scope |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-09-mobile-qa/README.md`](../workflows/WF-09-mobile-qa/README.md), especially build provenance, target resolution, device/OS coverage, authentication and data isolation, permitted side effects, evidence privacy, retry behavior, and CI gating.
