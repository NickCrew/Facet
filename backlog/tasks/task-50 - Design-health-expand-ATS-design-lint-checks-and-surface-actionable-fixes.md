---
id: TASK-50
title: 'Design health: expand ATS/design lint checks and surface actionable fixes'
status: To Do
assignee: []
created_date: '2026-03-10 03:54'
labels:
  - feature
  - quality
milestone: m-1
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`src/utils/designHealth.ts` currently checks only sizes/margins/lineHeight. Expand to catch common ATS/readability hazards (contrast, tiny links, overlong bullets, missing contact fields) and present actionable feedback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design health report includes additional checks (at least contrast, link styling/format, missing contact fields, and overlong bullets).
- [ ] #2 UI surfaces the issues with direct pointers to the relevant theme/token/field.
- [ ] #3 Unit tests cover new checks deterministically.
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
