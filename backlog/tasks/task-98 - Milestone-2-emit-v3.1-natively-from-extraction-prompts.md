---
id: TASK-98
title: 'Milestone 2: emit v3.1 natively from extraction prompts'
status: In Progress
assignee:
  - codex
created_date: '2026-04-09 23:44'
updated_date: '2026-04-10 18:07'
labels:
  - feature
  - identity
  - extraction
  - v3-1
milestone: m-15
dependencies: []
documentation:
  - /Users/nick/Developer/Facet/src/utils/identityExtraction.ts
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement Milestone 2 of the v3.1 rollout in the extraction layer.

Scope:
- update extraction prompts in src/utils/identityExtraction.ts to emit Professional Identity Schema v3.1 natively
- update bullet deepening prompt version reference to v3.1
- normalize new v3.1 fields in parse/repair flow
- add regression tests proving fresh extraction imports without migration warnings
- defer migration-helper deletion to a follow-on cleanup task after verification

This milestone should leave fresh extractions aligned with the shipped v3.1 schema and the enrichment wizard contract.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 EXTRACTION_SYSTEM_PROMPT emits the v3.1 shape and no longer asks for preferences.role_fit.
- [ ] #2 BULLET_DEEPENING_SYSTEM_PROMPT references Professional Identity Schema v3.1.
- [ ] #3 normalizeExtractedIdentityCandidate repairs/defaults v3.1 fields and drops legacy role_fit output.
- [ ] #4 Focused extraction tests prove a fresh extraction imports cleanly as v3.1 without migration warnings.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Execute Milestone 2 as sequential atomic loops with the first slice combining TASK-98.1 and TASK-98.2 because the importer currently hard-requires preferences.role_fit and would reject a prompt-only native v3.1 payload.
Loop 1 touches src/utils/identityExtraction.ts and src/test/identityExtraction.test.ts to update the extraction prompt and normalize native v3.1 extraction fields together while preserving schema cleanup for TASK-98.4.
After Loop 1, run focused validation, request independent code review and test audit per agent-loops, and commit only touched files with cortex git commit before proceeding to the remaining regression/cleanup work.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Approved implementation sequence with user: start on TASK-98.1 prompt contract, then continue through normalization, regression tests, and cleanup in atomic loops.

Adjusted execution plan with user approval: combine TASK-98.1 and TASK-98.2 into the first atomic slice because prompt-only v3.1 output would currently fail schema import.

Progress checkpoint:
- Updated extraction prompts to target Professional Identity Schema v3.1 and documented matching/search_vectors/awareness defaults.
- Added extraction-layer normalization for schema_revision, preferences defaults, matching fallback from legacy role_fit, and native v3.1 import compatibility.
- Updated schema import compatibility for schema_revision 3.1 documents and expanded focused extraction coverage to 28 tests.
- Validation receipts on current working tree: npx vitest run src/test/identityExtraction.test.ts, npm run typecheck, npm run build all pass.
- Remaining blocker before commit: latest independent review still flags partial matching-row normalization and malformed search_vectors/awareness entry sanitization.
<!-- SECTION:NOTES:END -->

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
