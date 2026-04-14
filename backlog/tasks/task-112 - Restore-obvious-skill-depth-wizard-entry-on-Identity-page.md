---
id: TASK-112
title: Restore obvious skill depth wizard entry on Identity page
status: In Progress
assignee: []
created_date: '2026-04-12 14:25'
labels:
  - bug
  - identity
  - frontend
  - ux
dependencies: []
references:
  - /Users/nick/Developer/Facet/src/routes/identity/IdentityPage.tsx
  - /Users/nick/Developer/Facet/src/test/IdentityPage.test.tsx
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the Identity page keep a visible, recognizable entry point back into the skill depth wizard even when a draft is present.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Identity page shows a visible skill enrichment entry whenever there is a current identity with enrichable skills, even if a draft also exists.
- [ ] #2 The CTA copy makes it clear that the route leads to the skill depth wizard.
- [ ] #3 Relevant Identity page tests, typecheck, and build pass.
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
