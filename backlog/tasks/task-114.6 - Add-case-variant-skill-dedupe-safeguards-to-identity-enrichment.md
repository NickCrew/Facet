---
id: TASK-114.6
title: Add case-variant skill dedupe safeguards to identity enrichment
status: To Do
assignee: []
created_date: '2026-04-12 23:48'
labels:
  - identity
  - skill-enrichment
  - data-integrity
dependencies: []
references:
  - src/utils/identityEnrichment.ts
  - src/store/identityStore.ts
parent_task_id: TASK-114
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Protect identity enrichment from case-variant duplicate skill names inside a single group by adding a load/import dedupe or migration path before normalized skill-name matching can touch multiple records.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Case-variant duplicate skills within the same group are detected during load or import.
- [ ] #2 The app either dedupes those records safely or surfaces a repair path before enrichment updates run.
- [ ] #3 Regression coverage documents the chosen behavior.
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
