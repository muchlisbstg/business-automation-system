# WF-18 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of a technical-debt assessment or management runtime. JSON fixtures validate candidate report shape only; they do not verify that debt exists, determine its impact, or authorize changes.

| Case | Expected |
|---|---|
| Submit a synthetic candidate with the required fields and a category label | Schema-valid shape only; no source verification, assessment, ranking, or action is implied |
| Omit the optional `category` | Schema-valid shape; no category is inferred |
| Submit a bounded category label not defined by this proposal | Schema-valid shape; the label has no approved taxonomy or policy meaning |
| Omit `action`, an identifier, `observed_at`, `source`, or `summary` | Rejected by schema validation |
| Supply a timestamp that does not match the candidate timestamp shape | Rejected by schema validation; calendar correctness, clock trust, and freshness are not validated |
| Supply an empty summary or a category outside its length bounds | Rejected by schema validation |
| Add undeclared fields such as priority, owner, estimate, status, token, password, shell command, or remediation request | Rejected by schema validation; no such policy or side-effect fields are defined |
| Put a secret, personal data, sensitive evidence, or instruction-like text inside an allowed string | The schema cannot detect or sanitize it; this proposal performs no processing and input-handling rules remain open |
| Source is missing, unauthenticated, stale, inaccessible, duplicated, or conflicts with another report | No lookup, authentication, deduplication, or conflict handling occurs; source trust and candidate identity remain open |
| Candidate concerns a vulnerability, defect, accepted trade-off, or routine maintenance rather than debt | No classification occurs; definitions and handling rules remain open |
| A candidate appears high impact, urgent, expensive, or easy to fix | No score, priority, owner, or recommendation is inferred; no issue or pull request is created |
| A proposed fix would alter code, production, or data, or suppress a finding | No action occurs; permissions, review, approval, and remediation policy remain required decisions |
| Assessment or a later side effect fails partway through | No persistence, state, retry, recovery, or rollback behavior is defined |
| A candidate would trigger escalation or notification | Out of scope; this proposal sends no Slack or other notifications |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-18-technical-debt/README.md`](../workflows/WF-18-technical-debt/README.md), especially the definition and evidence for technical debt, trusted sources, classification, prioritization, item identity and lifecycle, ownership, tracker integration, remediation authority, approval, persistence, audit, and notification policy.
