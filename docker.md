# Docker & Colima Setup (macOS)

This guide provides a lightweight, CLI-first Docker environment for macOS using Colima. This setup is optimized for Apple Silicon (M-series) using Apple's native Virtualization framework and Rosetta translation.

## 1. Installation

Install the Docker CLI tools and the Colima container runtime via Homebrew:

```bash
# Install core components
brew install docker docker-compose docker-cli docker-credential-helper colima

# Set up Docker CLI plugins directory
mkdir -p ~/.docker/cli-plugins

# Link docker-compose to the CLI
ln -sfn $(brew --prefix)/opt/docker-compose/bin/docker-compose ~/.docker/cli-plugins/docker-compose
```

## 2. Initialization & Start

Run this command to create and start the background Linux VM. The flags below enable high-performance file sharing and Intel-image compatibility.

```bash
# Optimized start command for M1/M2/M3 Macs
colima start --cpu 4 --memory 8 --vm-type=vz --vz-rosetta --mount-type=virtiofs
```

## 3. Context & Socket Configuration

Ensure the Docker CLI is pointing to the Colima engine rather than a (potentially non-existent) Docker Desktop socket.

```bash
# Tell Docker CLI to use Colima
docker context use colima

# (Optional) Create a system-wide symlink for 3rd-party tools (e.g., IDEs)
sudo ln -sf $HOME/.colima/default/docker.sock /var/run/docker.sock
```

## 4. Essential Commands

| Action          | Command                             |
|-----------------|-------------------------------------|
| Start Environment | `colima start`                     |
| Check Status     | `colima status`                    |
| Stop Engine      | `colima stop`                      |
| Restart VM       | `colima restart`                   |
| Factory Reset    | `colima delete` (Destroys all volumes/images) |

## 5. Verification

Confirm the connection between the CLI and the Engine:

```bash
# Verify the engine info
docker info

# Run a test container
docker run --rm hello-world
```