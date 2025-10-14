---
allowed-tools: Bash(git status:*), Bash(git log:*), Read, Grep, Glob
description: Let's Get Started - analyze LOG and PLAN to start today's work
---

# Let's Get Started (LFG)

## Context

**Current date:** !`date +%Y-%m-%d`

**Recent development log:** @LOG.md

**Today's plan:** @PLAN.md

**Current git status:** !`git status --short`

**Recent commits (last 3):** !`git log --oneline -3`

## Your task

1. **Analyze the development log**:
   - What was accomplished recently?
   - What patterns or approaches have been used?
   - Are there any unresolved issues from previous work?

2. **Review today's plan**:
   - What tasks are scheduled for today?
   - Are the tasks clear and actionable?
   - Do any tasks need more context or breakdown?

3. **Check current state**:
   - Are there uncommitted changes that might be relevant?
   - What was the last thing worked on based on commits?

4. **Ask clarifying questions**:
   - Which task from the plan should we prioritize first?
   - Is there any context about the planned tasks that would be helpful?
   - Are there any blockers or dependencies we should be aware of?
   - Should we modify or add anything to today's plan based on current priorities?

5. **Provide a clear starting point**:
   - Once you have the user's answers, suggest a concrete first step
   - Break down the first task if it's complex
   - Highlight any relevant files or areas of the codebase to focus on

**Keep the conversation concise and focused on getting started quickly.**
