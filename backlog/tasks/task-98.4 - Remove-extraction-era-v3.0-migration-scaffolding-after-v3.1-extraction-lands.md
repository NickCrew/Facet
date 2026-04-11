---
id: TASK-98.4
title: Remove extraction-era v3.0 migration scaffolding after v3.1 extraction lands
status: To Do
assignee: []
created_date: '2026-04-09 23:45'
updated_date: '2026-04-10 15:57'
labels:
  - refactor
  - identity
  - v3-1
  - cleanup
milestone: m-15
dependencies:
  - TASK-98
documentation:
  - /Users/nick/Developer/Facet/src/identity/schema.ts
parent_task_id: TASK-98
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After Milestone 2 is verified, delete the pre-launch migration helpers that only exist to convert v3 extraction output into v3.1.

This includes schema revision scaffolding, role_fit compatibility paths, derived depth/matching helpers, and related parser branches that should no longer be reachable once extraction emits native v3.1 data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Schema import no longer carries extraction-only migration helpers once native v3.1 extraction is verified.
- [ ] #2 role_fit, schema revision compatibility, and derived helper code are removed or unreachable in the schema parser.
- [ ] #3 Fixtures/tests no longer depend on migration-only fields such as role_fit or proficiency.
- [ ] #4 Focused schema and extraction validation passes after cleanup.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify native extraction and import pass without migration warnings.
2. Remove schema revision and role_fit compatibility code from src/identity/schema.ts.
3. Remove proficiency-to-depth and other migration helpers that no longer serve any live input.
4. Update fixtures/tests to reflect the cleaned v3.1-only contract.
<!-- SECTION:PLAN:END -->

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
