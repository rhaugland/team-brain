---
name: extract
description: Extract skills and learnings from the current Claude Code session and save them to the shared Team Brain knowledge base
---

# Extract Skills & Learnings

You are reviewing the current conversation to extract knowledge for the team.

## Who is this person?

Determine the user's name. Check these sources in order:
1. The git config: run `git config user.name`
2. The system username: run `whoami`

## What to extract

Review the entire conversation above and identify:

### Skills (what this person demonstrated or learned)
- Technologies, libraries, or tools they worked with competently
- New capabilities they acquired during this session
- Specific integrations or patterns they demonstrated
- Be specific: "Stripe Connect multi-party payouts" not just "Stripe"
- Skip routine work like "edited CSS" or "ran npm install"

### Learnings (tactical insights worth sharing with the team)
- Something that didn't work and what to do instead
- A non-obvious approach that saved time
- A gotcha or pitfall others should know about
- Must be generalizable — skip project-specific details that wouldn't help others
- Rate importance: "high" (would save someone hours), "medium" (useful to know), "low" (minor tip)
- Only include "high" and "medium" importance learnings

## Process

1. Read the current contents of `~/team-brain/data/skills.json` and `~/team-brain/data/learnings.json`
2. Identify new skills and learnings from this conversation
3. Deduplicate:
   - Skills: if this person already has this skill (case-insensitive match), skip it
   - Learnings: if a semantically similar learning already exists from anyone, skip it
4. Determine the project name from context (repo name, directory name, or conversation context)
5. Get today's date
6. Append new entries to the JSON arrays
7. Write the updated files back

## Output format

After extraction, report what was captured:

**Skills captured:**
- [list each new skill, or "None — no new notable skills this session"]

**Learnings captured:**
- [list each new learning, or "None — no new notable learnings this session"]

**Skipped (duplicates):**
- [list any that were skipped because they already existed]

## Important

- Do NOT ask the user for confirmation — just extract and report what you found
- Do NOT extract trivial or routine work
- Be specific in skill names — they should be meaningful enough that someone searching "who knows X?" would find them
- Keep learning descriptions concise but complete — someone should understand the insight without extra context
- If you find nothing worth extracting, say so — don't manufacture entries
