---
id: TASK-56
title: 'Lint: exclude generated coverage artifacts from eslint'
status: To Do
assignee: []
created_date: '2026-03-10 21:41'
labels:
  - lint
  - tooling
  - repo-health
milestone: m-1
dependencies: []
references:
  - /Users/nferguson/Developer/resume-builder/coverage/block-navigation.js
  - /Users/nferguson/Developer/resume-builder/coverage/prettify.js
  - /Users/nferguson/Developer/resume-builder/coverage/sorter.js
  - /Users/nferguson/Developer/resume-builder/eslint.config.js
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repo-wide eslint is currently picking up generated files under coverage/, which creates warning noise unrelated to source quality. Update lint config or ignore rules so generated coverage assets are excluded from the lint surface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Repo-wide eslint no longer reports findings from generated files under coverage/.
- [ ] #2 Lint configuration documents or clearly encodes why generated artifacts are excluded.
- [ ] #3 Validation includes a repo-wide eslint run showing coverage/* warnings are gone.
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
