# AUTRAVA Business Operations UI

A separate internal operations frontend. It is intentionally isolated from the NEXUS AI Engineering Control Plane and the external USA Automotive Parts Export portal.

## Status

- Stage 5: Executive dashboard UI scaffold.
- Stage 6: Operations workspace, approvals and inventory overview interaction patterns.
- Stage 7: Shared UI primitives, responsive shell, light/dark theme.
- Stage 8: Keyboard skip link and focus-visible styling; semantic primary navigation and table metadata; consistent approval filtering and inventory search/count behavior; mobile drawer Escape handling, focus containment/restoration, and background scroll lock.
- CI evidence at `b3be99581221465b547852bda46fba05a1b1fd4d`: TypeScript check and Next.js production build completed successfully. Subsequent Stage 8 commits require a fresh CI run before they can be considered validated.
- Browser/device testing, automated accessibility scanning, device-level testing, automated accessibility scanning, and screen-reader verification remain outstanding. Mobile drawer keyboard behavior is implemented but still requires browser verification.
- Data is illustrative only. No live API, identity provider, database, finance, supplier or logistics integration is connected.
- No transaction, approval, shipment release, payment, compliance clearance or Sharia decision can be executed from this UI.

## Stack

Next.js 15, React 19, TypeScript, CSS design tokens and native accessible controls. Dependencies intentionally match the existing NEXUS app's framework generation without modifying that app or installing a shared monorepo toolchain.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000.

## Build and type checks

```sh
npm run typecheck
npm run build
```

Run these commands in this directory. Results must be recorded against the exact commit SHA; this source-only change has not been runtime-tested by this commit operation.

## Security boundary

Navigation visibility is presentation only. All authentication, tenant scoping, record access, authorization, approval policy, audit persistence and transaction invariants must be enforced by trusted backend services before connecting real data. Keep the UI fail-closed until those contracts and reviewers are approved.
