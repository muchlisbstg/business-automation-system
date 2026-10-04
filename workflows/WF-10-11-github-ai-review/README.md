# WF-10/11 — GitHub Integration and AI Review (Proposal)

> **Proposal only.** This defines a reviewable request-shape candidate for the roadmap's combined WF-10/11 slot. It does not authenticate to GitHub, read repository or pull-request content, invoke an AI model, write a review, post a comment, create a check or status, change labels or branches, merge or close a pull request, persist findings, gate CI, or send notifications.

## Purpose and scope

The proposed event identifies a repository, pull request number, immutable head commit, trace references, and requested review-focus labels. It defines only an input shape. It does not define a GitHub API, credential model, source-chain validation, diff selection, model prompt, output/result contract, runtime, authorization, or operational behavior.

The JSON Schema is [`schema.json`](schema.json); positive and negative shape examples are in [`examples/`](examples/). Schema-valid values are caller-supplied claims, not proof that the repository or pull request exists, that the pull request is open, or that its current head matches `head_sha`.

`review_focus` labels (`CORRECTNESS`, `SECURITY`, `TEST_COVERAGE`, `MAINTAINABILITY`, and `API_CONTRACT`) are proposed request categories only. They do not define analysis methods, severity, findings, recommendations, pass/fail criteria, or a model's authority. Undeclared properties are rejected, including credentials, access tokens, and arbitrary prompt fields.

## Safety boundaries

- A request is not authorization to access GitHub, a repository, a pull request, a fork, or any private content. This proposal performs no network or GitHub operation.
- A valid `head_sha` is a format check only. It is not verified against the pull request or used to select a diff.
- No credential or secret may be included in the event. Future authentication, installation scope, permission levels, and secret-store integration require a reviewed security design.
- Pull-request descriptions, code, comments, commit messages, CI logs, and AI output are untrusted. Embedded instructions cannot change policy, permissions, approval requirements, or workflow state.
- AI output cannot approve or merge a pull request, authorize deployment, change access, or bypass deterministic checks or human approval. This proposal does not define whether or how a future review is presented to a human.
- Posting comments or reviews, creating checks/statuses, changing labels or branches, merging, closing, dispatching workflows, and gating CI are not authorized by this proposal.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-10-11-github-ai-review.md`](../../tests/wf-10-11-github-ai-review.md). Fixtures validate request shape only. GitHub lookup, source-chain membership, authorization, content selection, AI review, result interpretation, publication, and downstream actions are not implemented.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. WF-10 and WF-11 remain one combined roadmap slot in this proposal because the roadmap groups “GitHub integration and AI review” together. Whether they need separate events, ownership, or lifecycle boundaries is open.
2. `request_id`, `plan_id`, and `review_run_id` are caller-provided opaque trace references. Their source, existence, relationship, uniqueness, replay behavior, and retry semantics are not established.
3. Repository owner/name, pull-request number, and `head_sha` are identifiers only. Repository identity, visibility, pull-request state, fork handling, and the relationship between the pull request and SHA require authoritative GitHub-side validation before any future read.
4. The five `review_focus` values are candidate labels. Owners must decide whether to retain, split, or extend them and define review criteria, severity, confidence, and acceptance thresholds.
5. Read scope is undecided: changed files, full repository context, pull-request description, comments, workflow results, dependencies, and generated artifacts may have different authorization and privacy requirements.
6. Base/head comparison rules, treatment of force-pushes and stale requests, pagination/size limits, binary or generated files, and supported pull-request states remain open.
7. GitHub authentication mechanism, app installation boundaries, least-privilege permissions, private/fork access, audit evidence, rate limits, and revocation behavior require security review. No GitHub credential is represented by this event.
8. Model/provider selection, prompt and context construction, data retention/residency, training use, redaction, output validation, failure behavior, and reproducibility are undecided.
9. The result shape, whether findings are advisory or blocking, reviewer identity, comment/check/status publication, deduplication, and any human acknowledgement or approval path are open. This proposal grants no permission to publish or gate.
10. Human approval requirements for downstream actions remain governed by repository policy. AI must not approve its own recommendation; this proposal does not specify a merge or deployment workflow.
11. Slack or other notification destinations, if any, require a separate reviewed scope and are excluded here.

No runtime behavior should be implemented from this proposal until the relevant decisions for the intended slice are reviewed.
