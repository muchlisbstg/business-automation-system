# WF-09 — Mobile Quality Assurance (Proposal)

> **Proposal only.** This defines a reviewable request-contract candidate. It does not install or launch an app, connect to a device or emulator, distribute a build, contact application stores or network services, execute tests, persist results, gate CI, or send notifications.

## Purpose and scope

Request mobile-quality checks against a declared non-production application reference, with traceability to a WF-02 request and WF-03 plan. This proposal covers only native iOS and Android targets. It defines no mobile test runner, device farm, build pipeline, app distribution mechanism, API surface, result contract, or runtime behavior.

The JSON Schema is [`schema.json`](schema.json), with positive and negative request-shape examples in [`examples/`](examples/). The proposed event contains:

- `action`: `REQUEST_MOBILE_QA`.
- `request_id`, `plan_id`, and `qa_run_id`: caller-provided trace references. Shape validation does not establish existence, source-chain membership, uniqueness, replay, or retry semantics.
- `target`: a 40- or 64-character hexadecimal `commit_sha`, a safe-format opaque `app_ref`, a platform (`IOS` or `ANDROID`), and a declared environment (`DEVELOPMENT` or `STAGING`). These declarations do not prove the app artifact was built from that commit or that the target is actually non-production.
- `checks`: one or more distinct proposed categories: `INSTALL_LAUNCH`, `FUNCTIONAL_SMOKE`, `ACCESSIBILITY`, `NETWORK_RESILIENCE`, and `PERFORMANCE`. Categories identify requested coverage only; they do not define test cases, thresholds, device coverage, or execution authority.

Undeclared properties are rejected, including credential-like fields. `app_ref` is an opaque logical identifier, not a package URL, binary, signing profile, credential, or authorization grant. The schema does not resolve or verify it.

## Safety boundaries

- A QA request is not permission to access, install, execute, or distribute an application. This proposal implements no device/emulator connection, test execution, network access, artifact download, application-store operation, or result production.
- Production is excluded from the proposed environment values, but the declared environment is only a caller claim. A future implementation needs authoritative target mapping and safeguards against production or other unapproved applications and data.
- No operation that writes business data, changes account state, sends real communications, performs a purchase, or triggers a destructive action is authorized. Test identities, data isolation, cleanup, and any permitted mutation require separate owner and security review.
- App content, accessibility labels, network responses, test data, and AI-generated recommendations are untrusted. They cannot alter identity, permissions, policy, approvals, or workflow state.
- No QA result authorizes a merge, release, deployment, store submission, or production action. No Slack or other notification behavior is in scope.

## Acceptance scenarios

See [`tests/wf-09-mobile-qa.md`](../../tests/wf-09-mobile-qa.md). Fixtures validate request shape only. Source-chain checks, safe artifact resolution, environment verification, device selection, authorization, test execution, and result interpretation are not implemented by this proposal.

## Proposal assumptions and open decisions

These are reviewable assumptions, not current repository behavior:

1. The next roadmap item is WF-09 mobile QA. This proposal limits the candidate to native iOS and Android; web layouts, tablets, wearables, desktop, and other platforms are not included unless owners expand the scope.
2. `DEVELOPMENT` and `STAGING` reuse the repository's existing environment names and are proposed as non-production labels. The authoritative environment source, whether a `PREVIEW` environment is useful, and whether staging contains approved test data remain open.
3. `app_ref` is a non-secret logical alias. Its registry, ownership, platform mapping, artifact resolution, and authorization rules are undefined.
4. The relationship between `commit_sha` and a signed/built application artifact is not established. Owners must decide what immutable build reference, provenance evidence, version, and signing metadata a future request or suite needs.
5. Check categories are proposed names only. Test journeys, expected outcomes, accessibility standard, performance budgets, network conditions, offline behavior, supported OS versions, device models, and pass/fail rules need owner review.
6. The contract does not select simulator/emulator versus physical devices, device-farm providers, locales, screen sizes, orientation, permissions, or a device/OS matrix. The runner and matrix-selection mechanism remain undecided.
7. Authentication, test-account ownership, secret-store integration, least privilege, private-network access, telemetry policy, and approval requirements need a reviewed security design. Secrets must not be added to this event.
8. Whether any tests may create or clean isolated data, trigger external APIs, send SMS/email/push notifications, handle payment-like actions, or mutate app/account state is open. The proposal's default is no such actions.
9. Result states, evidence format (including screenshots, video, logs, and traces), redaction, privacy, retention, severity, retry/idempotency, CI gating, and downstream behavior are undefined.
10. A future implementation must verify that the WF-02 request and WF-03 plan exist and belong to the same chain, and that the resolved artifact is authorized and non-production before any access. Rejection payloads and reason codes remain undecided.

No runtime behavior should be implemented from this proposal until the relevant decisions for the intended slice are reviewed.
