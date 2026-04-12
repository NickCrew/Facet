---
id: TASK-100
title: Harden IdentityPage failure-path and bulk-flow tests
status: To Do
assignee:
  - '@codex'
created_date: '2026-04-10 18:38'
updated_date: '2026-04-10 22:47'
labels:
  - tests
  - identity
dependencies: []
references:
  - .agents/reviews/test-audit-20260410-143527.md
  - src/test/IdentityPage.test.tsx
  - src/routes/identity/IdentityPage.tsx
  - .agents/reviews/test-audit-20260410-184644.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Close the independent test-audit gaps around IdentityPage error handling, multi-bullet bulk deepening, upload validation, and navigation/export guard behaviors so the page has explicit regression coverage for its external-boundary and batch-operation paths.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 IdentityPage has explicit tests for non-abort scan, draft-generation, and single-bullet deepen failures.
- [ ] #2 IdentityPage has multi-bullet bulk-deepen coverage for success and partial-failure accounting.
- [ ] #3 IdentityPage has regression coverage for invalid uploads, clear-scan reset, enrichment CTA navigation, and export availability guards.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-04-10 quick audit during TASK-101 confirmed the upload-picker regression test is covered and reiterated broader non-blocking gaps for scan errors, draft-generation errors, bullet-deepen errors, paste-only generation, and invalid file-type drops.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Regression tests were created for new behaviors
- [ ] #2 Changes to integration points are covered by tests
- [ ] #3 All tests pass successfully
- [ ] #4 Automatic formatting was applied.
- [ ] #5 Linters report no WARNINGS or ERRORS
- [ ] #6 The project builds successfully
<!-- DOD:END -->
