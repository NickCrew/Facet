---
id: TASK-124
title: Group Facet app navigation into journey-based workspace sections
status: To Do
assignee: []
created_date: '2026-04-14 12:41'
labels:
  - ux
  - navigation
  - app-shell
dependencies: []
references:
  - src/components/AppShell.tsx
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the shared app shell so the main navigation reflects the product journey rather than a flat list of peer routes. The result should make Core, Execution, Output, and utility areas easier to scan and should improve orientation across the product.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The main navigation groups workspaces into product-meaningful sections instead of one undifferentiated list.
- [ ] #2 The active route and active group remain clear across desktop and responsive layouts.
- [ ] #3 The top-level shell exposes clearer route context so users can tell what workspace they are in and how it fits into the larger system.
- [ ] #4 Navigation updates preserve existing route access and keyboard usability.
- [ ] #5 Relevant shell tests and copy are updated, and the slice verifies with typecheck, targeted tests, and build.
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
