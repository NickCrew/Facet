---
id: TASK-127
title: Reduce Build workspace chrome and emphasize the active working context
status: To Do
assignee: []
created_date: '2026-04-14 12:41'
labels:
  - ux
  - build
  - workspace-shell
dependencies: []
references:
  - src/routes/build/BuildPage.tsx
  - src/routes/build/build.css
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refine the Build workspace shell so the page establishes a stronger sense of current working context and one dominant action, without overwhelming users with multiple competing control planes. Advanced controls should still be available, but they should not crowd the primary resume-building task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Build workspace header clearly communicates purpose, current working context, and one dominant primary action.
- [ ] #2 High-frequency controls remain accessible while lower-frequency file, preset, or utility actions are visually demoted.
- [ ] #3 The active vector or working context is easier to understand without scanning multiple separate controls.
- [ ] #4 The resulting page feels more like a resume workspace and less like an expert control panel, while preserving existing capabilities.
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
