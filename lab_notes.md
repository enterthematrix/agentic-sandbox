# Agentic Lab Notes

## Tooling & Configs
> **Tip:** Keep your environment variables in a `.env.example` to avoid leaking keys.

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

### Docker & Colima (macOS)
Lightweight, CLI-first Docker environment for macOS, optimized for Apple Silicon.

**1. Installation:**
```bash
brew install docker docker-compose docker-cli docker-credential-helper colima
mkdir -p ~/.docker/cli-plugins
ln -sfn $(brew --prefix)/opt/docker-compose/bin/docker-compose ~/.docker/cli-plugins/docker-compose
```

**2. Start (M1/M2/M3):**
```bash
colima start --cpu 4 --memory 8 --vm-type=vz --vz-rosetta --mount-type=virtiofs
```

**3. Configure Socket:**
```bash
docker context use colima
sudo ln -sf $HOME/.colima/default/docker.sock /var/run/docker.sock
```

**4. Commands:**
- `colima start / status / stop`
- `colima delete` (Factory Reset)

## Prompt Engineering
* **System Instructions:** Agents perform better when given a "Chain of Thought" (CoT) requirement.
* **The "Escape" Pattern:** Always define a `TERMINATE` string for autonomous loops.


## Resources
* [Model Context Protocol Docs](https://modelcontextprotocol.io)
* [MCP Servers](https://github.com/modelcontextprotocol/servers)
* [OpenCode](https://opencode.ai/)
* [Amp](https://ampcode.com/)