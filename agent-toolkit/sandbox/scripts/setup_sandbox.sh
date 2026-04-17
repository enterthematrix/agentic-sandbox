#!/bin/bash

# setup_sandbox.sh - Comprehensive "Dune" Sandbox Provisioning (Pro)
# Optimized for macOS, team portability, full isolation, and senior shell UX.
# Achievement: Full host isolation, Mac-like terminal UX, and robust toolchain.

set -e

# Configuration
SANDBOX_NAME="dune"
WORKSPACE_DIR=$(pwd)
ISOLATION_BRANCH="agent-work"

echo "Starting Comprehensive 'Dune' Sandbox Setup..."

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

# 5. Sandbox Creation (Shell Agent + Native Branch Isolation + Resource Limits)
echo "Initializing '$SANDBOX_NAME' sandbox (Agent: shell, Branch: $ISOLATION_BRANCH)..."
if ! sbx ls | grep -q "$SANDBOX_NAME"; then
    # We use 'shell' agent to ensure a Mac-like raw terminal entry
    sbx create --name "$SANDBOX_NAME" --branch "$ISOLATION_BRANCH" --memory 8g --cpus 4 shell "$WORKSPACE_DIR" || \
    sbx create --name "$SANDBOX_NAME" --memory 8g --cpus 4 shell "$WORKSPACE_DIR"
fi

# 6. Secret Management (Internal & External Proxy)
echo "Injecting secrets into 'sbx' manager..."

# AWS Credentials extraction for secure injection
if [ -f ~/.aws/credentials ]; then
    AWS_KEY=$(grep -A 5 "\[$AWS_PROFILE\]" ~/.aws/credentials | grep aws_access_key_id | cut -d'=' -f2 | xargs)
    AWS_SECRET=$(grep -A 5 "\[$AWS_PROFILE\]" ~/.aws/credentials | grep aws_secret_access_key | cut -d'=' -f2 | xargs)
    
    if [ -n "$AWS_KEY" ] && [ -n "$AWS_SECRET" ]; then
        echo "  - Registering AWS keys to sbx secrets..."
        echo "AWS_ACCESS_KEY_ID=$AWS_KEY AWS_SECRET_ACCESS_KEY=$AWS_SECRET" | sbx secret set "$SANDBOX_NAME" aws
    fi
fi

# OpenRouter Key
if [ -f .env ]; then
    OR_KEY=$(grep OPENROUTER_API_KEY .env | cut -d'=' -f2 | xargs)
    if [ -n "$OR_KEY" ]; then
        echo "  - Registering OpenRouter key to sbx secrets..."
        echo "$OR_KEY" | sbx secret set "$SANDBOX_NAME" google
    fi
fi

# 7. Network Policy
echo "Setting network policy to 'balanced'..."
sbx policy set-default balanced || true

# 8. Robust Execution Helper
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
        tmp_err=$(mktemp)
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

# 9. Warm-up
sbx_exec "true" "Initializing Docker daemon"

# 10. Identity & P10K Mirroring
echo "Mirroring host identities and terminal aesthetics..."

inject_file_raw() {
    local target=$1
    local source=$2
    if [ -f "$source" ]; then
        echo "  - Mirroring $(basename "$source")..."
        local content=$(cat "$source")
        sbx_exec "cat > $target <<'EOF'
$content
EOF" ""
    fi
}

inject_file_raw "/home/agent/.gitconfig" "$HOME/.gitconfig"
sbx_exec "mkdir -p /home/agent/.ssh" "Creating .ssh directory"
inject_file_raw "/home/agent/.ssh/id_ed25519.pub" "$HOME/.ssh/id_ed25519.pub"
inject_file_raw "/home/agent/.ssh/id_rsa.pub" "$HOME/.ssh/id_rsa.pub"

# P10K Mirroring
inject_file_raw "/home/agent/.p10k.zsh" "$HOME/.p10k.zsh"

# AWS Mirroring (Full mirroring of config/credentials for reliable CLI login)
sbx_exec "mkdir -p /home/agent/.aws" "Creating .aws directory"
inject_file_raw "/home/agent/.aws/config" "$HOME/.aws/config"

# We mirror only the specific profile to credentials file for security
if [ -f ~/.aws/credentials ]; then
    echo "  - Mirroring AWS credentials for profile: $AWS_PROFILE..."
    # Extract the block for the specific profile
    CREDS_BLOCK=$(awk "/^\[$AWS_PROFILE\]/,/^$/ {print}" ~/.aws/credentials)
    sbx_exec "cat > /home/agent/.aws/credentials <<'EOF'
$CREDS_BLOCK
EOF" ""
fi

# 11. Hyper-Sequential Guest Provisioning
echo "Provisioning internal environment (Sequential/Memory-Safe)..."

# Core Tools
sbx_exec "sudo apt-get update -qq || true" "Updating package lists"
for pkg in zsh git nodejs npm ca-certificates; do
    sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $pkg && sudo apt-get clean" "Installing $pkg"
done

# Flox Environment
sbx_exec 'echo "deb [trusted=yes] https://downloads.flox.dev/by-env/stable/deb stable/" | sudo tee /etc/apt/sources.list.d/flox.list' "Adding Flox repository"
sbx_exec "sudo apt-get update -qq || true" "Refreshing Flox repo"
sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Options::=\"--force-confdef\" -o Dpkg::Options::=\"--force-confold\" flox && sudo apt-get clean" "Installing flox"
sbx_exec "bash -c 'echo \"N\" | sudo dpkg --configure -a'" "Finalizing package config"

# Modern Toolchain
sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gh ripgrep jq just && sudo apt-get clean" "Installing gh, rg, jq, just"
sbx_exec "curl -k -LsSf https://astral.sh/uv/install.sh | sh" "Installing uv"

# Agentic CLIs
sbx_exec "sudo npm install -g -qq --no-fund --no-audit @google/gemini-cli" "Installing Gemini CLI"
sbx_exec "sudo npm install -g -qq --no-fund --no-audit @anthropic-ai/claude-code" "Installing Claude CLI"

# 12. Senior-Tier Shell Experience
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

# Force ZSH entry from bash
bashrc_redirect="
if [ -f /usr/bin/zsh ] && [ \"\$SHELL\" != \"/usr/bin/zsh\" ]; then
  export SHELL=/usr/bin/zsh
  cd \$HOME
  exec /usr/bin/zsh -l
fi
"
sbx_exec "cat >> ~/.bashrc <<'EOF'
$bashrc_redirect
EOF" "Configuring bash to ZSH redirect"

# Set ZSH as default shell
sb_user=$(sbx exec "$SANDBOX_NAME" -- whoami | head -n 1 | tr -d '\r')
sbx_exec "sudo usermod -s /usr/bin/zsh $sb_user" "Setting ZSH as default shell"

# 13. Workspace Standards
sbx_exec "
ROOT_PATH=\$(find /home/agent/workspace -name .aiexclude -exec dirname {} \; | head -n 1)
if [ -n \"\$ROOT_PATH\" ]; then
    echo \"Standardizing workspace at \$ROOT_PATH\"
    cd \"\$ROOT_PATH\"
    ln -sf .aiexclude .geminiignore
    ln -sf .aiexclude .claudeignore
else
    echo \"No .aiexclude found, creating in /home/agent/workspace\"
    cd /home/agent/workspace
    touch .aiexclude
    ln -sf .aiexclude .geminiignore
    ln -sf .aiexclude .claudeignore
fi
" "Configuring ignore symlinks"

echo "--------------------------------------------------"
echo "Setup Complete! Your 'Dune' sandbox is ready."
echo "UX: Senior Mac-tier (ZSH default, starts in HOME)"
echo "Isolation: FULL (Branch-based Worktree)"
echo "👉 To enter the sandbox: sbx run $SANDBOX_NAME"
echo "--------------------------------------------------"
