#!/bin/bash

# setup_sandbox.sh - Comprehensive "Dune" Sandbox Provisioning
# Optimized for macOS (Apple Silicon) and team portability.
# Achievement: Full host isolation, Mac-like UX, and senior-tier ZSH.

set -e

# Configuration
SANDBOX_NAME="dune"
# Use a temporary directory on the host for the 'workspace' mount to ensure isolation
HOST_MOUNT_DIR=$(mktemp -d -t sbx-dune-isolated)

echo "Starting Comprehensive 'Dune' Sandbox Setup..."
echo "Host isolation directory: $HOST_MOUNT_DIR"

# 1. OS Check
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script is currently optimized for macOS."
    exit 1
fi

# 2. Host Identity & AWS Prompts
if [ -t 0 ]; then
    echo "Configuring environment for team member..."
    read -p "Enter AWS Profile to mirror [slalom_aws]: " AWS_PROFILE
    AWS_PROFILE=${AWS_PROFILE:-slalom_aws}

    read -p "Enter AWS Region [us-east-1]: " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
else
    # Default values for non-interactive (agent) runs
    AWS_PROFILE="slalom_aws"
    AWS_REGION="us-east-1"
fi

echo "Using AWS Profile: $AWS_PROFILE"
echo "Using AWS Region: $AWS_REGION"

# 3. Host Pre-flight
echo "Ensuring host dependencies (Homebrew, Docker/Colima, SBX)..."
command -v brew &> /dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install uv gh jq colima docker docker-compose &> /dev/null
brew install --cask sbx &> /dev/null

# 4. Infrastructure Initialization
echo "Ensuring Colima is running (vz-rosetta, virtiofs)..."
if ! colima status &> /dev/null; then
    colima start --cpu 4 --memory 8 --vm-type=vz --vz-rosetta --mount-type=virtiofs
fi
docker context use colima &> /dev/null

# 5. Sandbox Creation (Isolated from host source)
echo "Initializing '$SANDBOX_NAME' sandbox (Full Host Isolation)..."
if ! sbx ls | grep -q "$SANDBOX_NAME"; then
    # We mount the empty temp dir to satisfy sbx requirement, ensuring no host file changes
    sbx create --name "$SANDBOX_NAME" shell "$HOST_MOUNT_DIR"
fi

# 6. Robust Execution Helper
# Handles transient "container not ready" errors with retries
sbx_exec() {
    local cmd=$1
    local msg=$2
    local max_retries=5
    local retry_count=0
    local status=1
    
    [ -n "$msg" ] && echo "  - $msg..."
    
    until [ $retry_count -ge $max_retries ]
    do
        # Use a temporary file for stderr
        tmp_err=$(mktemp)
        # We ensure the wrapper commands are on a NEW LINE to avoid breaking heredocs
        if sbx exec "$SANDBOX_NAME" -- bash -c "$cmd
s=\$?; sync; exit \$s" 2>$tmp_err; then
            status=0
            rm -f $tmp_err
            break
        else
            err=$(cat $tmp_err)
            if echo "$err" | grep -qE "not ready for exec|is not running"; then
                echo "    - Container busy, retrying in 5s... ($((retry_count+1))/$max_retries)"
                sleep 5
                retry_count=$((retry_count+1))
                rm -f $tmp_err
            else
                echo "    - Error executing command"
                echo "$err" >&2
                rm -f $tmp_err
                # On general failure, we retry anyway unless we've exhausted retries
                echo "    - General error, retrying in 5s... ($((retry_count+1))/$max_retries)"
                sleep 5
                retry_count=$((retry_count+1))
            fi
        fi
    done
    
    if [ $status -ne 0 ]; then
        echo "    - Failed after $max_retries retries."
        return 1
    fi
    sleep 1
}

# 7. Sandbox Warm-up
echo "Warming up sandbox..."
sbx_exec "true" "Initializing Docker daemon"

# 8. Identity & Secret Mirroring
echo "Mirroring host identities and AWS secrets..."

inject_file_raw() {
    local target=$1
    local source=$2
    if [ -f "$source" ]; then
        local content=$(cat "$source")
        # We use a quoted EOF inside the bash -c to prevent host-side expansion
        sbx_exec "cat > $target <<'EOF'
$content
EOF" "Mirroring $(basename "$source")"
    fi
}

# Mirror Git
inject_file_raw "/home/agent/.gitconfig" "$HOME/.gitconfig"

# Mirror SSH
sbx_exec "mkdir -p /home/agent/.ssh" "Creating .ssh directory"
inject_file_raw "/home/agent/.ssh/id_ed25519.pub" "$HOME/.ssh/id_ed25519.pub"
inject_file_raw "/home/agent/.ssh/id_rsa.pub" "$HOME/.ssh/id_rsa.pub"

# Mirror AWS
sbx_exec "mkdir -p /home/agent/.aws" "Creating .aws directory"
inject_file_raw "/home/agent/.aws/config" "$HOME/.aws/config"
inject_file_raw "/home/agent/.aws/credentials" "$HOME/.aws/credentials"

# 9. Hyper-Sequential Guest Provisioning (OOM Protection)
echo "Provisioning internal environment (Sequential/Memory-Safe)..."

# Core Tools
sbx_exec "sudo apt-get update -qq || true" "Updating package lists"
for pkg in zsh git nodejs npm ca-certificates; do
    sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $pkg && sudo apt-get clean" "Installing $pkg"
done

# Flox Environment
echo "Installing Flox (Declarative toolchain manager)..."
sbx_exec 'echo "deb [trusted=yes] https://downloads.flox.dev/by-env/stable/deb stable/" | sudo tee /etc/apt/sources.list.d/flox.list' "Adding Flox repository"
sbx_exec "sudo apt-get update -qq || true" "Refreshing Flox repo"
sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Options::=\"--force-confdef\" -o Dpkg::Options::=\"--force-confold\" flox && sudo apt-get clean" "Installing flox"
sbx_exec "bash -c 'echo \"N\" | sudo dpkg --configure -a'" "Finalizing package config"

# Modern Toolchain
echo "Installing experimental tools (uv, gh, rg, jq, just)..."
sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gh ripgrep jq just && sudo apt-get clean" "Installing gh, rg, jq, just"
sbx_exec "curl -k -LsSf https://astral.sh/uv/install.sh | sh" "Installing uv"

# Agentic CLIs
echo "Installing AI CLIs (Gemini, Claude)..."
sbx_exec "sudo npm install -g -qq --no-fund --no-audit @google/gemini-cli" "Installing Gemini CLI"
sbx_exec "sudo npm install -g -qq --no-fund --no-audit @anthropic-ai/claude-code" "Installing Claude CLI"

# 10. Senior-Tier Shell Experience (ZSH + OMZ + P10K)
echo "Configuring senior-tier terminal experience..."
sbx_exec 'if [ ! -d "$HOME/.oh-my-zsh" ]; then git clone -c http.sslVerify=false --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh; fi' "Installing Oh My Zsh"
sbx_exec 'if [ ! -d "$HOME/powerlevel10k" ]; then git clone -c http.sslVerify=false --depth=1 https://github.com/romkatv/powerlevel10k.git ~/powerlevel10k; fi' "Installing Powerlevel10k"

# Polished .zshrc
zshrc_content="
# Ensure we always start in HOME
cd \$HOME

# P10K Instant Prompt
if [[ -r \"\${XDG_CACHE_HOME:-\$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh\" ]]; then
  source \"\${XDG_CACHE_HOME:-\$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh\"
fi

export ZSH=\"\$HOME/.oh-my-zsh\"
ZSH_THEME=\"powerlevel10k/powerlevel10k\"
plugins=(git)
source \$ZSH/oh-my-zsh.sh
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
source ~/powerlevel10k/powerlevel10k.zsh-theme

# AWS Identity
export AWS_PROFILE='$AWS_PROFILE'
export AWS_REGION='$AWS_REGION'

# Senior Aliases
alias ll='ls -FAlh'
alias cat='batcat 2>/dev/null || cat'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'

# Tool Paths
export PATH=\$HOME/.local/bin:\$PATH
"

sbx_exec "cat > ~/.zshrc <<'EOF'
$zshrc_content
EOF" "Configuring .zshrc"

# Force ZSH entry from bash (as sbx run might use bash initially)
bashrc_redirect="
# Automatically switch to ZSH if it exists
if [ -f /usr/bin/zsh ] && [ \"\$SHELL\" != \"/usr/bin/zsh\" ]; then
  export SHELL=/usr/bin/zsh
  cd \$HOME
  exec /usr/bin/zsh -l
fi
"
sbx_exec "cat >> ~/.bashrc <<'EOF'
$bashrc_redirect
EOF" "Configuring .bashrc to redirect to ZSH"

# Set ZSH as default shell in passwd
sb_user=$(sbx exec "$SANDBOX_NAME" -- whoami | head -n 1 | tr -d '\r')
sbx_exec "sudo usermod -s /usr/bin/zsh $sb_user" "Setting ZSH as default shell for $sb_user"

# 11. Workspace Provisioning (Isolated Clone)
echo "Provisioning internal workspace (Isolated from Host)..."
# We clone into /home/agent/workspace/agentic-sandbox
# Using -c http.sslVerify=false because of sandbox certificate issues
sbx_exec "mkdir -p /home/agent/workspace && cd /home/agent/workspace && git clone -c http.sslVerify=false https://github.com/enterthematrix/agentic-sandbox.git" "Cloning repository internally"
sbx_exec "cd /home/agent/workspace/agentic-sandbox && touch .aiexclude && ln -sf .aiexclude .geminiignore && ln -sf .aiexclude .claudeignore" "Configuring internal ignore symlinks"

echo "--------------------------------------------------"
echo "Setup Complete! Your 'Dune' sandbox is ready."
echo "Isolation: FULL (repo is cloned inside, no changes will leak to host Mac)"
echo "👉 To enter the sandbox: sbx run $SANDBOX_NAME"
echo "--------------------------------------------------"
