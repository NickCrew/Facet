---
id: TASK-36
title: Build 'Paste JD to Import' modal in Pipeline view
status: Done
assignee: []
created_date: '2026-03-09 07:18'
updated_date: '2026-03-09 07:43'
labels: []
milestone: m-6
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a new import flow in the Pipeline view.
- Introduce a "Paste JD" modal.
- Hook it up to the parser engine.
- Upon extraction, automatically map the extracted text into the Create Pipeline Entry form fields.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `PasteJdModal` to the Pipeline view. Users can paste a raw job description, and the engine extracts the text and pre-fills a new `PipelineEntryModal`. This required updating the modal states in `PipelinePage` to support an `add-prefilled` state, and updating `PipelineEntryModal` to accept an `initialData` prop.
<!-- SECTION:FINAL_SUMMARY:END -->
