---
id: m-4
title: "m-4 - Job Search Suite"
---

## Description

Transform Facet from a standalone resume assembly tool into a full job search command center. Add Pipeline (application tracker) and Prep (interview reference cards) as integrated sub-apps, connected to the existing build engine through shared vectors and JD analysis.

## Tasks

- TASK-23: Create pipelineStore with Zustand persistence and full CRUD
- TASK-24: Build Pipeline UI — table view, filters, analytics, detail panel
- TASK-25: Wire Pipeline → Build integration (JD analysis handoff, vector linking)
- TASK-26: Extract interview-prep.html into structured PrepCard JSON data
- TASK-27: Build Prep UI — searchable card grid with category/vector filtering
- TASK-28: Wire Prep → Pipeline context (surface relevant cards for active company)
- TASK-29: Fix splitter ratio calculation to account for sidebar width
