---
id: TASK-62
title: Harden ResearchPage form and state coverage
status: To Do
assignee: []
created_date: '2026-03-11 04:02'
labels:
  - test-gap
  - research
milestone: m-4
dependencies: []
references:
  - .agents/reviews/test-audit-20260310-235952.md
  - .agents/reviews/review-20260310-235018.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from ResearchPage audit to close remaining form/state coverage gaps after TASK-61 implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Search launcher field bindings are covered by tests, including company size override, salary anchor, custom keywords, geo expand, and tier max inputs.
- [ ] #2 Profile editor bindings are covered by tests for constraints, filters, interview prefs, vector config edits, and skill depth changes.
- [ ] #3 Result-view state edge cases are covered by tests, including invalid-tier pipeline guard, activeRunId resync, requestDraft resync, and empty log/tier display states.
- [ ] #4 Targeted research tests, typecheck, and targeted eslint pass after the added coverage.
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
