---
id: TASK-125
title: Reframe the Research workspace around search readiness and one primary action
status: To Do
assignee: []
created_date: '2026-04-14 12:41'
labels:
  - ux
  - research
  - workspace-shell
dependencies: []
references:
  - src/routes/research/ResearchPage.tsx
  - src/routes/research/research.css
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Redesign the Research workspace shell so users immediately understand the source of the search profile, the state of search readiness, and the next recommended action. The workspace should feel like a guided search surface rather than three equal peer modes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Research workspace header clearly states the workspace purpose, current profile source or readiness, and one dominant primary action.
- [ ] #2 The page structure makes search the primary workflow while still supporting profile review and results inspection.
- [ ] #3 Fallback or stale-profile states are explained clearly without overwhelming the main search flow.
- [ ] #4 Secondary actions are visually demoted so they do not compete with the main search launch action.
- [ ] #5 Relevant tests and copy are updated, and the slice verifies with typecheck, targeted tests, and build.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Regression tests were created for new behaviors
- [ ] #2 Changes to integration points are covered by tests
- [ ] #3 All tests pass successfully
- [ ] #4 Automatic formatting was applied.
- [ ] #5 Linters report no WARNINGS or ERRORS
- [ ] #6 The project builds successfully
<!-- DOD:END -->
