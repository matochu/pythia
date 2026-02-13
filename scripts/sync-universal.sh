#!/bin/bash
# Universal Sync Script for Cross-Platform Skills and Agents Synchronization
# Syncs from .claude/ (universal source) to platform-specific directories

set -e

# Default mode: copy (Git-friendly, works on all platforms)
MODE="copy"
SYNC_GITHUB=false
SYNC_OPENCODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --symlink)
      MODE="symlink"
      shift
      ;;
    --copy)
      MODE="copy"
      shift
      ;;
    --github)
      SYNC_GITHUB=true
      shift
      ;;
    --opencode)
      SYNC_OPENCODE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--symlink|--copy] [--github] [--opencode]"
      echo ""
      echo "Options:"
      echo "  --symlink    Use symlinks instead of copies (Unix-friendly, default: copy)"
      echo "  --copy       Use file copies instead of symlinks (Git-friendly, default)"
      echo "  --github     Sync to .github/ for VS Code Copilot (optional, only if using recommended path)"
      echo "  --opencode   Sync to .opencode/ for OpenCode (optional, only if platform-specific directory preferred)"
      echo ""
      echo "Note: Cursor, VS Code Copilot, Claude Desktop, and OpenCode read .claude/ directly."
      echo "This script only syncs to platform-specific directories that don't support .claude/ directly."
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Detect platform and suggest mode
detect_platform() {
  case "$(uname -s)" in
    Linux*)
      PLATFORM="Linux"
      SUGGESTED_MODE="symlink"
      ;;
    Darwin*)
      PLATFORM="macOS"
      SUGGESTED_MODE="symlink"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      PLATFORM="Windows"
      SUGGESTED_MODE="copy"
      ;;
    *)
      PLATFORM="Unknown"
      SUGGESTED_MODE="copy"
      ;;
  esac
}

detect_platform

# If mode not explicitly set, use suggested mode
if [[ "$MODE" == "copy" && "$SUGGESTED_MODE" == "symlink" ]]; then
  echo "Platform detected: $PLATFORM"
  echo "Note: Symlinks work well on Unix systems. Use --copy for Git-friendly approach."
fi

# Source directory (universal)
SOURCE_SKILLS=".claude/skills"
SOURCE_AGENTS=".claude/agents"

# Check if source directories exist
if [[ ! -d "$SOURCE_SKILLS" ]]; then
  echo "Error: $SOURCE_SKILLS directory does not exist"
  exit 1
fi

if [[ ! -d "$SOURCE_AGENTS" ]]; then
  echo "Error: $SOURCE_AGENTS directory does not exist"
  exit 1
fi

# Sync function
sync_directory() {
  local source_dir=$1
  local target_dir=$2
  local description=$3

  if [[ ! -d "$source_dir" ]]; then
    echo "Warning: Source directory $source_dir does not exist, skipping..."
    return
  fi

  # Create target directory if it doesn't exist
  mkdir -p "$target_dir"

  # Remove existing symlinks/files if they exist (for idempotency)
  if [[ -L "$target_dir" ]] || [[ -e "$target_dir" ]]; then
    if [[ "$MODE" == "symlink" && -L "$target_dir" ]]; then
      # Remove existing symlink
      rm "$target_dir"
    elif [[ "$MODE" == "copy" ]]; then
      # Remove existing directory contents (but keep directory structure)
      find "$target_dir" -mindepth 1 -delete 2>/dev/null || true
    fi
  fi

  if [[ "$MODE" == "symlink" ]]; then
    # Create symlink
    if [[ -d "$source_dir" ]]; then
      # For directories, create symlink to parent and then link contents
      ln -sfn "$(pwd)/$source_dir" "$target_dir"
      echo "Created symlink: $target_dir -> $source_dir"
    fi
  else
    # Copy files
    cp -r "$source_dir"/* "$target_dir/" 2>/dev/null || {
      # If source is empty, create empty target
      mkdir -p "$target_dir"
    }
    echo "Copied files: $source_dir -> $target_dir"
  fi

  echo "Synced $description: $target_dir"
}

# Sync to .github/ (optional, for VS Code Copilot recommended path)
if [[ "$SYNC_GITHUB" == "true" ]]; then
  echo "Syncing to .github/ for VS Code Copilot..."
  sync_directory "$SOURCE_SKILLS" ".github/skills" "skills to .github/"
  sync_directory "$SOURCE_AGENTS" ".github/agents" "agents to .github/"
fi

# Sync to .opencode/ (optional, for OpenCode platform-specific directory)
if [[ "$SYNC_OPENCODE" == "true" ]]; then
  echo "Syncing to .opencode/ for OpenCode..."
  sync_directory "$SOURCE_SKILLS" ".opencode/skills" "skills to .opencode/"
  sync_directory "$SOURCE_AGENTS" ".opencode/agents" "agents to .opencode/"
fi

# Always sync to .agents/ for Codex (repository-level)
echo "Syncing to .agents/ for Codex..."
sync_directory "$SOURCE_SKILLS" ".agents/skills" "skills to .agents/"

echo ""
echo "Sync completed successfully!"
echo "Mode: $MODE"
echo ""
echo "Note: .claude/ is the source of truth. Cursor, VS Code Copilot, Claude Desktop, and OpenCode read .claude/ directly (no sync needed)."
echo "This script syncs to platform-specific directories that don't support .claude/ directly (Codex, optional .github/ for VS Code Copilot, optional .opencode/ for OpenCode)."
