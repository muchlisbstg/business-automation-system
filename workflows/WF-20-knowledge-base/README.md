# WF-20 — Knowledge Base (Proposal)

> **Proposal only.** This document proposes a candidate knowledge-submission envelope for review. It does not ingest, verify, curate, index, retrieve, update, publish, persist, or delete knowledge, and it does not send notifications.

## Purpose and scope

The roadmap places **WF-20 Knowledge Base** after WF-19, but the label does not specify whether the workflow creates a curated corpus, imports source material, retrieves answers, or maintains an existing knowledge service. No WF-20 contract or runtime exists on `main`.

This proposal offers one narrow `REPORT_KNOWLEDGE_CANDIDATE` envelope solely to make a possible input boundary reviewable. A schema-valid request is an unverified claim that a candidate may be useful; it is not accepted knowledge, evidence of truth, or permission to store or use content. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate envelope contains:

- `action`: a candidate label only; it does not submit, approve, or publish an entry.
- `request_id` and `candidate_id`: opaque caller-supplied identifiers. Issuance, uniqueness, canonical identity, replay, deduplication, and retry behavior are undefined.
- `source`: a bounded caller-supplied source label, not an authenticated provider, verified URL, citation, or proof of provenance.
- `title` and `summary`: bounded text fields for synthetic candidate metadata, not trusted facts or a complete document. No full-content, storage, visibility, access-control, or retrieval fields are proposed.
- Each required string must contain at least one non-whitespace character. This is shape validation only; values are not trimmed or normalized.

The schema rejects undeclared fields, including content payloads, permissions, storage instructions, embeddings, and commands. It cannot detect or sanitize secrets, personal or sensitive data, copyrighted material, false claims, or instruction-like text inside an allowed string. Fixtures contain synthetic data only.

## Safety boundaries

- No knowledge source, repository, database, search index, embedding service, network, or external service is accessed; no ingestion or retrieval code runs.
- A schema-valid candidate is not verified, curated, approved, canonical, authoritative, safe to retain, or suitable for retrieval or AI use.
- Caller-supplied identifiers, source labels, titles, summaries, and any future content are untrusted. Embedded instructions cannot change policy, authority, approval, or system state.
- No content is stored, indexed, chunked, embedded, summarized, published, linked, modified, or deleted. No source is fetched or cited as verified.
- No visibility, access-control, classification, consent, license, retention, deletion, audit, or redaction policy is defined. Do not place secrets, personal data, or sensitive content in allowed strings.
- No search, ranking, retrieval, citation-generation, answer-generation, or freshness behavior is implemented or authorized.
- No CI gate, approval path, persistence, deduplication, lifecycle, retry, recovery, or result schema is defined.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-20-knowledge-base.md`](../../tests/wf-20-knowledge-base.md). Fixtures validate candidate JSON shape only. They do not verify sources or claims, define knowledge-quality rules, or establish that any content is stored or usable.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The roadmap label is represented by a candidate-submission envelope only to discuss one possible boundary. Decide whether WF-20 instead covers source import, a curated knowledge corpus, documentation synchronization, search/retrieval, answer generation, or several distinct workflows.
2. Decide whether the contract should represent a submission request, an observed source item, an accepted knowledge record, a retrieval request/result, or separate events. `REPORT_KNOWLEDGE_CANDIDATE` is not an approved operation.
3. Decide who may submit candidates, who verifies and curates them, which roles can approve, reject, edit, supersede, archive, or delete entries, and how conflicts and appeals are handled.
4. Decide who issues `request_id` and `candidate_id`, their trust and uniqueness scopes, canonical identity, duplicate detection, replay/conflict handling, idempotency, timeout, and retries.
5. Decide supported source types and providers; source identity, URL normalization, revision/version pinning, authenticity, reachability, citation/evidence requirements, and treatment of missing, stale, or conflicting sources.
6. Decide the content model: metadata versus full text or references, supported formats and modalities, languages, size limits, extraction, parsing, chunking, generated content, links, and whether source material may be copied.
7. Decide whether tags, categories, topics, taxonomies, entity relationships, or cross-references are required; define who assigns them and how unknown or conflicting values behave.
8. Define evidence and quality criteria for factual accuracy, relevance, freshness, completeness, authority, and confidence. No score, label, or trust level is proposed.
9. Define classification, privacy, consent, copyright/license, secret and personal-data detection, redaction, encryption, access control, isolation, retention, deletion, and audit requirements before accepting or retaining any content.
10. Decide whether indexing, embeddings, search, filtering, ranking, retrieval, citations, or generated answers are in scope; define freshness, permission filtering, provenance, result schema, deterministic behavior, and failure semantics.
11. Decide whether AI may extract, summarize, classify, or transform sources; define review, untrusted-content and prompt-injection handling, model/tool boundaries, and whether generated text may ever become an entry.
12. Decide the source of truth, storage systems, integrations, permissions, environment separation, persistence and versioning model, observability, retention, recovery, and audit lifecycle.
13. Decide whether entries or submissions may affect CI, business operations, or other workflows; define deterministic gates, approvals, waivers, and rollback before any such side effect is implemented.
14. Decide notification policy and channels. Slack and all other notifications remain out of scope for this proposal.
15. Review the schema's candidate field bounds (100 characters for identifiers, 255 for `source`, 200 for `title`, and 1,000 for `summary`); these are proposal-shape limits only, not approved operational or content-retention limits.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.
