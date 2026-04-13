# Agentic Lab Notes

## Tooling & Configs
> **Tip:** Keep your environment variables in a `.env.example` to avoid leaking keys.

### Local LLM Setup (Ollama + uv)
To keep the toolchain lean, use `uv` for python management:
`uv pip install langchain-ollama`

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