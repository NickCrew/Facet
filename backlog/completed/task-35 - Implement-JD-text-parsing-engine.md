---
id: TASK-35
title: Implement JD text parsing engine
status: Done
assignee: []
created_date: '2026-03-09 07:18'
updated_date: '2026-03-09 07:39'
labels: []
milestone: m-6
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement an engine capable of parsing raw job description text (e.g. pasted from LinkedIn or a job board).
- Extract standard metadata: Company, Role, Comp/Salary Range, Location, and full JD.
- Fallback gracefully when fields cannot be confidently extracted.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented a JD parsing engine in `src/utils/jdParser.ts` that uses heuristic checks and regex patterns to extract Company, Role, Compensation, Location, and full Job Description from pasted text. Added unit tests with full coverage. Code passed `agent-loops` review.
<!-- SECTION:FINAL_SUMMARY:END -->
