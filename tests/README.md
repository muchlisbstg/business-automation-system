# Tests

Tests are deterministic and run in CI.

Quality gates should cover unit, integration, API contract, authorization, database, frontend accessibility/performance, mobile behavior, security scanning, and deployment health as applicable.

A failed gate must produce an auditable result and must not be silently overridden by AI output.

The [WF-05 Figma handoff proposal scenarios](wf-05-figma-handoff.md), [WF-06 frontend QA proposal scenarios](wf-06-frontend-qa.md), [WF-07 API QA proposal scenarios](wf-07-api-qa.md), [WF-08 Database QA proposal scenarios](wf-08-database-qa.md), [WF-09 Mobile QA proposal scenarios](wf-09-mobile-qa.md), and [WF-10/11 GitHub integration and AI review proposal scenarios](wf-10-11-github-ai-review.md) distinguish schema-checked examples from semantic behavior and decisions that remain open.


The [WF-12 Tests and coverage proposal scenarios](wf-12-tests.md) distinguish schema-checked request shape from test execution, coverage semantics, result handling, and gating decisions that remain open.


The [WF-13 Security findings proposal scenarios](wf-13-security-findings.md) distinguish schema-checked report shape from scanner execution, report verification, finding lifecycle, and CI-gating decisions that remain open.
