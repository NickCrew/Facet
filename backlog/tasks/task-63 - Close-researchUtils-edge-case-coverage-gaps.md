---
id: TASK-63
title: Close researchUtils edge-case coverage gaps
status: To Do
assignee: []
created_date: '2026-03-11 04:02'
labels:
  - test-gap
  - research
milestone: m-4
dependencies: []
references:
  - .agents/reviews/test-audit-20260310-235950.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from researchUtils audit to close remaining immutability and boundary-case gaps in the extracted Research helpers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 researchUtils tests cover non-mutating behavior for upsertVectorConfig and groupByTier empty/out-of-range inputs.
- [ ] #2 researchUtils tests cover normalizeMaxResults float parsing, toPipelineTier negative/zero inputs, and createPipelineEntryDraft multi-risk joins.
- [ ] #3 Tag helper tests cover single-value and whitespace-only cases, and joinTags covers empty-array behavior.
- [ ] #4 Targeted research utility tests, typecheck, and targeted eslint pass after the additions.
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
