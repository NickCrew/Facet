---
id: TASK-74
title: Expand EducationList drag-and-drop and accessibility coverage
status: To Do
assignee: []
created_date: '2026-03-12 13:04'
labels:
  - remediation
  - testing
  - accessibility
dependencies: []
references:
  - .agents/reviews/test-audit-20260312-082650.md
  - .agents/reviews/education-fix-audit-ui-codex/test-audit-20260312-085724.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the education-preview fix audit. The education section now renders correctly and supports manual include/exclude overrides without vector priorities, but the EducationList tests still do not exercise reorder success/guard paths or the live-region drag announcements. Capture that remaining DnD/accessibility coverage here instead of stretching the preview fix further.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 EducationList tests cover successful reordering and the guard paths for no-target, same-target, and unknown-id drag end events.
- [ ] #2 EducationList tests verify the drag lifecycle announcements and drag-handle accessibility wiring.
- [ ] #3 EducationList tests cover multi-entry rendering and the empty-list boundary without regressing the manual include/exclude override behavior.
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
