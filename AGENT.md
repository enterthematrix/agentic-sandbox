## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

# Agent Rules
- **Scope:** You are restricted to `~/workspace/agentic-sandbox/`. 
- **Exclusion:** Always respect `.aiexclude` patterns at the root.
- **Security:** Do not attempt to access environment variables starting with `SLALOM_`.
- **Pre-flight:** Before executing any shell script you generate, run `ls -la` to verify the target exists.
- **Git:** 
    - Always create a new branch `agent-edits` before making broad changes. 
    - Delete the branch once it is merged with dev/main
    - DO NOT commit/push changes unless explicitly asked
    - Use 'commit' as command to commit changes and 'commit/push' as command to commit and push changes
- **Feedback & Pacing:**
    - *The 3-Turn Rule*: If a specific technical hurdle (e.g., a failing test or a blocked command) persists for more than 3 iterations, stop and provide a "Status Report" to the user
    - *Proactive Feedback*: Do not stay silent during long-running tasks. After every 2 minutes of autonomous work, provide a brief update on:
        - What has been successfully completed.
        - What is currently being attempted.
        - Any unexpected blockers encountered.
        - Write the progress on current plan in a PROGRESS.md file. Cleanup the progress file after all tasks are completed.
    - *Fail-Fast Protocol*: If you identify that a task requires tools or permissions outside your sandbox (e.g., a global brew install), report it immediately rather than attempting workarounds.
    - *Verify and show proof*:  
        - Reproduce a problem before fixing it
        - Always verify results before claiming success and show proof of scuccess
