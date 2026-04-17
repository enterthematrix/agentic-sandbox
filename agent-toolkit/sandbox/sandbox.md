# Blueprint: Agentic Sandbox Configuration (Dune)

### Environment Objective
Establish a high-performance, MicroVM-isolated development environment (`sbx`) that mirrors a modern macOS development experience. The environment is designed for zero host-leakage, ensuring that all agentic operations are contained within the sandbox.

### Architectural Principles
- **Host/Guest Isolation:** `sbx` (powered by Docker/Colima) provides the security boundary. The sandbox mounts a temporary empty directory to ensure no host files are accessible.
- **Seamless Sync (Source of Truth):**
    - **Live Sync:** Host `~/.aws`, `~/.ssh`, `~/.gitconfig`, and `~/.p10k.zsh` are bind-mounted (Read-Only) to ensure the sandbox always uses the latest host credentials and terminal aesthetics.
    - **Snapshot Sync:** Host `~/.zshrc` exports and aliases are filtered and mirrored during setup to provide a compatible environment without Mac/Linux path conflicts.
- **Senior-Tier UX:** ZSH with mirrored Powerlevel10k settings and senior Mac-like aliases minimize friction.

### Technical Stack

| Component | Selection | Rationale |
| :--- | :--- | :--- |
| **Engine** | `sbx` (Shell Agent) | Raw terminal control; lands in ZSH by default. |
| **Isolation** | **MicroVM** (vz-rosetta) | Hardware-assisted virtualization for superior security. |
| **Shell** | **ZSH + OMZ + P10K** | Industry-standard terminal experience; mirrored aesthetics. |
| **Package Mgr** | **Flox + uv + npm** | Declarative toolchains and high-speed dependency management. |

---

## Implementation Requirements (Outcome: `setup_sandbox.sh`)

### Phase 1: Infrastructure & Engine
1.  **Host Pre-requisites:** Ensure Homebrew, `uv`, `gh`, `jq`, `colima`, `docker`, and `sbx` are installed.
2.  **Isolated Runtime:** Create a temporary empty directory on the host to serve as the required mount point for `sbx`.
3.  **Sandbox Init:** Create a sandbox named `dune` with explicit resource limits (`--memory 8g --cpus 4`).

### Phase 2: Identity & Aesthetics Mirroring
1.  **Identity Mirroring:**
    - Mirror host `~/.gitconfig` to guest `/home/agent/.gitconfig`.
    - Mirror host SSH public keys to guest `/home/agent/.ssh/`.
2.  **Terminal Aesthetics:** Mirror host `~/.p10k.zsh` to guest `/home/agent/.p10k.zsh` to preserve the user's terminal UI.
3.  **AWS Configuration:**
    - Mirror host `~/.aws/config`.
    - Extract and mirror the specific `slalom_aws` profile from host `~/.aws/credentials` to guest `/home/agent/.aws/credentials`.

### Phase 3: Guest Environment Provisioning
1.  **Core Toolchain:** Install `zsh`, `git`, `nodejs`, `npm`, `gh`, `ripgrep`, `jq`, and `just` via `apt`.
2.  **Flox Environment:** Install `flox` (1.11.x+) using the official Apt repository.
3.  **Experimental Tools:**
    - Install `uv` via the official installer.
    - Global install `@google/gemini-cli` and `@anthropic-ai/claude-code`.
4.  **Shell Configuration:**
    - Install **Oh My Zsh** and **Powerlevel10k**.
    - Configure `.zshrc` with:
        - `cd $HOME` (Landing path)
        - `AWS_PROFILE='slalom_aws'` and `AWS_SDK_LOAD_CONFIG=1`
        - Senior aliases (`ll`, `cat`, `..`)
    - Ensure ZSH is the default entry point via `sudo usermod` and a `.bash_profile` wrapper.

### Phase 4: Workspace Standards
1.  **Manual Workspace:** Create an empty `/home/agent/workspace` directory. The user will manually clone their repositories here to maintain full control and isolation.

---

## Agent Verification Protocol
The setup is successful if:
- `sbx run dune` lands in ZSH at `/home/agent`.
- `claude login` works without credential errors.
- `ll` alias is active and P10K prompt is correctly rendered.
- No files from the host Mac project directory are visible in the sandbox.
