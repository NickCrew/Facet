---
id: TASK-115.3
title: Expand strategy workbench regression coverage
status: To Do
assignee: []
created_date: '2026-04-14 01:06'
labels:
  - identity
  - strategy
  - tests
dependencies: []
parent_task_id: TASK-115
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add focused regression coverage for strategy workbench CRUD flows, manual fill behavior, AI generation error handling, and export/keyboard paths called out by the audit after the autofill and guidance upgrade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Strategy workbench tests cover matching, vectors, awareness, and accuracy-rule CRUD flows
- [ ] #2 Manual Fill Empty Fields behavior and generation error handling are covered
- [ ] #3 Export and tab keyboard navigation paths have direct regression coverage
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
