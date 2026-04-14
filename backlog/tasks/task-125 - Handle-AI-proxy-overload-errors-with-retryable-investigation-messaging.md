---
id: TASK-125
title: Handle AI proxy overload errors with retryable investigation messaging
status: Done
assignee: []
created_date: '2026-04-14 16:12'
updated_date: '2026-04-14 16:13'
labels:
  - bug
  - ai
  - pipeline
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Preserve Anthropic 529 overload messages in the proxy and map them to a friendly retryable client error so pipeline investigation and shared AI surfaces do not show a generic internal proxy failure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Proxy forwards upstream 529 overload messages instead of flattening them to a generic internal proxy error.
- [x] #2 Client error parsing maps overload responses to a friendly retryable AI proxy message.
- [x] #3 Focused regression coverage exists for proxy 529 handling and client-side overload translation.
- [x] #4 Targeted verification passes with typecheck, focused vitest, eslint, and build.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Preserved Anthropic 529 overload messages in the proxy, translated overload responses into a friendly retryable FacetAiProxyError on the client, and added focused regression coverage for both layers. Verification passed with npm run typecheck, focused vitest for aiProxyErrors/facetServer 529 paths, targeted eslint, and npm run build.
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
