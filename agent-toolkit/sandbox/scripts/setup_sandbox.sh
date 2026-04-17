#!/bin/bash

# setup_sandbox.sh - Pro "Dune" Sandbox (Host-Synced & Fully Isolated)
# Strategy: Host is the Source of Truth (Live Mounts) + Internal Isolated Workspace.

set -e

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

# 3. Environment Extraction (Snapshot Sync)
echo "Capturing host environment variables from ~/.zshrc..."
grep -E "^export |^alias " ~/.zshrc | grep -v "eval \"\$(brew shellenv)\"" > "$HOST_ENV_FILE" || true
echo "export PATH=\$PATH:/opt/homebrew/bin:/usr/local/bin" >> "$HOST_ENV_FILE"

# 4. Sandbox Creation (Directory Mounts)
if sbx ls | grep -q "$SANDBOX_NAME"; then
    echo "Sandbox '$SANDBOX_NAME' exists. Re-provisioning..."
else
    echo "Creating isolated sandbox '$SANDBOX_NAME' with Live Host Sync..."
    # Mounting DIRECTORIES is most reliable in sbx. 
    # Individual files will be injected manually.
    sbx create --name "$SANDBOX_NAME" --memory 8g --cpus 4 shell \
        "$HOST_DECOY_DIR" \
        "$HOME/.aws:ro" \
        "$HOME/.ssh:ro"
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

# 7. Identity & Aesthetics (Live Symlinks + Injections)
echo "Synchronizing identity and aesthetics with host..."

inject_file_raw() {
    local target=$1
    local source=$2
    if [ -f "$source" ]; then
        local content=$(cat "$source")
        sbx_exec "cat > $target <<'EOF'
$content
EOF" "Injecting $(basename "$source")"
    fi
}

# Live Sync for directories
sbx_exec "rm -rf ~/.aws && ln -s \"$HOME/.aws\" ~/.aws" "Linking .aws (Live Sync)"
sbx_exec "rm -rf ~/.ssh && ln -s \"$HOME/.ssh\" ~/.ssh" "Linking .ssh (Live Sync)"

# Static Mirroring for files
inject_file_raw "/home/agent/.gitconfig" "$HOME/.gitconfig"
inject_file_raw "/home/agent/.p10k.zsh" "$HOME/.p10k.zsh"

# Mirror AWS Profile choice for environment setup
if [ -t 0 ]; then
    read -p "Enter AWS Profile to default to [slalom_aws]: " AWS_PROFILE
    AWS_PROFILE=${AWS_PROFILE:-slalom_aws}
else
    AWS_PROFILE="slalom_aws"
fi

# 8. Guest Provisioning
echo "Provisioning internal environment (Sequential)..."
sbx_exec "sudo apt-get update -qq" "Updating package lists"
for pkg in zsh git nodejs npm ca-certificates gh ripgrep jq just; do
    sbx_exec "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $pkg && sudo apt-get clean" "Installing $pkg"
done

sbx_exec "curl -k -LsSf https://astral.sh/uv/install.sh | sh" "Installing uv"
sbx_exec "sudo rm -rf /usr/local/lib/node_modules/@google/gemini-cli /usr/local/lib/node_modules/@anthropic-ai/claude-code" "Cleaning stale CLIs"
sbx_exec "sudo npm install -g -qq --no-fund --no-audit @google/gemini-cli @anthropic-ai/claude-code" "Installing CLIs"

# Shell Dirs
sbx_exec "rm -rf ~/.oh-my-zsh && git clone -c http.sslVerify=false --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh" "Installing Oh My Zsh"
sbx_exec "rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k && git clone -c http.sslVerify=false --depth=1 https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k" "Installing Powerlevel10k"

# 9. Create .zshrc (The Seamless Connector)
sbx_exec "cat > ~/.zshrc <<'EOF'
# 1. Start in HOME
cd \$HOME

# 2. Source Host Environment Snapshot (Snapshot Sync)
[ -f \"$HOST_ENV_FILE\" ] && source \"$HOST_ENV_FILE\"

# 3. P10K Instant Prompt
if [[ -r \"\${XDG_CACHE_HOME:-\$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh\" ]]; then
  source \"\${XDG_CACHE_HOME:-\$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh\"
fi

# 4. OMZ Setup
export ZSH=\"\$HOME/.oh-my-zsh\"
ZSH_THEME=\"powerlevel10k/powerlevel10k\"
plugins=(git)
source \$ZSH/oh-my-zsh.sh

# 5. Aesthetics (Mirrored from Host)
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# 6. Critical Overrides
export SHELL=/usr/bin/zsh
export AWS_SDK_LOAD_CONFIG=1
export AWS_PROFILE='$AWS_PROFILE'
export PATH=\$HOME/.local/bin:\$PATH
EOF" "Configuring .zshrc"

# Ensure ZSH is the default entry point
sbx_exec "sudo usermod -s /usr/bin/zsh agent" "Setting default shell"
sbx_exec "echo 'exec zsh -l' > ~/.bash_profile" "Configuring bash_profile"

# 10. Workspace Creation
sbx_exec "mkdir -p ~/workspace" "Creating isolated ~/workspace"

echo "--------------------------------------------------"
echo "Setup Complete! sandbox is ready."
echo "👉 To enter: sbx run dune"
echo "--------------------------------------------------"
