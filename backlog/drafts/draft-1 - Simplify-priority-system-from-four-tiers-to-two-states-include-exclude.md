---
id: DRAFT-1
title: Simplify priority system from four tiers to two states (include/exclude)
status: Draft
assignee: []
created_date: '2026-03-10 19:14'
updated_date: '2026-03-10 19:16'
labels:
  - refactor
  - ux-simplification
dependencies: []
references:
  - src/types.ts
  - src/engine/assembler.ts
  - src/engine/pageBudget.ts
  - src/engine/serializer.ts
  - src/store/resumeStore.ts
  - src/store/defaultData.ts
  - src/components/BulletList.tsx
  - src/components/ComponentCard.tsx
  - src/components/VectorPriorityEditor.tsx
  - src/utils/vectorPriority.ts
  - src/utils/skillGroupVectors.ts
  - src/index.css
documentation:
  - backlog/docs/doc-2 - Plan--Simplify-Priority-System-to-Include-Exclude.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reduce the resume builder's priority system from four tiers (must/strong/optional/exclude) to two binary states (included/excluded per vector). Drag-and-drop ordering already expresses importance, making the four-tier system redundant cognitive load. The page budget trimmer should simply drop bullets from the bottom of the ordered list.
<!-- SECTION:DESCRIPTION:END -->

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



## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ComponentPriority type reduced to 'include' | 'exclude' only
- [ ] #2 PriorityByVector maps use 'include' instead of must/strong/optional
- [ ] #3 Page budget trimmer drops bullets from bottom of ordered list (no priority-based filtering)
- [ ] #4 must_over_budget warning system removed entirely
- [ ] #5 Assembled types no longer carry a priority field
- [ ] #6 Matrix dots toggle between include/exclude (no 4-state cycling)
- [ ] #7 priority-quick-toggle button removed from component cards
- [ ] #8 VectorPriorityEditor uses toggle/checkbox instead of 4-option dropdown
- [ ] #9 localStorage migration v6 converts must/strong/optional to include
- [ ] #10 Serializer import normalizes legacy must/strong/optional values to include
- [ ] #11 JD Analyzer recommendations use include/exclude only
- [ ] #12 All existing tests updated and passing
<!-- AC:END -->
