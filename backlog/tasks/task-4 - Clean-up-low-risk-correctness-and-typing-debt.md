---
id: TASK-4
title: Clean up low-risk correctness and typing debt
status: To Do
assignee: []
created_date: '2026-02-28 05:46'
labels:
  - remediation
  - refactor
dependencies: []
references:
  - .agents/reviews/review-20260227-175002.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review notes a few minor correctness/maintainability items that are safe to batch: stronger createId fallback entropy and shared typing for add-component payloads.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AddComponentPayload type is defined once and reused
- [ ] #2 createId fallback has stronger uniqueness properties
- [ ] #3 No behavioral regressions in component creation flows
- [ ] #4 Verification commands pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract AddComponentPayload into shared type used by App and ComponentLibrary.
2. Improve createId fallback entropy/collision resistance for non-randomUUID environments.
3. Keep behavior identical and rerun lint/typecheck/test/build.
<!-- SECTION:PLAN:END -->
