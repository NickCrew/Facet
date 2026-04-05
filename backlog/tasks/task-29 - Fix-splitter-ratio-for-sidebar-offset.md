---
id: TASK-29
title: Fix splitter ratio calculation to account for sidebar width
status: To Do
assignee: []
created_date: '2026-03-07 12:00'
updated_date: '2026-03-07 12:00'
labels: []
milestone: m-4
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The panel splitter drag handler in BuildPage uses `event.clientX / window.innerWidth` which doesn't account for the 48px sidebar. This makes the panel ratio feel slightly off — dragging to visual center doesn't produce a 50/50 split.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Splitter drag calculation accounts for sidebar width: `(event.clientX - 48) / (window.innerWidth - 48)`
- [ ] #2 Panel ratio feels correct — visual midpoint = 0.5 ratio
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In `src/routes/build/BuildPage.tsx`, find the `onMouseMove` handler inside the `draggingSplit` effect (around line 310).
2. Change `event.clientX / window.innerWidth` to `(event.clientX - 48) / (window.innerWidth - 48)`.
3. Consider extracting `48` as a `SIDEBAR_WIDTH` constant shared with AppShell CSS.
<!-- SECTION:PLAN:END -->
