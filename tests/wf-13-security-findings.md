# WF-13 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of a security-scanning runtime. JSON fixtures validate report shape only; no repository is resolved and no scan or report verification occurs.

| Case | Expected |
|---|---|
| Report a synthetic finding for a declared repository and 40-character commit SHA | Schema-valid report shape; no repository lookup, scanner execution, or finding verification is implied |
| Report a synthetic finding using a 64-character hexadecimal SHA and a proposed `UNKNOWN` severity | Schema-valid shape; the label has no defined scoring or policy meaning |
| Submit an empty `findings` array | Schema-valid shape only; it does not prove a scan succeeded or that no vulnerabilities exist |
| Omit `action`, `request_id`, `plan_id`, `security_run_id`, `target`, or `findings` | Rejected by schema validation |
| Omit `repository`, `owner`, `name`, or `commit_sha` from the target | Rejected by schema validation |
| Supply an empty or malformed repository identifier, or malformed commit SHA | Rejected by schema validation |
| Omit a required finding field or use an unsupported severity label | Rejected by schema validation |
| Add an undeclared property such as an access token, password, arbitrary command, runner override, or finding-level evidence field | Rejected by schema validation |
| Put a secret, sensitive source excerpt, or instruction-like content inside an allowed summary string | The schema cannot detect or sanitize it; no report is processed by this proposal, and future input handling/redaction rules remain open |
| Target repository or commit is missing, inaccessible, unauthorized, or stale | No lookup occurs; provenance, authorization, and stale-target handling remain undecided |
| Report contains duplicate or conflicting findings, or reuses an identifier across reports | No normalization, deduplication, identity, replay, or conflict behavior is implemented |
| Scanner is unavailable, fails, times out, returns partial data, or reports no findings | No scan or result-state contract exists; empty, partial, failed, and clean outcomes need explicit semantics |
| Findings would block a merge, release, or deployment, or trigger remediation or an exception | Not authorized or implemented; gating, human review, waiver, and downstream-action policies remain open |
| A report would send a Slack or other notification | Out of scope; this proposal sends no notifications |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-13-security-findings/README.md`](../workflows/WF-13-security-findings/README.md), especially whether the workflow reports findings or requests scans, source trust and report integrity, severity mapping, evidence redaction and retention, result lifecycle, and CI gating.
