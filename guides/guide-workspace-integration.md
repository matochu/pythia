# Guide: Workspace Integration (via Setup)

> IMPORTANT: The canonical way to integrate Pythia is to run the command `@setup.md`. This guide is a thin wrapper: how to invoke Setup, verify results, and work with tasks/LLM.

## What is Pythia Workspace Integration?

Pythia acts as a shared documentation base integrated directly into your project. You reference commands via `@command-name.md` and navigate files via `mdc:` links.

### Key Concepts

- Shared Documentation Base: standardized templates, commands, methodologies
- Workspace Integration: commands run in project context
- `@` Commands: `@create-task.md`, `@manage-task.md`, etc.
- `mdc:` Links: workspace-aware references

## Quick Start

### 1) Run Setup

```bash
@setup.md
```

### 2) Provide Project Context

```bash
Execute this command for my project at /path/to/project
Use my project's docs directory at ./docs
```

### 3) Verify

Setup creates/updates documentation structure and Cursor rules. After completion:

- You should see docs structure and `.cursor/rules/` in your project
- In Cursor, try `@create-task.md`

## Supported Editors

- Cursor: `@` commands, native `mdc:` links, real-time project context
- VSCode: via extensions, manual `@` invocation

## Project Structure Adaptation

Works with both standard and flexible documentation structures. Commands adapt to your layout.

## Command Categories (Essentials)

- Document Creation: `@create-task.md`, `@create-context.md`, `@create-proposal.md`
- Analysis/Review: `@analyze-project.md`, `@analyze-ai-solutions.md`
- Documentation Management: `@update-documentation-map.md`, `@validate-documentation.md`, `@report-workflows.md`

---

## Manual Setup (Optional)

If you prefer explicit scaffolding, create docs structure and `.cursor/rules/` manually. Otherwise, prefer `@setup.md`.

### 1) Create Documentation Structure

```bash
mkdir -p .pythia/{architecture,workflows/{tasks,proposals,decisions,ideas},commands,contexts,guides,reports}
```

### 2) Workspace Integration Files

Create `.pythia/project-structure.md` and `.pythia/workspace-integration.md` describing your structure and usage (optional).

### 3) Cursor Rules (Optional)

```bash
mkdir -p .cursor/rules
# Add documentation rules here if needed
```

### 4) Verification

```bash
ls -la .pythia/
# In Cursor, try: @create-task.md
```

---

## How to use with tasks/LLM

- In each task, reference `@manage-task.md` to drive the lifecycle (Context-First → Plan → Execute → Under Review → Completed).
- Mark human-only checkboxes with `[H]`; LLM adds notes but does not tick them.
- Add/Update tests for all new/changed code and run coverage before completion; use `@analyze-ai-solutions.md` for AI review (diff-aware by default).
- Store AI review artifacts under `.pythia/memory-bank/sessions/` (JSON + MD) and link them from the task.
- Create supporting contexts using `@create-context.md` and add bidirectional links via `mdc:` references.

---

**Last Updated**: 2025-08-09
