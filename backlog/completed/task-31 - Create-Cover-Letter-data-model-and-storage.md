---
id: TASK-31
title: Create Cover Letter data model and storage
status: Done
assignee: []
created_date: '2026-03-09 07:17'
updated_date: '2026-03-09 18:37'
labels: []
milestone: m-5
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the internal data structure for Cover Letters.
- Add `CoverLetter` and `CoverLetterParagraph` interfaces.
- Create a `coverLetterStore` (Zustand) to persist templates and snippets.
- Support tagging paragraphs with `vectorId` and priority levels, similar to the existing bullet system.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created `src/types/coverLetter.ts` and `src/store/coverLetterStore.ts`. Implemented the `CoverLetterTemplate` and `CoverLetterParagraph` interfaces, incorporating `PriorityByVector` to allow vector-based conditional generation. Instantiated a Zustand store with persistence for managing templates locally. Passed all local typecheck and lint pipelines.
<!-- SECTION:FINAL_SUMMARY:END -->
