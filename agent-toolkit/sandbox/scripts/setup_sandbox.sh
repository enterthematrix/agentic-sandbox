#!/bin/bash

# setup_sandbox.sh - Pro "Dune" Sandbox (Host-Synced & Fully Isolated)
# Strategy: Hybrid Identity (Mounts for Dir, Copies for Config) + Isolated Workspace.

set -e

# Mirror AWS Profile choice
if [ -t 0 ]; then
    read -p "Enter AWS Profile to default to [slalom_aws]: " AWS_PROFILE
    AWS_PROFILE=${AWS_PROFILE:-slalom_aws}
else
    AWS_PROFILE="slalom_aws"
fi

# Configuration
SANDBOX_NAME="dune"
# Decoy mount to satisfy sbx - ensures NO host project files leak in.
HOST_DECOY_DIR=$(mktemp -d -t dune-isolation-XXXXXX)
# Path to store the host environment snapshot
HOST_ENV_FILE="$HOST_DECOY_DIR/.host_env"

echo "Starting 'Dune' Pro Setup (Seamless Host Integration)..."

# 1. Host Pre-flight
echo "Ensuring host dependencies..."
brew install uv gh jq colima docker docker-compose &> /dev/null || true
brew install --cask sbx &> /dev/null || true

# 2. Infrastructure Start
if ! colima status &> /dev/null; then
    echo "Starting Colima..."
    colima start --cpu 4 --memory 8 --vm-type=vz --vz-rosetta --mount-type=virtiofs
fi
docker context use colima &> /dev/null

# 3. Environment Extraction
echo "Capturing host environment variables from ~/.zshrc..."
grep -E "^export |^alias " ~/.zshrc | grep -v "eval \"\$(brew shellenv)\"" > "$HOST_ENV_FILE" || true
echo "export PATH=\$PATH:/opt/homebrew/bin:/usr/local/bin" >> "$HOST_ENV_FILE"

# 4. Sandbox Creation
if sbx ls | grep -q "$SANDBOX_NAME"; then
    echo "Sandbox '$SANDBOX_NAME' exists. Re-provisioning..."
else
    echo "Creating isolated sandbox '$SANDBOX_NAME'..."
    sbx create --name "$SANDBOX_NAME" --memory 8g --cpus 4 shell \
        "$HOST_DECOY_DIR" \
        "$HOME/.aws:ro"
fi

# 5. Robust Execution Helper
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

# 6. Warm-up
sbx_exec "true" "Initializing Docker daemon"

# 7. Identity & Aesthetics (Optimized for SSH reliability)
echo "Synchronizing identity and aesthetics with host..."

inject_file_raw() {
    local target=$1
    local source=$2
    if [ -f "$source" ]; then
        local base64_content=$(base64 < "$source")
        sbx_exec "echo '$base64_content' | base64 -d > $target" "Injecting $(basename "$source")"

        # Verify file was actually copied
        if ! sbx_exec "test -f $target" "Verifying $(basename "$source") exists"; then
            echo "ERROR: Failed to inject $source to $target"
            return 1
        fi
    fi
}

# Live Sync for AWS
sbx_exec "rm -rf ~/.aws && ln -s \"$HOME/.aws\" ~/.aws" "Linking .aws (Live Sync)"


# PROPER SSH FIX: Copy keys but create a custom Sandbox config
sbx_exec "mkdir -p ~/.ssh && chmod 700 ~/.ssh" "Preparing SSH directory"
if [ -f ~/.ssh/id_ed25519 ]; then
    inject_file_raw "/home/agent/.ssh/id_ed25519" "$HOME/.ssh/id_ed25519"
    sbx_exec "chmod 600 ~/.ssh/id_ed25519" "Securing private key"

    # Verify key was actually copied
    if ! sbx_exec "test -f ~/.ssh/id_ed25519" "Verifying private key exists"; then
        echo "ERROR: Failed to copy SSH private key to sandbox"
        exit 1
    fi
fi
[ -f ~/.ssh/id_ed25519.pub ] && inject_file_raw "/home/agent/.ssh/id_ed25519.pub" "$HOME/.ssh/id_ed25519.pub"

# Create Sandbox-optimized SSH config (Using Port 443 fallback for reliability)
sbx_exec "cat > ~/.ssh/config <<'EOF'
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no
EOF" "Creating optimized SSH config"

# Verify SSH config was created
if ! sbx_exec "test -f ~/.ssh/config" "Verifying SSH config exists"; then
    echo "ERROR: Failed to create SSH config in sandbox"
    exit 1
fi

# Identity & Aesthetics
inject_file_raw "/home/agent/.gitconfig" "$HOME/.gitconfig"
inject_file_raw "/home/agent/.p10k.zsh" "$HOME/.p10k.zsh"

# 8. Guest Provisioning
echo "Provisioning internal environment..."
sbx_exec "sudo apt-get update -qq" "Updating package lists"
for pkg in zsh git openssh-client nodejs npm ca-certificates gh ripgrep jq just; do
    sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $pkg && sudo apt-get clean" "Installing $pkg"
done

sbx_exec "curl -k -LsSf https://astral.sh/uv/install.sh | sh" "Installing uv"
sbx_exec "sudo rm -rf /usr/local/lib/node_modules/@google/gemini-cli /usr/local/lib/node_modules/@anthropic-ai/claude-code" "Cleaning stale CLIs"
sbx_exec "sudo npm install -g -qq --no-fund --no-audit @google/gemini-cli @anthropic-ai/claude-code" "Installing CLIs"

# Shell Dirs (IDEMPOTENT FIX)
sbx_exec "rm -rf ~/.oh-my-zsh && git clone -c http.sslVerify=false --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh" "Installing Oh My Zsh"
sbx_exec "rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k && git clone -c http.sslVerify=false --depth=1 https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k" "Installing Powerlevel10k"

# 9. Create .zshrc
sbx_exec "cat > ~/.zshrc <<'EOF'
# 1. Force proper terminal with full color support
export TERM=xterm-256color
export COLORTERM=truecolor

# 2. Start in HOME
cd \$HOME

# 3. Source Host Environment Snapshot
[ -f \"$HOST_ENV_FILE\" ] && source \"$HOST_ENV_FILE\"

# 4. Enable color output for common commands
export CLICOLOR=1
export LS_COLORS='di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43'
alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias diff='diff --color=auto'

# 5. P10K Instant Prompt (with gitstatus disabled for exec compatibility)
if [[ -r \"\${XDG_CACHE_HOME:-\$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh\" ]]; then
  source \"\${XDG_CACHE_HOME:-\$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh\"
fi

# 6. OMZ Setup
export ZSH=\"\$HOME/.oh-my-zsh\"
ZSH_THEME=\"powerlevel10k/powerlevel10k\"
plugins=(git colored-man-pages)
DISABLE_AUTO_UPDATE=true
source \$ZSH/oh-my-zsh.sh

# 7. Aesthetics
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# 8. Critical Overrides
export SHELL=/usr/bin/zsh
export AWS_SDK_LOAD_CONFIG=1
export AWS_PROFILE='$AWS_PROFILE'
export PATH=\$HOME/.local/bin:\$PATH

# 9. Force colorized prompt even in non-interactive mode
autoload -U colors && colors
EOF" "Configuring .zshrc"

sbx_exec "sudo usermod -s /usr/bin/zsh agent" "Setting default shell"
sbx_exec "echo 'exec zsh -l' > ~/.bash_profile" "Configuring bash_profile"
sbx_exec "mkdir -p ~/workspace" "Creating isolated ~/workspace"

# 10. Post-Setup Validation
echo "Running post-setup validation..."

# Test SSH connectivity to GitHub
echo "  - Testing SSH connection to GitHub..."
if sbx_exec "ssh -T git@github.com 2>&1 | grep -q 'successfully authenticated'" "Validating GitHub SSH"; then
    SSH_STATUS="✓ WORKING"
else
    echo "ERROR: SSH authentication to GitHub failed"
    echo "Run 'sbx exec dune -- ssh -T git@github.com' to debug"
    SSH_STATUS="✗ FAILED"
fi

# Test git clone capability
echo "  - Testing git clone functionality..."
if sbx_exec "cd /tmp && rm -rf test-clone && git clone --depth 1 git@github.com:enterthematrix/agentic-sandbox.git test-clone && rm -rf test-clone" "Testing git clone"; then
    GIT_STATUS="✓ WORKING"
else
    echo "ERROR: Git clone failed"
    echo "Run 'sbx exec dune -- git clone git@github.com:enterthematrix/agentic-sandbox.git /tmp/test' to debug"
    GIT_STATUS="✗ FAILED"
fi

# Test AWS credentials
echo "  - Testing AWS credentials..."
if sbx_exec "aws sts get-caller-identity --profile $AWS_PROFILE > /dev/null 2>&1" "Validating AWS credentials"; then
    AWS_STATUS="✓ WORKING (Profile: $AWS_PROFILE)"
else
    AWS_STATUS="⚠ NOT CONFIGURED or expired (Profile: $AWS_PROFILE)"
fi

echo "--------------------------------------------------"
echo "Setup Complete! Validation Results:"
echo "  SSH:   $SSH_STATUS"
echo "  Git:   $GIT_STATUS"
echo "  AWS:   $AWS_STATUS"
echo ""
echo "👉 To enter: sbx run dune"
echo "--------------------------------------------------"

# Exit with error if critical services failed
if [[ "$SSH_STATUS" == *"FAILED"* ]] || [[ "$GIT_STATUS" == *"FAILED"* ]]; then
    echo "ERROR: Critical validation failed. Please review errors above."
    exit 1
fi
