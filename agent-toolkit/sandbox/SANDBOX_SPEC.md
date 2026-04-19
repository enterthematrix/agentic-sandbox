# Dune Sandbox - Implementation Specification

## 1. Overview

### Purpose
Create an isolated development sandbox that provides a Mac-like terminal experience while ensuring zero host file leakage. The sandbox must maintain access to host credentials (AWS, SSH, Git) without exposing project files.

### Key Requirements
- Complete isolation from host project directories
- Seamless access to host credentials and configurations
- Mac-like terminal experience with colors and modern shell
- Automated validation of critical functionality
- Graceful degradation when host dependencies are missing

---

## 2. Architecture

### 2.1 Isolation Model
The sandbox must mount a temporary empty directory to satisfy the `sbx` runtime requirement while preventing any host project files from being accessible within the sandbox environment.

### 2.2 Configuration Sync Strategy

The implementation must use THREE different sync strategies:

**Live Mount (Read-Only)**
- AWS credentials directory must be mounted live
- Changes on host must be immediately visible in sandbox
- No sandbox-to-host write permissions allowed

**Snapshot Copy**
- SSH private keys must be copied once at setup time
- Git configuration must be copied once at setup time  
- Terminal theme configuration must be copied once at setup time
- Files must be verified after copy; setup must fail if copy fails

**Filtered Snapshot**
- Host shell configuration must be parsed for exports and aliases only
- Brew-specific paths must be filtered out
- Result must be stored in temporary file and sourced by guest shell

### 2.3 Resource Allocation
- Sandbox must use 8GB RAM
- Sandbox must use 4 CPU cores
- Backend must use Colima with vz-rosetta virtualization

---

## 3. Pre-Setup Validation

### 3.1 Required Host Checks

Before beginning setup, the script must validate:

**Critical Files**
- AWS directory existence (create empty if missing)
- SSH private key existence (ed25519 format required)
- Git configuration file existence
- Shell configuration file existence (zsh preferred, bash acceptable)

**AWS Profile Validation**
- Prompt user for AWS profile name (default: slalom_aws)
- Validate profile exists in AWS config file
- Warn if profile not found but continue setup

### 3.2 Warning Collection

All validation issues must be collected in a warnings array and displayed at the end of setup with:
- Clear description of what's missing
- Impact on sandbox functionality
- Remediation instructions where applicable

---

## 4. Host Environment Setup

### 4.1 Dependency Installation
The script must ensure these tools are installed via Homebrew:
- uv, gh, jq, colima, docker, docker-compose, sbx

Silent failures are acceptable (tools may already be installed).

### 4.2 Virtualization Runtime
The script must:
- Check if Colima is running
- Start Colima with specified resources if not running
- Configure Docker to use Colima context

### 4.3 Environment Extraction
The script must:
- Attempt to read host zsh configuration first
- Fall back to bash configuration if zsh not found
- Create empty configuration if neither exists
- Filter out brew-specific initialization commands
- Capture all export statements and aliases
- Store result in temporary file accessible to guest

---

## 5. Sandbox Creation

### 5.1 Initialization
The script must:
- Create sandbox named "dune" if it doesn't exist
- Re-use existing sandbox if already created (no recreation)
- Mount temporary empty directory as primary workspace
- Mount AWS directory as read-only secondary mount

### 5.2 Execution Helper
The script must implement retry logic for sandbox commands because:
- Container may not be ready immediately after creation
- Docker daemon startup is asynchronous
- Transient failures are common

Retry behavior:
- Maximum 5 attempts with 5-second delays
- Distinguish between "container not ready" and "command failed"
- Both error types should retry
- Report failure after max retries exhausted

### 5.3 Initial Warmup
Before provisioning, the script must run a no-op command to ensure the container is fully started and accepting commands.

---

## 6. Identity and Configuration Setup

### 6.1 File Injection Requirements

The script must implement a reliable method to copy files from host to guest that:
- Handles large files (up to 100KB)
- Preserves file contents exactly
- Works across different base64 implementations (macOS vs GNU)
- Verifies file exists after injection
- Returns error if injection fails

### 6.2 AWS Configuration
- The AWS directory must be accessible via symbolic link to mounted path
- Symlink must point to the read-only mount created during sandbox init

### 6.3 SSH Configuration

**Key Management**
- Private SSH key (ed25519) must be copied to guest
- Public SSH key must be copied to guest if it exists
- Private key permissions must be set to 600
- SSH directory permissions must be set to 700
- Setup must exit with error if private key copy fails

**SSH Client Configuration**
The script must create an SSH client config that:
- Uses port 443 for GitHub connections (firewall traversal)
- Points to ssh.github.com hostname
- Disables strict host key checking
- Specifies identity file path

**Missing Key Handling**
If host has no SSH key:
- Show warning with key generation command
- Continue setup (don't fail)
- Mark SSH status as problematic in final report

### 6.4 Git Identity
- Git configuration must be copied from host to guest
- If missing, warn user but continue setup

### 6.5 Terminal Theme
- PowerLevel10k configuration must be copied from host to guest
- If copy fails or file is missing, create minimal fallback configuration
- Failure should not block setup completion

---

## 7. Guest Environment Provisioning

### 7.1 System Packages
The script must install via apt (in order):
- zsh (shell)
- git (version control)
- openssh-client (SSH functionality)
- nodejs, npm (runtime and package manager)
- ca-certificates (TLS/SSL)
- gh (GitHub CLI)
- ripgrep (fast search)
- jq (JSON processing)
- just (command runner)

Each package installation must:
- Use non-interactive mode
- Run quietly (suppress normal output)
- Clean apt cache after installation
- Use the retry execution helper

### 7.2 Python Tooling
- Install uv package manager via official installer
- Use HTTPS with SSL verification disabled (internal network compatibility)

### 7.3 Node Global Packages
The script must:
- Remove any existing installations first (idempotency)
- Globally install @google/gemini-cli
- Globally install @anthropic-ai/claude-code
- Run quietly without funding/audit messages

### 7.4 Shell Framework

**Oh My Zsh**
- Must be installed from GitHub
- Must do clean install (remove existing first for idempotency)
- Use shallow clone (depth=1) for speed
- Disable SSL verification for internal network compatibility

**PowerLevel10k Theme**
- Must be installed as Oh My Zsh custom theme
- Must do clean install (remove existing first)
- Use shallow clone (depth=1)
- Disable SSL verification

---

## 8. Shell Configuration

### 8.1 Terminal Capabilities
The .zshrc must configure:

**Color Support**
- TERM variable set to xterm-256color
- COLORTERM variable set to truecolor
- LS_COLORS configured for file type differentiation
- Color-enabled aliases for ls, grep, diff

**Starting Location**
- Shell must start in home directory

**Environment Sourcing**
- Must source the captured host environment file
- File path must use variable not hardcoded path

**PowerLevel10k Integration**
- Must load instant prompt if available
- Must source theme configuration if file exists

**Oh My Zsh Configuration**
- Must use PowerLevel10k theme
- Must enable git plugin
- Must enable colored-man-pages plugin
- Must disable automatic updates

**Critical Variables**
- SHELL must be set to zsh path
- AWS_SDK_LOAD_CONFIG must be enabled
- AWS_PROFILE must be set to user-chosen profile
- PATH must include local bin directory

**Color Initialization**
- Must load zsh color functions

### 8.2 Shell Entry Point
- The agent user's default shell must be set to zsh via usermod
- A bash profile must be created that automatically launches zsh
- This ensures zsh is used even when bash is invoked

### 8.3 Workspace Directory
An empty workspace directory must be created at ~/workspace where users will manually clone repositories.

---

## 9. Post-Setup Validation

### 9.1 SSH/GitHub Connectivity Test

The script must:
- Attempt SSH connection to GitHub
- Capture authentication response
- Parse for "successfully authenticated" message
- Mark as WORKING or FAILED based on result
- Provide troubleshooting command if failed

### 9.2 Git Clone Functionality Test

The script must:
- Clone a real repository (enterthematrix/agentic-sandbox) to /tmp
- Use depth=1 for speed
- Clean up cloned directory after test
- Mark as WORKING or FAILED based on result
- Provide troubleshooting command if failed

### 9.3 AWS Credentials Test

**Critical: This test must NOT use retry logic**

The script must:
- Use direct sandbox exec (not retry wrapper)
- Attempt to call aws sts get-caller-identity
- Suppress all output
- Mark as WORKING if succeeds, NOT CONFIGURED if fails
- Treat failure as expected (credentials often missing/expired)
- Must complete in under 5 seconds (no retry delays)

---

## 10. Status Reporting

### 10.1 Validation Results
The script must display:
- SSH status with ✓ or ✗ symbol
- Git status with ✓ or ✗ symbol  
- AWS status with ✓ or ⚠ symbol

### 10.2 Pre-flight Warnings
If any warnings were collected during validation:
- Display "⚠ Pre-flight Warnings:" header
- List each warning with bullet point
- Add blank line after warnings section

### 10.3 Success Criteria
The script must:
- Show command to enter sandbox (sbx run dune)
- Exit with error code 1 if SSH or Git marked as FAILED
- Exit with success code 0 if only AWS has issues

---

## 11. Behavior Requirements

### 11.1 Idempotency
- Running script multiple times on same sandbox must succeed
- Re-provisioning must not cause errors
- Existing files should be replaced, not cause conflicts

### 11.2 Error Handling Philosophy
- Use fail-fast for critical failures (SSH copy, Git clone test)
- Use warn-and-continue for optional features (terminal theme, AWS creds)
- Always show actionable error messages with fix commands
- Never fail silently

### 11.3 Output Verbosity
- Show progress messages for long-running operations
- Suppress routine command output (apt, npm)
- Always show validation results clearly
- Use visual indicators (✓, ✗, ⚠) for status

---

## 12. Expected User Experience

### 12.1 After Setup Completion
When user runs `sbx run dune`, they should experience:

**Terminal Environment**
- Immediate zsh shell (no bash intermediate)
- Colored output (blue directories, colored Git status)
- PowerLevel10k prompt with theme customization
- Starting directory: /home/agent

**Functional Capabilities**
- Git clone/push/pull works for private repositories
- GitHub authentication succeeds via SSH
- AWS CLI commands work if credentials configured
- No host project files visible in filesystem

**Environment Variables**
- Host exports available (from captured .zshrc)
- AWS profile set and usable
- Standard paths configured correctly

### 12.2 On Missing Dependencies
If critical files missing on host:
- Setup completes but shows warnings
- Validation shows specific failures (SSH ✗, Git ✗)
- User receives actionable fix instructions
- Script exits with error code

---

## 13. Known Limitations

### 13.1 Configuration Staleness
- SSH keys, Git config, theme are copied once at setup
- Changes on host not reflected in running sandbox
- User must re-run setup or manually update to refresh

### 13.2 AWS Profile Switching
- Profile is hardcoded in .zshrc at setup time
- To use different profile, must export AWS_PROFILE manually inside sandbox
- Or re-run setup script with different profile choice

### 13.3 SSH Key Requirements
- Only ed25519 key type supported (id_ed25519)
- RSA or other key types will cause validation failure
- User must have key at expected path (~/.ssh/id_ed25519)

### 13.4 Large File Handling
- Terminal theme file (p10k.zsh) may be 80KB+
- Base64 encoding/decoding may fail or timeout
- Fallback: create minimal theme configuration or skip

---

## 14. Security Considerations

### 14.1 Private Key Storage
- SSH private key is copied to container filesystem
- Key exists only in container, not on host mount
- Container destruction removes key copy
- Risk: Container compromise exposes key

### 14.2 Credential Access
- AWS credentials live-mounted (immediate host changes visible)
- Good: Credential rotation automatically available
- Risk: Any AWS operations visible on host

### 14.3 Read-Only Enforcement
- All mounts must be :ro (read-only)
- Sandbox cannot modify host files
- Protection against malicious or buggy code

### 14.4 Temporary Files
- Temporary decoy directory created by OS
- Contains captured environment variables
- Automatically cleaned by OS temp mechanisms

---

## 15. Testing Criteria

An agent implementing this spec should verify:

### 15.1 Edge Case Handling
- [ ] Script runs successfully on Mac with no .zshrc
- [ ] Script runs successfully with no SSH keys
- [ ] Script runs successfully with no AWS credentials
- [ ] Script shows appropriate warnings for each missing item
- [ ] Script can be re-run on existing sandbox without errors

### 15.2 Validation Accuracy
- [ ] SSH test actually connects to GitHub (not just file check)
- [ ] Git test performs full clone operation
- [ ] AWS test completes quickly on failure (no retry loop)
- [ ] Status symbols match actual functionality

### 15.3 User Experience
- [ ] Colors visible in interactive shell
- [ ] Git operations work end-to-end
- [ ] No host project files visible
- [ ] Starting directory is /home/agent
- [ ] Zsh is default shell (no manual activation needed)

### 15.4 Error Messages
- [ ] Each error shows what failed
- [ ] Each error shows how to fix it
- [ ] Errors distinguish between "missing" and "failed"
- [ ] Exit codes match failure severity

---

## 16. GUI Support (Optional)

### 16.1 Overview
The sandbox supports running graphical applications via X11 forwarding. This allows Firefox, VS Code, and other GUI apps to run inside the isolated container while displaying on the host Mac screen.

**Key Design Principles:**
- GUI support is optional and non-blocking
- Setup succeeds even if XQuartz is not installed
- User is prompted to install XQuartz interactively
- All GUI functionality degrades gracefully

### 16.2 Prerequisites

**Host Requirements:**
- XQuartz must be installed: `brew install --cask xquartz`
- XQuartz TCP connections must be enabled
- XQuartz must be running before launching GUI apps
- X11 access control should be disabled for development

**XQuartz Configuration:**
```bash
# Enable TCP connections (required once)
defaults write org.xquartz.X11 nolisten_tcp 0

# Disable access control (required per session)
DISPLAY=:0 /opt/X11/bin/xhost +

# Restart XQuartz after configuration
killall Xquartz X11.bin
open -a XQuartz
```

### 16.3 Pre-Setup XQuartz Detection

The setup script must:

**Check for XQuartz Installation:**
- Look for `/opt/X11` directory or XQuartz.app
- If not found, show interactive prompt with options

**Interactive Prompt Format:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GUI Support Available (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XQuartz is not installed. This is optional but enables:
  • Firefox browser inside sandbox
  • VS Code editor inside sandbox
  • Other GUI applications

You can:
  1. Install now: brew install --cask xquartz
     (Requires restart after installation)

  2. Continue with CLI-only experience
     (Terminal, Git, AWS CLI will work perfectly)

Install XQuartz for GUI support? (y/N):
```

**XQuartz TCP Check:**
- If XQuartz is installed, check: `defaults read org.xquartz.X11 nolisten_tcp`
- If TCP disabled (value = 1), show warning with remediation steps
- Offer to continue anyway or exit to configure XQuartz

### 16.4 Sandbox Configuration

**X11 Socket Mount:**
```bash
# sbx mount syntax (not Docker syntax)
/tmp/.X11-unix:ro

# Incorrect (Docker syntax - do not use):
/tmp/.X11-unix:/tmp/.X11-unix:ro
```

**DISPLAY Variable:**
- Must use host IP address (not `host.docker.internal`)
- Script must capture host IP dynamically:
  ```bash
  HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}')
  export DISPLAY="${HOST_IP}:0"
  ```
- `host.docker.internal:0` does NOT work (IPv6 routing issue)

### 16.5 Guest Provisioning

**Required X11 Packages:**
```bash
# Base X11 libraries
x11-apps libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 
libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 
libxss1 libxtst6

# GUI support libraries
libnss3 libgdk-pixbuf-2.0-0 libgtk-3-0 libgbm1 libasound2t64

# Graphics libraries (prevents Firefox errors)
libpci3 libegl1 dbus-x11
```

**Compression Tools:**
```bash
bzip2 xz-utils  # Required for extracting Firefox tarball
```

**GUI Applications:**

*Firefox ESR (Recommended)*
- Google Chrome does not have ARM64 Linux builds
- Download: `https://download.mozilla.org/?product=firefox-esr-latest-ssl&os=linux64-aarch64&lang=en-US`
- Format: tar.xz archive
- Install location: `/opt/firefox`
- Symlink: `/usr/local/bin/firefox -> /opt/firefox/firefox`

*VS Code*
- Download: `https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-arm64`
- Format: .deb package (ARM64)
- Install: `apt-get install /tmp/vscode.deb`

### 16.6 Installation Sequence

**Order of Operations:**
1. Install base packages (zsh, git, etc.)
2. Check if GUI_AVAILABLE flag is true
3. If true, install X11 libraries in single batch command
4. If true, install GUI applications (Firefox, VS Code)
5. Continue with shell configuration (Oh-My-Zsh, etc.)

**Idempotency:**
- Firefox: Must remove `/opt/firefox` before extracting
  ```bash
  sudo rm -rf /opt/firefox && tar -xJf firefox.tar.bz2 && sudo mv firefox /opt/firefox
  ```
- VS Code: apt handles reinstalls automatically

### 16.7 Shell Configuration

The `.zshrc` must include:
```bash
# GUI Support (X11 Display)
export DISPLAY='${HOST_IP}':0
```

Where `${HOST_IP}` is the actual IP address captured during setup (e.g., 192.168.50.235).

### 16.8 Validation

**GUI Capability Test:**
```bash
# Check if both firefox and code binaries exist
if which firefox > /dev/null 2>&1 && which code > /dev/null 2>&1; then
    GUI_STATUS="✓ AVAILABLE (Firefox & VS Code installed)"
else
    GUI_STATUS="⚠ NOT AVAILABLE (XQuartz not installed)"
fi
```

**Status Report Must Show:**
```
Validation Results:
  SSH:   ✓ WORKING
  Git:   ✓ WORKING
  AWS:   ⚠ NOT CONFIGURED or expired
  GUI:   ✓ AVAILABLE (Firefox & VS Code installed)
```

### 16.9 User Instructions

**If GUI Available:**
```
🎨 GUI Applications Ready:
   • Launch Firefox: firefox &
   • Launch VS Code: code &
   • Test X11:       xeyes

   Note: Start XQuartz first: open -a XQuartz

👉 To enter sandbox: sbx run dune
```

**If GUI Not Available:**
```
💡 To enable GUI support later:
   1. Install XQuartz: brew install --cask xquartz
   2. Restart your Mac (or logout/login)
   3. Re-run this setup script
   4. You'll get Firefox & VS Code inside the sandbox
```

### 16.10 Usage

**Starting GUI Session:**
```bash
# 1. Start XQuartz (must be running)
open -a XQuartz

# 2. Enter sandbox
sbx run dune

# 3. Launch GUI apps
firefox &
code &
```

**Testing X11 Connection:**
```bash
# Simple test - should show eyes that follow cursor
xeyes &

# Verify DISPLAY variable
echo $DISPLAY  # Should show: <host-ip>:0

# Check X11 socket
ls -l /tmp/.X11-unix/X0  # Should exist
```

### 16.11 Troubleshooting

**Error: "Can't open display"**
- Cause: XQuartz not running or TCP disabled
- Fix: Start XQuartz and disable access control
  ```bash
  open -a XQuartz
  DISPLAY=:0 /opt/X11/bin/xhost +
  ```

**Error: DISPLAY variable empty**
- Cause: bash being used instead of zsh
- Fix: Exit and re-enter with `sbx run dune` (uses zsh by default)

**GUI apps launch but not visible**
- Cause: XQuartz window manager not active
- Fix: Restart XQuartz completely
  ```bash
  killall Xquartz X11.bin
  open -a XQuartz
  ```

### 16.12 Performance Characteristics

**Resource Usage:**
- Base sandbox (terminal only): ~300 MB RAM
- Firefox running: +800 MB - 1.2 GB
- VS Code running: +500 MB - 900 MB
- Both running: ~1.5-2.0 GB total

**With 12 GB RAM allocation:**
- ~9+ GB remains free for development work
- No performance degradation observed
- 4 CPUs adequate (X11 rendering on host, not container)

**Display Performance:**
- 24-bit True Color optimal (XQuartz default)
- Slight lag on first app launch (X11 initialization)
- Responsive for typical development tasks
- Not suitable for graphics-intensive work or video playback

### 16.13 Known Limitations

**Not Supported:**
- Google Chrome (no ARM64 Linux builds available)
- Native macOS apps (can only run Linux GUI apps)
- Accelerated graphics (no GPU passthrough)
- Wayland (X11 only)

**Workarounds:**
- Use Firefox ESR instead of Chrome
- Use web-based alternatives where possible
- Run performance-critical GUI apps on host

### 16.14 Security Considerations

**X11 Security:**
- X11 protocol allows apps to spy on each other by default
- Only affects apps within sandbox (host protected)
- Acceptable risk for development environment
- Do not run untrusted GUI applications

**Network Exposure:**
- XQuartz TCP port 6000 accepts network connections
- Only localhost and container can connect (firewall protection)
- No external network exposure

**Isolation Maintained:**
- GUI apps still cannot access host project files
- Container filesystem remains isolated
- AWS credentials remain read-only
- SSH keys isolated within container

### 16.15 Testing Criteria

GUI functionality must be tested with:

- [ ] XQuartz installed and TCP enabled
- [ ] X11 socket mounted at /tmp/.X11-unix
- [ ] DISPLAY variable set to host IP (not host.docker.internal)
- [ ] Graphics libraries installed (libpci3, libegl1, dbus-x11)
- [ ] Firefox launches without graphics errors
- [ ] VS Code launches successfully
- [ ] xeyes displays window on Mac screen
- [ ] GUI apps visible and responsive
- [ ] Setup succeeds with and without XQuartz installed
- [ ] User prompted interactively when XQuartz missing
- [ ] Clear upgrade path shown when GUI not available

---

## 17. Implementation Constraints

### 16.1 Platform Requirements
- Host OS: macOS (Intel or Apple Silicon)
- Shell: bash or zsh for host script
- Container: Debian-based Linux for guest
- Virtualization: Colima with vz-rosetta support

### 16.2 Tool Versions
- No specific version requirements for most tools
- sbx: Must support shell agent type
- Colima: Must support vz virtualization
- Docker: Compatible with Colima

### 16.3 Network Requirements
- Internet access for package downloads
- GitHub SSH port 443 must be accessible
- Apt repositories must be reachable
- npm registry must be accessible

---

## 18. Maintenance Requirements

### 18.1 Spec Updates
When implementation changes:
- Update this spec to match reality
- Document rationale for changes
- Keep spec as single source of truth

### 18.2 Version Control
- Spec and implementation must be versioned together
- Spec changes require corresponding script changes
- Script changes require spec update

### 18.3 Agent Handoff
This spec should be sufficient for an agent to:
- Rebuild setup script from scratch
- Understand all requirements and edge cases
- Make informed decisions about implementation
- Validate correctness of implementation

The spec intentionally avoids implementation code to allow flexibility in how requirements are met, while being specific enough that behavior is unambiguous.
