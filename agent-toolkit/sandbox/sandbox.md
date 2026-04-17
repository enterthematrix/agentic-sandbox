# Blueprint: Agentic Sandbox Configuration (Dune)

### Environment Objective
Establish a high-performance, MicroVM-isolated development environment (`sbx`) that mirrors a modern macOS development experience. The goal is to provide a low-friction, senior-tier terminal environment for autonomous agent operations and AI experimentation.

### Architectural Principles
- **Host/Guest Isolation:** `sbx` (powered by Docker/Colima) provides the security boundary.
- **Identity Mirroring:** SSH keys, Git credentials, and AWS profiles must be seamlessly injected from the host to the guest.
- **Generic Portability:** The setup must be machine-agnostic, using interactive prompts for user-specific configurations (e.g., AWS profiles).
- **Senior-Tier UX:** ZSH with Powerlevel10k and common Mac-like aliases (ll, cat, etc.) to minimize friction.
- **Resource Efficiency:** Implementation must use sequential execution and frequent cleanup to survive memory-constrained environments (Exit Code 137).

### Technical Stack

| Component | Selection | Rationale |
| :--- | :--- | :--- |
| **Engine** | `sbx` (Docker Sandbox) | Optimized for agentic workflows and secure isolation. |
| **Isolation** | **MicroVM** (vz-rosetta) | Hardware-assisted virtualization for superior security and performance. |
| **Shell** | **ZSH + OMZ + P10K** | Industry-standard terminal experience for productivity and clarity. |
| **Package Mgr** | **Flox + uv + npm** | Hybrid approach for declarative toolchains and modern speed. |

---

## Implementation Requirements (Outcome: `setup_sandbox.sh`)

### Phase 1: Infrastructure & Engine
1.  **Host Pre-requisites:** Install Homebrew, `uv`, `gh`, `jq`, `colima`, `docker`, and `sbx`.
2.  **Runtime Start:** Initialize Colima with optimized Apple Silicon settings (`--cpu 4 --memory 8 --vm-type=vz --vz-rosetta --mount-type=virtiofs`).
3.  **Sandbox Init:** Create a sandbox named `dune` mounting the host project root.

### Phase 2: Identity & Secret Management
1.  **Identity Mirroring:**
    - Mirror `~/.gitconfig`.
    - Mirror SSH keys from `~/.ssh/` (specifically `id_ed25519.pub` and `id_rsa.pub` if they exist).
2.  **AWS Integration:**
    - Prompt the user for their preferred AWS Profile and Region.
    - Inject the selected credentials into the sandbox using the `sbx secret` manager or secure file injection.

### Phase 3: Guest Environment Provisioning
1.  **Core Toolchain:** Install `zsh`, `git`, `nodejs`, `npm`, and `ca-certificates` via `apt`.
2.  **Flox Environment:** Add the Flox repository and install `flox` (1.11.x+).
3.  **Experimental Tools:**
    - Install `uv` via the official installer.
    - Install `gh`, `ripgrep`, `jq`, and `just` via `apt` or `flox`.
    - Global install `@google/gemini-cli` and `@anthropic-ai/claude-code`.
4.  **Shell Aesthetics:** 
    - Install **Oh My Zsh** and **Powerlevel10k**.
    - Configure a `.zshrc` with the P10K theme, common aliases, and AWS environment variables.

### Phase 4: Workspace Standards
1.  **Clone Primary Repo:** Ensure the `agentic-sandbox` repository is available in `/home/agent/workspace`.
2.  **Agent-Ready Standards:** Ensure a universal `.aiexclude` exists and verify symlinks for `.geminiignore` and `.claudeignore` are present and valid.

---

## Agent Verification Protocol
The setup is considered successful ONLY if the following can be proven:
- `zsh --version` (>= 5.9)
- `gemini --version` (>= 0.38)
- `claude --version` (>= 2.1)
- `flox --version` (>= 1.11)
- Identity check: `git config --get user.email` returns the host's email.
- Shell check: `echo $SHELL` returns `/usr/bin/zsh`.
