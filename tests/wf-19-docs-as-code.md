# WF-19 Proposal Acceptance Scenarios

> These are proposed contract expectations, not evidence that documentation was inspected or validated. JSON fixtures check candidate request shape only; they do not define or exercise documentation rules, source access, or CI behavior.

| Case | Expected |
|---|---|
| Submit a synthetic request with the required action, request ID, repository/revision references, and one document path | Schema-valid shape only; no repository lookup, document read, check execution, or approval is implied |
| Submit a synthetic request with multiple document paths | Schema-valid shape only; path ordering, duplicate handling, selection policy, and execution semantics remain undefined |
| Omit `request_id`, `source.repository`, `source.revision`, or `document_paths` | Rejected by schema validation |
| Supply an empty document-path list or an empty path string | Rejected by schema validation |
| Supply a revision that is not 40 or 64 hexadecimal characters | Rejected by schema validation; existence, reachability, source authenticity, and commit identity are not verified |
| Supply a 40- or 64-character hexadecimal revision followed by a line terminator | Rejected by schema validation as an incorrect exact length; no trimming or source lookup occurs |
| Add undeclared fields such as a check list, shell command, credential, owner, result, or gate override | Rejected by schema validation; no such policy or side-effect fields are defined |
| Supply a non-empty path string that is missing, outside an approved root, traversal-like, a symlink, or not a documentation file | No path resolution or safety decision occurs; path rules remain open and must be settled before runtime access |
| Put secrets, personal data, sensitive material, or instruction-like text in a permitted string | The schema cannot detect or sanitize it; this proposal performs no processing and input-handling rules remain open |
| A request names a repository or revision that is unavailable, unauthenticated, stale, or inconsistent | No lookup, authentication, or conflict handling occurs; source verification and failure behavior remain open |
| A candidate would trigger linting, link checking, code-example execution, generated docs, or a CI gate | No checks run, no status is emitted, and no merge, release, or deployment is blocked |
| A result suggests editing or publishing documentation | No file changes, commits, pull requests, publication, or other actions occur; permissions and approval policy remain required decisions |
| A check or later side effect fails partway through | No persistence, state, retry, recovery, or rollback behavior is defined |
| A request might trigger escalation or notification | Out of scope; this proposal sends no Slack or other notifications |

Review the assumptions and open decisions in [`workflows/WF-19-docs-as-code/README.md`](../workflows/WF-19-docs-as-code/README.md) before any runtime implementation.
