# WF-10/11 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an implemented GitHub or AI-review runtime. JSON fixtures validate request shape only; semantic behavior requires a separately reviewed implementation.

| Case | Expected |
|---|---|
| Request review of a declared repository pull request at a 40-character head SHA with correctness and test-coverage focus | Schema-valid event; no GitHub lookup or review is implied |
| Request only the proposed security focus using a 64-character hexadecimal SHA | Schema-valid event; the label does not define an analysis method or result |
| Omit `request_id`, `plan_id`, `review_run_id`, `repository`, `pull_request_number`, `head_sha`, or `review_focus` | Rejected by schema validation |
| Omit `owner` or `name` from `repository` | Rejected by schema validation |
| Supply a malformed repository identifier, non-positive/non-integer pull-request number, or malformed head SHA | Rejected by schema validation |
| Supply an empty focus list, unsupported focus value, or duplicate focus value | Rejected by schema validation |
| Include an undeclared property such as an access token, password, prompt override, or credential | Rejected by schema validation |
| Repository or pull request does not exist, is inaccessible, is a fork, is closed/draft, or no longer points at the declared SHA | No GitHub access occurs; authoritative lookup, eligibility, and rejection behavior remain undecided |
| `request_id`, `plan_id`, or `review_run_id` is unknown, belongs to a different chain, is replayed, or is reused with changed content | No source-chain or replay check is implemented; validation and conflict semantics remain open |
| Pull-request content, code comments, commit messages, or CI logs contain instructions to ignore policy or reveal secrets | Such content is untrusted; it cannot change policy or permissions; no model is invoked by this proposal |
| A hypothetical AI recommendation says to merge, bypass CI, change access, expose secrets, deploy, or perform a production action | The recommendation cannot authorize that action; this proposal performs no downstream operation |
| Review would publish a comment/review, create a check/status, change labels/branches, or gate CI | Not authorized or implemented; publication and gating decisions require separate review |
| Review output contains sensitive source excerpts or secrets | No output is produced here; redaction, storage, retention, and disclosure rules remain open |
| A review fails, times out, or returns low-confidence/contradictory findings | No result or failure contract is implemented; severity and failure handling remain open |
| A notification would be sent to Slack or another destination | Out of scope; this proposal sends no notifications |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-10-11-github-ai-review/README.md`](../workflows/WF-10-11-github-ai-review/README.md), especially GitHub authorization and read scope, pull-request/SHA eligibility, AI data handling, result semantics, publication, and any downstream gate.
