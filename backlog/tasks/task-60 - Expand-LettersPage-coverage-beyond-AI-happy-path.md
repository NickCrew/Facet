---
id: TASK-60
title: Expand LettersPage coverage beyond AI happy path
status: To Do
assignee: []
created_date: '2026-03-10 21:50'
labels:
  - letters
  - tests
  - quality
dependencies: []
references:
  - /Users/nferguson/Developer/resume-builder/src/routes/letters/LettersPage.tsx
  - /Users/nferguson/Developer/resume-builder/src/test/LettersPage.test.tsx
  - >-
    /Users/nferguson/Developer/resume-builder/.agents/reviews/test-audit-20260310-172211.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The formal test audit for the Letters route identified significant uncovered behaviors outside the shipped AI happy path: template CRUD, manual paragraph editing, validation branches, pipeline-entry selection state, and empty/error states. Track these as a focused follow-up instead of keeping them hidden inside the AI generation task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 LettersPage tests cover template create/select/delete flows.
- [ ] #2 LettersPage tests cover AI validation and error branches, including missing endpoint, missing JD, and API failure.
- [ ] #3 LettersPage tests cover pipeline-entry selection state and empty-state rendering.
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
