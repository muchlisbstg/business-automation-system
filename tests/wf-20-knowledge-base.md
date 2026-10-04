# WF-20 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence of knowledge verification, curation, ingestion, storage, or retrieval. JSON fixtures check candidate metadata shape only; they do not define or exercise source access, content handling, or knowledge-base behavior.

| Case | Expected |
|---|---|
| Submit a synthetic candidate with the required action, identifiers, source label, title, and summary | Schema-valid shape only; no source verification, acceptance, or storage is implied |
| Submit a candidate with a different bounded source label | Schema-valid shape only; the label does not authenticate a provider or establish provenance |
| Omit `action`, `request_id`, `candidate_id`, `source`, `title`, or `summary` | Rejected by schema validation |
| Supply an empty required text field or a field beyond its candidate bound | Rejected by schema validation |
| Supply only whitespace in any required text field | Rejected by schema validation; values are not trimmed or normalized |
| Add undeclared fields such as `content`, access rules, storage instructions, embeddings, or a command | Rejected by schema validation; no such content or side-effect policy is defined |
| Reuse an identifier, provide an unknown source, or report conflicting candidates | No lookup, deduplication, source verification, or conflict resolution occurs; those semantics remain open |
| Put a secret, personal data, copyrighted text, sensitive evidence, or instruction-like text in an allowed string | The schema cannot detect or sanitize it; this proposal performs no processing and safe-content rules remain open |
| A candidate contains a false, outdated, incomplete, or low-quality claim | No factual assessment, confidence, freshness check, or quality label is assigned |
| A candidate would need to be copied, parsed, chunked, embedded, indexed, stored, or published | No content is fetched or changed; ingestion, storage, and publication remain undecided |
| A caller searches for an entry or asks a system to generate an answer from the knowledge base | No retrieval, ranking, citation, filtering, or answer generation occurs |
| A candidate is unavailable to a user or conflicts with access permissions | No access-control decision or permission filtering occurs; authorization policy remains open |
| A candidate would affect CI, another workflow, or a business operation | No status, gate, approval, or side effect is created |
| Processing or a future side effect fails partway through | No persistence, state, retry, recovery, or rollback behavior is defined |
| A candidate might trigger escalation or notification | Out of scope; this proposal sends no Slack or other notifications |

Review the assumptions and open decisions in [`workflows/WF-20-knowledge-base/README.md`](../workflows/WF-20-knowledge-base/README.md) before any runtime implementation.
