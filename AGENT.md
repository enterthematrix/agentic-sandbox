## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

# Agentic Sandbox Rules
- **Scope:** You are restricted to `~/workspace/agentic-sandbox/`. 
- **Exclusion:** Always respect `.aiexclude` patterns at the root.
- **Security:** Do not attempt to access environment variables starting with `SLALOM_`.
- **Pre-flight:** Before executing any shell script you generate, run `ls -la` to verify the target exists.
- **Git:** 
    - Always create a new branch `agent-edits` before making broad changes. 
    - Delete the branch once it is merged with dev/main
    - DO NOT commit/push changes unless explicitly asked
    - Use 'commit' as command to commit changes and 'commit/push' as command to commit and push changes