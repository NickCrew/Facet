---
id: TASK-58
title: 'Lint: remove explicit-any debt in core stores, routes, and tests'
status: To Do
assignee: []
created_date: '2026-03-10 21:41'
labels:
  - lint
  - typescript
  - core
milestone: m-1
dependencies: []
references:
  - /Users/nferguson/Developer/resume-builder/src/store/resumeStore.ts
  - >-
    /Users/nferguson/Developer/resume-builder/src/test/serializerValidation.test.ts
  - /Users/nferguson/Developer/resume-builder/src/utils/jdAnalyzer.ts
  - /Users/nferguson/Developer/resume-builder/src/hooks/useSuggestionActions.ts
  - /Users/nferguson/Developer/resume-builder/src/routes/build/BuildPage.tsx
  - /Users/nferguson/Developer/resume-builder/src/components/Tour.tsx
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Burn down the largest eslint bucket by replacing or narrowing explicit any usage in the core migration/store code, route helpers, parser utilities, and serializer validation tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Explicit-any lint failures are removed from resumeStore, serializerValidation tests, jdAnalyzer, useSuggestionActions, BuildPage, and Tour.
- [ ] #2 Types are narrowed intentionally rather than replaced with broad aliases that preserve the same ambiguity.
- [ ] #3 Validation includes repo-wide eslint and targeted typecheck/test coverage for touched files.
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
