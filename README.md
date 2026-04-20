# Agentic Sandbox

An experimental laboratory for exploring AI-driven software engineering, agentic workflows, and AI-augmented applications. This repository serves as both a toolkit for building with AI agents and a collection of prototype applications demonstrating agentic coding patterns.

## 🎯 Purpose

This repository explores two key areas:

1. **Infrastructure** - Tools and environments that enable safe, isolated AI agent development
2. **Applications** - Prototype projects built using agentic coding workflows to learn patterns and best practices

## 🛠️ Agent Toolkit

### Dune Sandbox

A fully isolated development environment that replicates your complete host setup including credentials, IDE configuration, and AI tools.

**Key Features:**
- **Complete Isolation** - Zero host file leakage, temporary workspace
- **Identity Sync** - SSH keys, Git config, AWS credentials automatically replicated
- **IDE Environment** - VS Code settings, keybindings, and all extensions installed
- **AI Tools** - Claude Code settings, environment variables, and plugins replicated
- **GUI Support** - Firefox and VS Code with X11 forwarding (optional)
- **Development Tools** - Node.js, Python (uv), Git, AWS CLI, ripgrep, jq, just

**Automatic Replication:**
- Git configuration and SSH keys
- AWS credentials (live mount, read-only)
- VS Code complete setup (settings + 9 extensions)
- Claude Code configuration (settings + plugins like ralph-loop)
- Terminal theme and shell preferences (Oh My Zsh + Powerlevel10k)

**Quick Start:**
```bash
cd agent-toolkit/sandbox/scripts
bash setup_sandbox.sh
```

**Documentation:** See [SANDBOX_SPEC.md](./agent-toolkit/sandbox/SANDBOX_SPEC.md) for complete implementation details.

---

## 🚀 Prototypes

Experimental applications built using agentic coding workflows.

### Kanban Studio
Full-stack AI-augmented Kanban board with natural language interface.
- **Stack:** Next.js + FastAPI + SQLite + OpenRouter
- **Features:** JWT auth, drag-and-drop, AI sidebar
- **Location:** [prototypes/kanban_studio](./prototypes/kanban_studio)

---

## 🤖 For AI Agents

**[CLAUDE.md](./CLAUDE.md)** contains behavioral guidelines that all AI agents must follow when working in this repository. These rules apply regardless of which directory you're working in.