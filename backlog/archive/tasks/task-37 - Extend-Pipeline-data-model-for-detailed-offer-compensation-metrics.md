---
id: TASK-37
title: Extend Pipeline data model for detailed offer compensation metrics
status: To Do
assignee: []
created_date: '2026-03-09 07:18'
labels: []
milestone: m-7
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the `PipelineEntry` type to store a structured breakdown of an offer.
- Track variables such as: Base Salary, Sign-on Bonus, Equity (RSU/Options), Vesting Schedule, Annual Target Bonus, Target OTE.
- Ensure backwards compatibility or a migration path for the existing generic `comp` string field.
<!-- SECTION:DESCRIPTION:END -->
