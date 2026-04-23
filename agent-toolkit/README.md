# Agent Toolkit: Resources and configurations for agentic coding.

### Sandbox setup for Agentic AI experimentation
```bash
See ./sandbox/scripts/setup_sandbox.sh
```

### Local LLM Setup (Ollama | Openrouter)
To configure Claude Code for Kimi K2.5 via OpenRouter :
> **Tip:**  You can pick the model "openrouter/free" as described [here](https://openrouter.ai/openrouter/free) to be automatically routed to a working free model
```
export ANTHROPIC_DEFAULT_HAIKU_MODEL="moonshotai/kimi-k2.5"
export ANTHROPIC_DEFAULT_SONNET_MODEL="moonshotai/kimi-k2.5"
export ANTHROPIC_DEFAULT_OPUS_MODEL="moonshotai/kimi-k2.5"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="PUT YOUR OPENROUTER KEY HERE"
export ANTHROPIC_API_KEY=""
claude --model moonshotai/kimi-k2.5
```
To configure Claude Code for GPT-OSS 20B via Ollama on a Mac:
```
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gpt-oss"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gpt-oss"
export ANTHROPIC_DEFAULT_OPUS_MODEL="gpt-oss"
export ANTHROPIC_BASE_URL="http://localhost:11434"
export ANTHROPIC_AUTH_TOKEN="ollama"
export ANTHROPIC_API_KEY=""
ollama pull gpt-oss
claude --model gpt-oss
```

### AI Ignore List (.aiexclude)
To avoid the agent scanning large build artifacts and irrelevant directories on restarts, we use a master `.aiexclude` file at the root.

**1. Create/Update `.aiexclude`:**
Ensure standard build artifacts, caches, and environment folders are listed.

**2. Create Local Symlinks:**
Since different agents use different ignore files (e.g., Gemini CLI uses `.geminiignore`), create symlinks to the source of truth:
```bash
ln -s .aiexclude .geminiignore
ln -s .aiexclude .claudeignore
```

**3. Configure Global Settings:**
Update your global `~/.gemini/settings.json` to explicitly respect `.aiexclude`:
```json
{
  "context": {
    "fileFiltering": {
      "customIgnoreFilePaths": [".aiexclude"]
    }
  }
}
```

### Prompt Engineering
* **System Instructions:** Agents perform better when given a "Chain of Thought" (CoT) requirement.
* **The "Escape" Pattern:** Always define a `TERMINATE` string for autonomous loops.

### Skills / MCP / Plugin's
* **MCP Marketplaces:** 
    - https://glama.ai
    - https://mcp.so
    - https://smithery.ai

* **Skills Marketplaces:** 
    - https://skills.sh

* **Few examples to install skills/mcp/plugins:**

    ```
    # To install the brilliant Agent Browser skill:
    npm install -g agent-browser
    agent-browser install
    npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser

    # Context7
    claude mcp add context7 -- npx -y @upstash/context7-mcp
    claude mcp remove context7

    #Adding the Github Remote MCP Server
    claude mcp add --transport http github https://api.githubcopilot.com/mcp --header "Authorization: Bearer YOUR_GITHUB_PAT"

    # Adding the Atlassian Jira Remote MCP Server:
    claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp

    ```




### Resources
* [Model Context Protocol Docs](https://modelcontextprotocol.io)
* [MCP Servers](https://github.com/modelcontextprotocol/servers)
* [OpenCode](https://opencode.ai/)
* [Amp](https://ampcode.com/)
