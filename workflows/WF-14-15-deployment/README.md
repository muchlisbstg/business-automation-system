# WF-14/15 — Deployment Gates and Deployment (Proposal)

> **Proposal only.** This document proposes a candidate request shape for owner review. It does not evaluate gates, authorize an approver, build or resolve an artifact, deploy to any environment, persist a deployment, or send notifications.

## Purpose and scope

The roadmap places **WF-14/15 Deployment gates and deployment** after WF-13. No WF-14/15 contract, runtime, or issue exists on `main`. The repository baseline says production deployment requires explicit human approval and that build, test, security scanning, and deployment run in CI or cloud infrastructure. Those statements do not define deployable inputs, gate policy, approval evidence, or runtime behavior.

This proposal offers one candidate `REQUEST_DEPLOYMENT` event for discussion. It does not decide whether WF-14 gates and WF-15 deployment should share an event or have separate contracts. The JSON Schema is [`schema.json`](schema.json), with synthetic shape fixtures in [`examples/`](examples/).

The candidate event contains:

- `action`, `request_id`, `plan_id`, and `deployment_id`: candidate vocabulary and caller-supplied opaque references. Their issuer, source-chain membership, uniqueness, replay behavior, and retry semantics are not checked.
- `source`: a declared repository owner/name and 40- or 64-character hexadecimal commit SHA. These are unverified identifiers; no repository, commit, branch, or authorization lookup occurs.
- `artifact_ref`: an opaque string. Its format, immutability, provenance, integrity, and relationship to `source` are not established.
- `target.service_id`: a candidate opaque service identifier with no registry or resolution rule defined.
- `target.environment`: one of the repository's existing environment labels, `dev`, `staging`, or `prod`. This shape does not authorize a target or change the approval rule for production.

The schema rejects undeclared fields, including credential-like fields and arbitrary commands. It cannot detect secrets or sensitive data embedded inside an allowed string. Fixtures use synthetic references only.

## Safety boundaries

- No deployment system, cloud account, repository, artifact store, network, or environment is accessed; no code is built or executed and no deployment occurs.
- A schema-valid event is not a deployment instruction, gate result, approval, permission grant, or evidence that a gate passed.
- The existing repository rule remains: production deployment requires explicit human approval. This proposal defines no identity source, approval record, authority, or approval lifecycle and cannot satisfy that rule.
- No credential, secret, arbitrary command, runner configuration, or prompt override is represented in the event. Source, artifact, target, and any future build output are untrusted claims until a separately reviewed design defines verification.
- No gate is evaluated or bypassed. AI-generated recommendations cannot change deterministic policy or required human approval.
- Rollout, health checks, rollback, persistence, audit behavior, and downstream side effects are not implemented or authorized.
- Slack and all other notifications are out of scope.

## Acceptance scenarios

See [`tests/wf-14-15-deployment.md`](../../tests/wf-14-15-deployment.md). Fixtures check candidate JSON shape only. They do not establish source/artifact correspondence, gate outcomes, approval, target authorization, or deployment behavior.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The roadmap's combined WF-14/15 slot is represented here by one candidate request envelope only to make the boundary reviewable. Decide whether gates (WF-14) and deployment (WF-15) need separate contracts, owners, authorization boundaries, and lifecycles.
2. `REQUEST_DEPLOYMENT` is a candidate action label, not an approved operation. Decide whether clients should submit an intent, an approval request, a gate-evaluation request, a deploy command, or distinct event types.
3. `request_id`, `plan_id`, and `deployment_id` are opaque placeholders. Decide their trusted source, source-chain checks, identity and uniqueness scope, idempotency key, replay/conflict behavior, and retry rules.
4. Repository plus commit SHA is a candidate source reference. Decide supported source providers, fork/branch policy, provenance, immutable revision requirements, authorization, and how a selected artifact is proven to originate from that source.
5. `artifact_ref` deliberately has no provider-specific syntax. Decide artifact types and canonical immutable identity (for example, digest versus tag), signing/attestation and verification, build provenance, retention, and whether artifact resolution belongs to this workflow.
6. `service_id` and the three environment labels are shape-level candidates. Decide service/target registry, account/region/cluster topology, environment mapping, tenancy, eligibility, and who may request a deployment. The schema cannot validate or authorize a target.
7. The baseline requires explicit human approval for production, but the approval mechanism, eligible approvers, separation of duties, quorum, evidence, freshness, expiry, revocation, and audit record are undefined. Decide whether staging or other environments also require approval. No runtime may infer approval from this request.
8. No WF-05 through WF-13 check is currently a deployment gate. Decide the required gate set, evidence source and freshness, advisory versus blocking outcomes, handling of skipped/partial/stale/failed checks, exceptions, and any branch-protection relationship.
9. Build/deploy providers, runner isolation, least-privilege identities, secrets access, network egress, infrastructure-as-code boundaries, concurrency, timeouts, and supply-chain controls are unspecified. Decide these before authorizing any execution.
10. Rollout strategy, traffic shifting, health signals, success criteria, cancellation, failure handling, rollback/roll-forward, and the safety of database or other irreversible changes are undefined.
11. Result schema, state transitions, persistence, append-only audit evidence, observability, log redaction/retention, delivery guarantees, idempotency, and recovery after partial side effects are open.
12. CI integration and the authority to block a merge, release, or later deployment are undecided. Production approval and deterministic repository policy remain authoritative; no AI or workflow event may bypass them.
13. No notification destination is defined. Slack and all other notifications remain out of scope.

No runtime behavior should be implemented from this proposal until the decisions relevant to the intended slice are reviewed.
