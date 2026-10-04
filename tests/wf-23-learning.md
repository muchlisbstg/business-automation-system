# WF-23 Learning Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of an operational learning loop. JSON fixtures validate candidate-envelope shape only; they do not collect outcomes, verify evidence, infer lessons, or change a model or process.

| Case | Expected |
|---|---|
| Provide a synthetic candidate with the proposed action, identifiers, source label, title, and summary | Schema-valid shape only; no verified observation, lesson, or learning operation is implied |
| Provide a different bounded source label | Schema-valid shape only; the label does not authenticate a source or establish provenance |
| Omit `action`, `request_id`, `candidate_id`, `source`, `title`, or `summary` | Rejected by schema validation |
| Supply an empty required text field or a value beyond its candidate bound | Rejected by schema validation |
| Add undeclared outcome, evidence, confidence, evaluation, model, prompt, approval, or command fields | Rejected by schema validation; their meanings and behavior are not defined |
| Reuse an identifier, name an unknown source, or submit conflicting candidates | No lookup, authentication, deduplication, replay handling, or conflict resolution occurs; those semantics remain open |
| Put a secret, personal data, sensitive information, false claim, copyrighted content, or instruction-like text in an allowed string | The schema cannot detect or sanitize it; this proposal performs no processing and content-safety rules remain open |
| Candidate summary states a cause, lesson, or generalized conclusion | No causal, factual, quality, confidence, or generalizability assessment occurs |
| Request analysis of workflow history, feedback, telemetry, source data, or outcomes | No source is accessed, and no outcome is read or analyzed |
| Request an AI-generated summary, classification, or recommendation | No AI analysis or recommendation is performed; policy and review requirements remain undecided |
| Ask to train or update a model, prompt, policy, automation, code, or business process | No system or process changes; no approval or authorization is established |
| Request storage, publication, retrieval, correction, retention, or deletion | No content is stored, published, retrieved, corrected, or deleted; lifecycle semantics remain open |
| A candidate could affect CI, another workflow, a release, or a business action | No gate, approval, status, or side effect is created |
| Processing or a future side effect fails partway through | No state, retry, recovery, or rollback behavior is defined |
| A candidate might trigger Slack or another notification | Out of scope; this proposal sends no notifications |

Review the assumptions and open decisions in [`workflows/WF-23-learning/README.md`](../workflows/WF-23-learning/README.md) before any runtime implementation.
