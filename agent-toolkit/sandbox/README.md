# Sandbox

A high-performance, MicroVM-isolated development environment for senior-tier AI experimentation and autonomous agent operations.

## 🌟 Overview

The Dune Sandbox provides a "Frictionless Mac" experience inside a hardened, isolated environment. It uses `sbx` (powered by Docker/Colima) to establish a security boundary while maintaining seamless integration with your host's identities and aesthetics.

## 🚀 Quick Start

### 1. Provision the Sandbox
From the root of the `agentic-sandbox` repository, run:

```bash
./agent-toolkit/sandbox/scripts/setup_sandbox.sh
```

### 2. Enter the Sandbox
Once setup is complete, enter the environment with:

```bash
sbx run dune
```

## 🛠️ Key Features

### 1. Seamless Host Integration
The sandbox uses your host Mac as the **Source of Truth** through a hybrid sync strategy:

- **Live Sync (Automatic Updates):**
    - **AWS & SSH:** `~/.aws` and `~/.ssh` are bind-mounted. Fresh tokens (e.g., from `aws-azure-login`) or new SSH keys are available instantly.
    - **Identity & Aesthetics:** `~/.gitconfig` and `~/.p10k.zsh` are bind-mounted. Your Git identity and terminal prompt (Powerlevel10k) reflect host changes automatically.
- **Snapshot Sync (Requires Setup Re-run):**
    - **Environment Variables:** During setup, the script captures your host `~/.zshrc` exports and aliases. These are filtered to ensure compatibility with the Linux guest and stored in a snapshot file sourced by the guest shell.

### 2. Full Host Isolation
- **The Decoy Shield:** The sandbox mounts a temporary decoy directory instead of your Mac's source code. 
- **Internal Workspace:** Use `/home/agent/workspace` to clone repositories internally. Changes made inside the sandbox **cannot leak** to your host Mac.

### 3. Toolchain
Pre-provisioned with:
- **Shell:** ZSH + Oh My Zsh + Powerlevel10k (Default login shell).
- **Core:** `uv`, `gh`, `ripgrep`, `jq`, `just`.
- **Node:** `Node.js v20` + `npm`.
- **AI CLIs:** `claude` (Claude Code) and `gemini` (Gemini CLI).

## 🧹 Maintenance

### Cleanup
To completely remove the sandbox and all associated Docker/Colima artifacts:

```bash
./agent-toolkit/sandbox/scripts/cleanup_sandbox.sh
```

### Refreshing Environment Variables
If you add new `export` or `alias` lines to your host `~/.zshrc` and want them available in the sandbox, re-run the `setup_sandbox.sh` script to update the environment snapshot.

## 📜 Documentation
For technical details and implementation requirements, see [sandbox.md](./sandbox.md).
