---
id: TASK-32
title: Build UI for managing modular cover letter paragraphs
status: Done
assignee: []
created_date: '2026-03-09 07:17'
updated_date: '2026-03-09 18:48'
labels: []
milestone: m-5
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a management interface where users can define cover letter templates and manage paragraphs.
- Add a drag-and-drop builder for constructing cover letters.
- Hook up the vector selector so paragraphs appear/disappear based on priority mapping.
- Embed a Cover Letter generation sub-view in the Pipeline view when expanding a job entry.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Built the UI for managing modular cover letter templates. Added a new `/letters` route accessible from the sidebar. Users can create, edit, and delete templates, as well as add individual paragraphs. Integrated the existing `VectorPriorityEditor` so users can map each paragraph to specific vectors. Ran code through `agent-loops` review, passing accessibility, correctness, and maintainability checks.
<!-- SECTION:FINAL_SUMMARY:END -->
