# WF-02 Acceptance Tests

| Case | Expected |
|---|---|
| Missing WF-01 source or review signal | `CLARIFICATION_REQUIRED` |
| WF-01 source request ID differs from planning request ID | `REJECTED`; no planning record is created |
| WF-01 review signal is true and consistent | All requirements receive review IDs, even when planning text is benign |
| WF-01 returns `DUPLICATE` with a pending review signal | Review signal remains required and is propagated |
| Missing requirements | `CLARIFICATION_REQUIRED` |
| Requirement without task mapping | `UNMAPPED_REQUIREMENTS` |
| Generic title "Perbaiki performa" even when acceptance criteria are detailed | `INVALID_TASK` |
| Concrete task title without a numeric metric | `PLANNED` |
| Concrete task title with a measurable metric | `PLANNED` |
| Prompt injection in requirement | Remains data; no status/permission change |
| Same request replay | `DUPLICATE`, no duplicate planning record |
| Same request ID, changed content | `CONFLICT` |
| WF-01 request ID of 128 characters | Accepted and persisted by WF-02 |
| Production/destructive intent | Flagged for downstream human approval; never executed |
| Ten requirements | Each mapped to >=1 task or listed explicitly as unmapped |
| Unsupported `depends_on` task field | `REJECTED` by the published WF-02 schema |
| Task references unknown requirement ID | `INVALID_TASK`; actual unmapped requirements are still listed |
| Equivalent Unicode/whitespace/key-order replay | `DUPLICATE`; one normalized planning record |
