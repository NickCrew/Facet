---
id: TASK-101
title: Fix identity resume upload button gesture flow
status: Done
assignee: []
created_date: '2026-04-10 22:43'
updated_date: '2026-04-10 22:48'
labels:
  - bug
  - identity
  - ui
dependencies: []
references:
  - src/routes/identity/IdentityPage.tsx
  - src/routes/identity/ExtractionAgentCard.tsx
  - src/test/IdentityPage.test.tsx
  - .agents/reviews/review-20260410-184512.md
  - .agents/reviews/test-audit-20260410-184644.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Upload Resume action on the identity page does not reliably open the file picker. Investigate the user-gesture flow, fix the click handling, and add a focused regression test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Clicking Upload Resume on the identity page opens the hidden PDF file input without relying on deferred gesture timing.
- [x] #2 The identity page keeps switching to upload mode when Upload Resume is clicked from paste mode.
- [x] #3 A focused regression test covers the file-picker trigger behavior.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the deferred upload click from IdentityPage, kept the hidden PDF input mounted in ExtractionAgentCard so paste-mode clicks retain a live target, and tightened IdentityPage coverage to assert the file chooser is triggered immediately. Verification passed with `npx vitest run src/test/IdentityPage.test.tsx`, `npm run typecheck`, and `npm run build`. Independent source review was clean; the quick test audit confirmed the upload-picker regression coverage and pointed broader non-blocking IdentityPage gaps back to TASK-100.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Regression tests were created for new behaviors
- [x] #2 Changes to integration points are covered by tests
- [x] #3 All tests pass successfully
- [x] #4 Automatic formatting was applied.
- [x] #5 Linters report no WARNINGS or ERRORS
- [x] #6 The project builds successfully
<!-- DOD:END -->
