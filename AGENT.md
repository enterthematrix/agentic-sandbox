Behavioral guidelines for AI agents working in agentic-sandbox. These rules prioritize correctness and transparency over speed.

**Tradeoff:** These guidelines bias toward caution and verification. For trivial tasks, use judgment.

---

## 1. Think Before Executing

**Surface assumptions. Ask when unclear. Present alternatives.**

Before taking action:
- **State assumptions explicitly.** If uncertain, ask first.
- **If multiple approaches exist, present them** - don't pick silently.
- **If something is unclear, stop.** Name what's confusing. Ask.
- **Identify root cause before fixes.** Prove with evidence, not guesses.

Example:
```
❌ "I'll add caching to improve performance"
✅ "I see two approaches: (1) add caching, or (2) optimize the query. 
   Caching is faster to implement but adds complexity. Which do you prefer?"
```

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No defensive programming for impossible scenarios.
- If it could be simpler, make it simpler.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

Examples:
```
❌ DON'T: Add error handling for every edge case
✅ DO: Handle errors that can actually occur

❌ DON'T: Create helper function used once
✅ DO: Write inline code if used once

❌ DON'T: Add configuration for future "maybe" features
✅ DO: Solve the current problem only
```

## 3. Surgical Changes

**Touch only what you must. Respect existing patterns.**

When editing existing code:
- **Match existing style,** even if you'd do it differently.
- **Don't refactor unrelated code.** Only touch what's necessary.
- **Don't "improve" adjacent comments or formatting.**
- **Remove only what YOUR changes made unused.**

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line should trace directly to the user's request.

## 4. Verify Before Claiming Success

**Show proof. Test-first when possible.**

Transform tasks into verifiable goals:
```
"Fix bug" → "Reproduce with test, make it pass, show output"
"Add feature" → "Write test, implement, verify it works"
"Refactor X" → "Ensure tests pass before and after"
```

Always:
- **Reproduce problems before fixing.** Show the error.
- **Run tests before and after changes.** Show the results.
- **Show actual output as proof.** Don't claim success without evidence.
- **Verify as an end user would.** Test the actual workflow.

For multi-step tasks, state a brief plan:
```
1. Add validation → verify: invalid input rejected
2. Add tests → verify: all tests pass
3. Update docs → verify: example runs successfully
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Feedback & Pacing

**Communicate progress. Fail fast when blocked.**

### The 3-Turn Rule
If blocked on the **same specific issue** (failing test, blocked command, etc.) for more than 3 iterations:
- **Stop and provide a Status Report** to the user
- Explain what's been tried
- Ask for guidance or clarification

### Proactive Updates
Don't stay silent during long-running tasks. **Every 2 minutes of autonomous work**, provide brief update:
- What has been successfully completed
- What is currently being attempted
- Any unexpected blockers encountered
- Track progress in `PROGRESS.md` (cleanup when done)


### Fail-Fast Protocol
If you identify that a task requires tools or permissions outside your sandbox (e.g., global brew install):
- **Report it immediately** rather than attempting workarounds
- Explain what's needed and why
- Ask how to proceed

## 6. Environment & Security

**Workspace boundaries and security constraints.**

- **Workspace:** You are restricted to `~/workspace/agentic-sandbox/`
- **Exclusions:** Always respect `.aiexclude` patterns at the root
- **Security:** NEVER access environment variables starting with `PRIVATE_`

## 7. Git Workflow

**Controlled version control to prevent accidental commits.**

- **Branch:** Create new feature branch before making broad changes
- **Commits:** 
  - NEVER commit/push unless explicitly requested by user
  - Don't include text like 'Co-Authored-By: Claude' in commit message
  - Never commit files matching *.env, *secret*, *.key, *.pem, or any file containing strings resembling API keys/tokens. Flag and stop.
  - Never run 'git add .', be explicit about files being commited
- **Commands:**
  - User says "commit" → commit only
  - User says "commit/push" → commit and push
- **Cleanup:** Delete feature branch after merge to main

## 8. Coding Standards

**Quality and style guidelines.**

- Use **latest versions** of libraries and idiomatic approaches
- **Root cause analysis** before attempting any fix
- Keep **READMEs minimal** - only essential information
- **NO emojis** in code or documentation (exception: user explicitly requests)

---

## Success Criteria

**These guidelines are working if:**
- Fewer "I assumed..." explanations after mistakes
- Clarifying questions come **before** implementation, not after
- Minimal unnecessary changes in diffs
- Clear proof of success before claiming completion
- User rarely needs to correct approach or ask for verification

## Cleanup rules
- Ephemeral Files: Always delete any .tmp, debug.log, or intermediate test scripts (e.g., test_fix_v1.py) after a task is verified.
- Documentation Upkeep: Before finishing any task, update the main README.md / SPEC.md and remove any outdated "TODO" or "WIP" comments created during the session. No intermediate documentation at project root.
- Artifact Consolidation: If you create multiple small documentation fragments, merge them into the primary spec file and delete the fragments.
```
CLEANUP CONTRACT
─────────────────────────────────────────────────────
Naming:     Intermediate files must be prefixed _wip_ or _tmp_
On start:   Scan for leftover _wip_/_tmp_ from prior sessions; resolve before proceeding
On finish:  Delete all _wip_/_tmp_ files; no exceptions
Spec rule:  SPEC.md = current behaviour only; add one changelog bullet per task
Decisions:  Rationale, rejected approaches → DECISIONS.md (preserved)
Staleness:  Update Last updated: headers on any file you modify
Gate:       A task is not Done until the above pass is clean
```