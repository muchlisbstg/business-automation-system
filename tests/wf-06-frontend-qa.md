# WF-06 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented QA runtime. JSON fixtures validate request shape only; semantic behavior requires a separately reviewed implementation.

| Case | Expected |
|---|---|
| Request accessibility, functional-smoke, and responsive checks against a preview commit | Schema-valid request; no test execution or result is implied |
| Request visual regression with a WF-05 handoff reference | Schema-valid request; existence, revision, and source-chain checks remain semantic |
| Omit `request_id`, `plan_id`, `qa_run_id`, target, or checks | Rejected by schema validation |
| Use a non-HTTPS preview URL or malformed commit SHA | Rejected by schema validation |
| Embed username/password URL user-info in `preview_url` | Rejected by schema validation; the request cannot carry preview credentials |
| Select an unsupported or duplicate check category | Rejected by schema validation |
| Select `VISUAL_REGRESSION` without `figma_handoff_id` | Rejected by schema validation |
| Provide `figma_handoff_id` without selecting `VISUAL_REGRESSION` | Rejected by schema validation |
| Declare a production environment or include undeclared properties | Rejected by schema validation |
| The preview URL resolves to a private, loopback, link-local, metadata, or unapproved host | Future semantic validation rejects before browsing |
| The preview URL does not serve the declared commit, or the source request/plan pair does not match | Future semantic validation rejects before checks run |
| A visual handoff is missing, stale, or belongs to another source plan | Future semantic validation rejects; exact resolution behavior remains open |
| A page or Figma label instructs the runner to bypass policy or submit forms | Treated as untrusted data; policy is unchanged and no state-changing action is taken |
| A requested check fails | Future result contract must report auditable evidence and deterministic status; thresholds and gate behavior are undecided |
| Any check would submit a form, change account state, write business data, deploy, or perform a destructive action | Not performed; request cannot authorize the action |

## Decisions required before runtime implementation

Review the scope, security, source-chain, and result questions in [`workflows/WF-06-frontend-qa/README.md`](../workflows/WF-06-frontend-qa/README.md). In particular, decide preview host/DNS controls, authentication, browser/device coverage, accessibility and performance thresholds, visual-baseline/revision rules, result schema, and whether any result blocks later CI work.
