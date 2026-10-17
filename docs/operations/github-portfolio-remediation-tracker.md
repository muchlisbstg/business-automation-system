# GitHub Portfolio Remediation Tracker

**Snapshot:** 2026-10-17  
**Scope:** 27 repositories visible to the connected GitHub account `muchlisbstg`.  
**Safety boundary:** no merge, deployment, repository visibility change, or production mutation is authorized by this tracker.

## Status key

- **Open PR** — corrective change exists on a separate branch and requires CI/review.
- **Owner action** — requires a repository owner to configure credentials, inspect account settings, or verify external data.
- **Backlog** — requires a scoped implementation and tests before it can be represented as complete.
- **Evidence pending** — source data or controls have not been independently verified.

## Priority work in progress

| Repository | Verified issue / scope | Current action | Acceptance gate |
|---|---|---|---|
| [business-automation-system](https://github.com/muchlisbstg/business-automation-system) | Notion registry sync fails when required Actions configuration is absent. | [PR #86 — operator runbook](https://github.com/muchlisbstg/business-automation-system/pull/86) | Required settings are configured by an authorized owner; manual sync completes and target rows are checked. |
| [enterprise-export-platform-usa](https://github.com/muchlisbstg/enterprise-export-platform-usa) | Planning scaffold, not a production ERP or certified/compliant product. | Backlog: module implementation, SSO/RBAC integration tests, audit evidence. | Module-specific acceptance tests pass; security and regulatory claims remain evidence-based. |
| [Full-stack-product-development](https://github.com/muchlisbstg/Full-stack-product-development) | Local-first Switchboard application; provider URL allowlist exists. | Backlog: verify provider/network boundary tests and portfolio scope. | URL allowlist and provider error cases pass tests; no production readiness claim without deployment controls. |
| [export-client-web-sync](https://github.com/muchlisbstg/export-client-web-sync) | Public RFQ intake is intentional; auth/admin session endpoints exist. Need verify protected operations and data minimization rather than require login on every public route. | Backlog: maintain route-access matrix and negative tests. | Public, customer, admin, and peer-sync permissions are tested separately. |
| [export-client-mobile-sync](https://github.com/muchlisbstg/export-client-mobile-sync) | CI typecheck reports many React Native `StyleProp<TextStyle/ViewStyle>` errors. | [PR #53 — TypeScript compatibility investigation](https://github.com/muchlisbstg/export-client-mobile-sync/pull/53) | Typecheck, tests, Expo compatibility, Android bundle, and interoperability all pass. The current compiler-pin attempt has **not** resolved typecheck and must not be treated as complete. |
| [export-client-desktop-sync](https://github.com/muchlisbstg/export-client-desktop-sync) | Dependabot PRs #47 and #50 fail dependency resolution against the current Electron/Vite toolchain. | [PR #52 — hold incompatible Vite major updates](https://github.com/muchlisbstg/export-client-desktop-sync/pull/52) | Dependabot policy CI passes; existing dependency PRs remain unmerged until compatibility is demonstrated. |
| [export-industry-platform](https://github.com/muchlisbstg/export-industry-platform) | Catalog had 18 entries while the account has 20 sector repositories. | [PR #20 — 20-sector catalog](https://github.com/muchlisbstg/export-industry-platform/pull/20) | CI passes; 20 catalog entries, 18 active screening slices, and 2 clearly labeled catalog-only sectors. |

## Sector repository register

The following 20 repositories form the sector portfolio. A successful CI run is not proof of current trade data, market access, legal clearance, product availability, or regulatory compliance. Eighteen source registers still require independent revalidation; two use the registry's `directly_reviewed` status, which itself is not a legal or regulatory approval.

| Repository | Current remediation focus |
|---|---|
| [usa-automotive-parts-export](https://github.com/muchlisbstg/usa-automotive-parts-export) | Evidence source freshness, SKU/HS classification boundaries, destination-specific controls. |
| [usa-soybeans-export](https://github.com/muchlisbstg/usa-soybeans-export) | Keep forecasts distinct from realized trade; validate source dates and destination caveats. |
| [usa-medical-devices-export](https://github.com/muchlisbstg/usa-medical-devices-export) | Device classification, intended use, destination regulator requirements, source review. |
| [europe-automotive-components-export](https://github.com/muchlisbstg/europe-automotive-components-export) | Product scope, customs classification caveats, official source review. |
| [europe-olive-oil-export](https://github.com/muchlisbstg/europe-olive-oil-export) | Food-grade scope, destination controls, evidence freshness. |
| [europe-pharmaceuticals-export](https://github.com/muchlisbstg/europe-pharmaceuticals-export) | Product scope and destination-specific authorization boundaries. |
| [europe-medical-devices-export](https://github.com/muchlisbstg/europe-medical-devices-export) | Device intended use, exclusions, official regulatory evidence. |
| [australia-beef-export](https://github.com/muchlisbstg/australia-beef-export) | Product form, origin, destination, and animal-product controls. |
| [australia-wheat-export](https://github.com/muchlisbstg/australia-wheat-export) | Distinguish food/processing from stockfeed routes and forecast vs historical values. |
| [australia-seafood-export](https://github.com/muchlisbstg/australia-seafood-export) | Species/product scope and destination controls. |
| [asia-semiconductors-export](https://github.com/muchlisbstg/asia-semiconductors-export) | Distinguish components from manufacturing equipment and controlled goods. |
| [asia-apparel-textiles-export](https://github.com/muchlisbstg/asia-apparel-textiles-export) | Fiber/garment scope, labeling evidence, destination requirements. |
| [asia-rice-export](https://github.com/muchlisbstg/asia-rice-export) | Revalidate inherited source register and SKU/destination caveats. |
| [asia-palm-oil-export](https://github.com/muchlisbstg/asia-palm-oil-export) | Food/industrial form exclusions and destination evidence. |
| [africa-coffee-export](https://github.com/muchlisbstg/africa-coffee-export) | Separate historical statistics from forecasts and verify source dates. |
| [africa-cocoa-export](https://github.com/muchlisbstg/africa-cocoa-export) | Product form, sugar/additive exclusions, and source evidence. |
| [africa-cashew-export](https://github.com/muchlisbstg/africa-cashew-export) | Raw/in-shell vs processed forms and route evidence. |
| [africa-cut-flowers-export](https://github.com/muchlisbstg/africa-cut-flowers-export) | Fresh-cut scope, plant-health controls, and source freshness. |
| [canada-pulse-crops-export](https://github.com/muchlisbstg/canada-pulse-crops-export) | Revalidate sources and prepare a dedicated platform screening slice before enabling screening. |
| [mexico-avocados-export](https://github.com/muchlisbstg/mexico-avocados-export) | [PR #4](https://github.com/muchlisbstg/mexico-avocados-export/pull/4) revalidates the two CLA rows due 2026-10-17 and adds the 2026-10-07 STPS bulletin; dedicated platform screening slice remains pending. |

## Cross-repository acceptance gates

1. **Inventory:** repository, default branch, visibility, archive status, last commit, open PRs, and CI run are recorded from GitHub.
2. **Code:** inspect authentication, authorization, input validation, secrets handling, database access, network boundaries, and dependency changes.
3. **Tests:** require a green CI run on the current PR head, not merely an earlier main-branch run.
4. **Integration:** verify API contracts and the web/mobile/desktop sync flow with idempotency, conflict, and failure-retry tests.
5. **Evidence:** record source URL, access date, effective period, review owner, and caveats. Never convert `cited_not_independently_revalidated` into a verified status without an actual source review.
6. **Governance:** changes remain on branches/PRs; require formal review and checks before merge. Production deployment and destructive actions require separate human approval.

## External owner actions that cannot be performed by source-code commits

- Configure `GH_REPO_READ_TOKEN`, `NOTION_API_KEY`, and `NOTION_DATABASE_ID` in GitHub Actions settings and share the Notion database with the integration.
- Confirm repository branch protection/rulesets and audit-log evidence where the GitHub connection returns 403.
- Independently verify the due Mexico Avocados sources and the 18 sector registries not independently revalidated.
- Approve any PR or production rollout after the corresponding CI and review gates pass.

This tracker is a work-control document, not a statement that all 27 repositories are production-ready.
