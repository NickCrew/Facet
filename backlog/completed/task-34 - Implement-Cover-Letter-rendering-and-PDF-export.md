---
id: TASK-34
title: Implement Cover Letter rendering and PDF export
status: Done
assignee: []
created_date: '2026-03-09 07:18'
updated_date: '2026-03-09 19:31'
labels: []
milestone: m-5
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the export logic for Cover Letters.
- Render the Cover Letter layout (Header, greeting, body, sign-off).
- Output to PDF (via Typst) or raw Text to complement the resume outputs.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the cover letter rendering pipeline.
- Created `letterAssembler.ts` to filter modular paragraphs based on vector priority and resolve `{{variables}}`.
- Created `letter.typ` Typst template for professional PDF layout.
- Implemented `letterPdfRenderer.ts` using the Typst WASM engine.
- Integrated the new `letter` template into the global registry.
- Verified logic with `just ci` (typecheck/lint).
<!-- SECTION:FINAL_SUMMARY:END -->
