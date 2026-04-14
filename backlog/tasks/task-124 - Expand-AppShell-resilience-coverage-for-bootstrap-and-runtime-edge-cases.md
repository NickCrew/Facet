---
id: TASK-124
title: Expand AppShell resilience coverage for bootstrap and runtime edge cases
status: To Do
assignee: []
created_date: '2026-04-14 14:40'
labels:
  - testing
  - app-shell
dependencies: []
references:
  - .agents/reviews/test-audit-20260414-103737.md
  - src/components/AppShell.tsx
  - src/test/AppShell.test.tsx
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow up on the TASK-123.5 AppShell audit with the remaining resilience-oriented coverage gaps: local snapshot capture rejection, replacePersistenceRuntime outer rejection, document-root theme application, system-theme matchMedia behavior, normal workspace switching, create-empty-workspace onboarding, hydration gating, and cleanup/disposal behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AppShell tests cover local snapshot capture and replacePersistenceRuntime rejection paths without crashing the shell.
- [ ] #2 Theme application and system-theme matchMedia behavior are asserted at the document-root level.
- [ ] #3 Normal workspace switching, empty-workspace onboarding, and hydration gating are covered.
- [ ] #4 Remaining cleanup or keyboard-accessibility gaps are either covered or explicitly deferred with notes.
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
