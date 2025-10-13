---
allowed-tools: Bash(git diff:*), Bash(git status:*), Read, Edit, Write
description: End of day summary - update LOG.md and PLAN.md
---

# End of Day Summary

## Context

**Git changes today:**
!`git diff HEAD`

**Current date:** !`date +%Y-%m-%d`

**Current LOG.md:** @LOG.md

**Current PLAN.md (if exists):** @PLAN.md

## Your task

1. **Analyze the git diff** and understand what was accomplished today:
   - What files were modified?
   - What features/functionality was added?
   - What bugs were fixed?
   - What patterns or approaches were used?

2. **Ask the user**: "What should we work on tomorrow?" and wait for their response

3. **Update LOG.md**:
   - Add a new entry under today's date (YYYY-MM-DD format)
   - Write ONE concise sentence summarizing today's work based on the diff analysis
   - Keep it factual and specific

4. **Update PLAN.md**:
   - Create or update with "## Tomorrow (YYYY-MM-DD)" section
   - Add numbered list of tasks based on user's response
   - Be specific and actionable
