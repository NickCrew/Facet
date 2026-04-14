---
id: TASK-114.4
title: >-
  Expand skill enrichment wizard regression coverage for navigation and
  validation flows
status: To Do
assignee: []
created_date: '2026-04-12 23:13'
labels:
  - identity
  - skill-enrichment
  - tests
dependencies: []
references:
  - src/routes/identity/IdentityEnrichmentSkillPage.tsx
  - src/test/IdentityEnrichmentSkillPage.test.tsx
  - .agents/reviews/test-audit-20260412-190953.md
parent_task_id: TASK-114
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cover the remaining high-signal wizard behaviors called out by the independent test audit: required-depth validation, skip flow, dirty-navigation confirms, back-to-overview confirms, and cleanup/abort handling for in-flight AI requests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The wizard test suite covers save validation when depth is missing.
- [ ] #2 The wizard test suite covers skip behavior and disabled skip state for complete skills.
- [ ] #3 The wizard test suite covers dirty-confirmation behavior for next/previous navigation and back-to-overview.
- [ ] #4 The wizard test suite covers unmount or route-change cleanup for in-flight AI requests.
- [ ] #5 Targeted wizard tests pass after the new coverage is added.
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
