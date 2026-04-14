---
id: TASK-126
title: Clarify Pipeline workspace actions and empty-state hierarchy
status: To Do
assignee: []
created_date: '2026-04-14 12:41'
labels:
  - ux
  - pipeline
  - workspace-shell
dependencies: []
references:
  - src/routes/pipeline/PipelinePage.tsx
  - src/routes/pipeline/PipelineDetail.tsx
  - src/routes/pipeline/pipeline.css
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tighten the Pipeline workspace so the default path is obvious in both empty and populated states. The redesign should reduce competing primary actions, make research and execution actions easier to parse, and keep utility actions in a secondary role.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Pipeline header exposes one dominant primary action and a clearer secondary utility pattern.
- [ ] #2 The Pipeline empty state recommends a single best starting path while still preserving alternative capture flows.
- [ ] #3 Entry detail actions are grouped by intent so research, execution, and management actions are easier to scan.
- [ ] #4 The redesigned workspace preserves existing pipeline functionality while making the main workflow easier to understand.
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
