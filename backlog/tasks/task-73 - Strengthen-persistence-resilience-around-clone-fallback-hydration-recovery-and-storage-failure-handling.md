---
id: TASK-73
title: >-
  Strengthen persistence resilience around clone fallback, hydration recovery,
  and storage failure handling
status: To Do
assignee: []
created_date: '2026-03-12 11:52'
labels:
  - remediation
  - persistence
  - testing
milestone: m-11
dependencies:
  - TASK-70
references:
  - .agents/reviews/test-audit-20260312-074448.md
  - .agents/reviews/test-audit-20260312-074935.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-70 persistence audit. Capture the broader resilience gaps that are outside the narrow snapshot-guardrail test slice: fallback clone data-loss behavior when structuredClone is unavailable, workspace-switching save races, storage quota/write-failure recovery, partial hydration integrity, and snapshot-version evolution coverage or migration policy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Persistence tests document or harden clone fallback behavior for non-JSON-safe values when structuredClone is unavailable.
- [ ] #2 Runtime tests cover workspace-switching or dispose/start race conditions so stale saves cannot target the wrong workspace.
- [ ] #3 Persistence/runtime tests cover storage quota or repeated write-failure recovery semantics, including how status clears after a later successful save.
- [ ] #4 Hydration behavior is either made atomic or explicitly guarded and tested so partial store application cannot leave mixed workspace state.
- [ ] #5 Snapshot-version evolution behavior is tested or the validator contract is explicitly documented and enforced for unsupported versions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Regression tests were created for new behaviors
- [ ] #2 Documentation has been created/modified/removed as needed.
- [ ] #3 Documentation changes were approved by the docs-architect (8/10 score required)
- [ ] #4 Test changes were approved by a test gap analysis review
- [ ] #5 Changes to integration points are covered by tests
- [ ] #6 All tests pass successfully
- [ ] #7 Automatic formatting was applied.
- [ ] #8 Linters report no WARNINGS or ERRORS
- [ ] #9 The project builds successfully
<!-- DOD:END -->
