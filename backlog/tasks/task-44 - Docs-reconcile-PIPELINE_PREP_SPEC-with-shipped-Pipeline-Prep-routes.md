---
id: TASK-44
title: 'Docs: reconcile PIPELINE_PREP_SPEC with shipped Pipeline/Prep routes'
status: To Do
assignee: []
created_date: '2026-03-10 03:54'
labels:
  - documentation
milestone: m-9
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`docs/PIPELINE_PREP_SPEC.md` claims the suite is "Ready for implementation" but `src/routes/pipeline` and `src/routes/prep` exist and are shipped. Update spec status and content to reflect current reality and clearly mark remaining gaps as TODOs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spec reflects actual shipped routes and current implementation status (no misleading 'ready for implementation' language).
- [ ] #2 Remaining unimplemented items are explicitly called out as TODO sections or follow-up tasks.
- [ ] #3 Any referenced file paths are verified to exist and be correct.
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
