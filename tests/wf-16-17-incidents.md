# WF-16/17 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an incident-detection or response runtime. JSON fixtures validate candidate signal shape only; no signal is authenticated, incident confirmed, or response executed.

| Case | Expected |
|---|---|
| Submit a synthetic signal with a candidate source, timestamp, severity, and summary | Schema-valid shape only; no detector lookup, source verification, incident declaration, or response is implied |
| Submit a signal using `UNKNOWN` severity | Schema-valid shape; the label has no defined meaning, confidence, or policy consequence |
| Use one of the candidate severity labels | Accepted by the candidate schema; no threshold, priority, or response policy is evaluated |
| Omit `action`, an identifier, `observed_at`, `source`, `severity`, or `summary` | Rejected by schema validation |
| Supply a timestamp with malformed syntax, an impossible calendar date, out-of-range clock or offset fields, or a leap second | Rejected by the candidate schema and CI date-time format assertion; authoritative clock, trust, freshness, ordering, and allowed skew remain undefined |
| Use an unsupported severity label or an empty required string | Rejected by schema validation |
| Add an undeclared field such as a token, password, shell command, restart request, or response override | Rejected by schema validation |
| Put a secret, personal data, sensitive evidence, or instruction-like text inside an allowed summary | The schema cannot detect or sanitize it; this proposal processes no signal and input-handling rules remain open |
| Source is missing, unauthenticated, stale, inaccessible, duplicated, or conflicts with another observation | No lookup, authentication, deduplication, or conflict handling occurs; source trust and signal semantics remain open |
| Severity is high, critical, unknown, or inconsistent with evidence | No incident is confirmed, no priority is inferred, and no response is authorized |
| A response would restart, isolate, fail over, modify data, or affect production | No action occurs; target authorization, response policy, and human approval remain required decisions |
| A signal would trigger escalation or notification | Out of scope; this proposal sends no Slack or other notifications |
| Detection fails, produces partial data, or a response fails after side effects | No state, retry, recovery, or rollback behavior is defined |

## Decisions required before runtime implementation

Review the assumptions and open decisions in [`workflows/WF-16-17-incidents/README.md`](../workflows/WF-16-17-incidents/README.md), especially the WF-16/WF-17 boundary, trusted signal sources, severity semantics, incident identity and lifecycle, response authority and approval, evidence handling, recovery, audit, and notification policy.
