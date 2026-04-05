---
id: doc-1
title: General Instructions for Agents
type: other
created_date: '2026-03-09 19:28'
---
<general_agent_instructions>

<git_workflow>

- Use atomic commits with conventional commit messages
- Only commit files using the `committer` tool. It is the safest way to stage files and hunks. 
- You must get explicit permission and provide a good reason before each invocation of the `git add` command.
- Never use destructive git actions like `git reset --hard` or `git checkout`
- Never cleanup untracked changes for which you are not responsible. 
- Ignore untracked changes that you did not touch. Never cleanup untracked changes without explicit permission. There may be other agents working in the project. 
- You may modify FILES with pre-existing changes. If the lines you need to change have already been modified, you must escalate to the user.
- When you have modified lines in a file with pre-existing changes, you must stage changes in hunks using `committer --patch`
- Only delete files using the `trash` tool


</git_workflow>

<qa_gates>

Code and test review loops to ensure quality.

<all_agent_gates>

This section applies to ALL agents (Claude, Codex, Gemini)

- You must have each atomic commit reviewed. 
- A task is not complete unless all existing tests must pass and linters should report no warnings or errors. 

</all_agent_gates>

<gemini_codex_gates>

This section only applies to Gemini or Codex agents. All other agents should ignore. 

- Gemini and Codex agents must use the `agent-loops` skill for all feature development. 

</gemini_codex_gates>

<claude_quality_gates>

This section only applies to Claude agents. All other agents should ignore

- Claude should use relevant specialist sub-agents via `Task` tool for code review. 
- Claude should use a sub-agent via the `Task` tool with the  `test-review-request` skill to review tests and find testing gaps
- Any review feedback designated P0 or P1 must be immediately addressed. Lower priority feedback can be deferred if you create tasks in backlog to track. 
- After addressing review feedback, you must request another review and receive approval with no outstanding P0 or P1 feedback items. 
- If your changes are not approved after 2 turns, escalate to the user. 
- Example review loop for code or tests: initial change -> review  #1 requests changes -> first fix attempt -> review #2 requests changes -> second fix attempt -> review #3  (approved -> done | requests changes -> escalate

</claude_quality_gates>

</qa_gates>

</general_agent_instructions>
