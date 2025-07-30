# Workspace Integration Guide

> **IMPORTANT**: This guide explains how to use Pythia as a shared documentation base integrated into your project workspace via Cursor, VSCode, or other modern editors.

## What is Pythia Workspace Integration?

Pythia is now used as a **shared documentation base** that gets integrated into project workspaces, rather than being installed as a standalone system. This allows you to use Pythia's comprehensive documentation framework directly within your project context.

### Key Concepts

- **Shared Documentation Base**: Pythia provides standardized documentation templates, commands, and methodologies
- **Workspace Integration**: Commands are executed directly in your project context
- **@Command Syntax**: Reference Pythia commands using `@command-name.md` syntax
- **mdc: Links**: Use `mdc:` prefix for workspace-aware file references

## Quick Start

### 1. Basic Usage

Simply reference Pythia commands in your chat:

```bash
# Create a new task
@create-task.md

# Analyze project architecture
@analyze-project.md

# Create a new proposal
@create-proposal.md
```

### 2. Project Context

Commands automatically adapt to your project's structure:

```bash
# Execute with your project context
Execute this command for my project at /path/to/your-project

# Or reference your project structure
Use my project's docs directory at ./docs
```

### 3. Workspace Navigation

Use `mdc:` links for workspace-aware file references:

```markdown
# Reference files in your project

[Project Architecture](mdc:docs/architecture/overview.md)

# Reference Pythia commands

[Create Task Command](mdc:commands/create-task.md)
```

## Supported Editors

### Cursor

- Full support for `@command` syntax
- Native `mdc:` link resolution
- Integrated command execution
- Real-time project context awareness

### VSCode

- Support via extensions
- Manual `@command` reference
- `mdc:` link support with extensions
- Project context integration

### Other Editors

- Manual command reference
- File-based navigation
- Project structure adaptation

## Project Structure Adaptation

Pythia automatically adapts to your project's documentation structure:

### Standard Structure

```
your-project/
├── docs/
│   ├── architecture/
│   ├── workflows/
│   ├── commands/
│   ├── guides/
│   └── navigation/
└── README.md
```

### Flexible Structure

Pythia works with any documentation structure:

```
your-project/
├── documentation/
│   ├── design/
│   ├── processes/
│   └── decisions/
├── docs/
│   └── api/
└── README.md
```

## Command Categories

### Document Creation

- `@create-task.md` - Create task documentation
- `@create-proposal.md` - Create proposal documents
- `@create-idea.md` - Create idea documentation
- `@create-exploration.md` - Create research documents

### Analysis and Review

- `@analyze-project.md` - Comprehensive project analysis
- `@analyze-architecture.md` - Architecture analysis
- `@improve-typescript-files.md` - TypeScript file improvements
- `@review-pull-request.md` - PR review and analysis

### Documentation Management

- `@update-documentation-map.md` - Update navigation
- `@update-status.md` - Update document status
- `@validate-documentation.md` - Validate documentation integrity
- `@archive-tasks.md` - Archive completed tasks

### System Commands

- `@setup.md` - Project setup and configuration
- `@update-command.md` - Update existing commands
- `@sync-confluence.md` - Sync with Confluence
- `@report-workflows.md` - Generate workflow reports

## Advanced Usage

### Custom Project Configuration

Adapt commands to your project's specific needs:

```bash
# Specify custom paths
Use my project's documentation at ./documentation
Use my project's architecture docs at ./docs/design

# Specify project context
My project is a React TypeScript application
My project uses Redux for state management
```

### Command Chaining

Combine multiple commands for complex workflows:

```bash
# 1. Analyze current state
@analyze-project.md

# 2. Create proposal based on analysis
@create-proposal.md

# 3. Create task for implementation
@create-task.md
```

### Workspace-Specific Adaptations

Commands automatically adapt to your workspace:

```bash
# Cursor-specific features
Use Cursor's built-in file navigation
Use Cursor's command palette integration

# VSCode-specific features
Use VSCode's file explorer integration
Use VSCode's command palette
```

## Best Practices

### 1. Project Context

- Always provide clear project context
- Specify your project's documentation structure
- Mention any special requirements or constraints

### 2. Command Usage

- Use specific commands for specific tasks
- Provide clear requirements and objectives
- Include relevant project information

### 3. File Organization

- Maintain consistent documentation structure
- Use clear, descriptive file names
- Keep related documents organized together

### 4. Cross-References

- Use `mdc:` links for workspace navigation
- Maintain consistent link patterns
- Update references when files move

## Troubleshooting

### Common Issues

#### Command Not Found

```bash
# Issue: Command not recognized
@unknown-command.md

# Solution: Check command name
# Available commands: @create-task.md, @analyze-project.md, etc.
```

#### Path Resolution Issues

```bash
# Issue: Files not found
[Link](mdc:docs/nonexistent-file.md)

# Solution: Use correct paths
[Link](mdc:docs/existing-file.md)
```

#### Project Context Issues

```bash
# Issue: Command doesn't understand project structure
@create-task.md

# Solution: Provide project context
My project is located at /path/to/project
My docs are in ./documentation
```

### Getting Help

1. **Check Command List**: Review available commands
2. **Provide Context**: Give clear project information
3. **Use Examples**: Reference similar successful usage
4. **Adapt Commands**: Modify for your specific needs

## Migration from Old Usage

### From Git Submodule Installation

If you previously used Pythia as a git submodule:

1. **Remove Old Installation**:

   ```bash
   git submodule deinit docs/pythia
   git rm docs/pythia
   ```

2. **Use Workspace Integration**:

   - Reference commands directly: `@command-name.md`
   - Use workspace navigation: `mdc:` links
   - Adapt to your project structure

3. **Update References**:
   - Change `../pythia/commands/` to `@command-name.md`
   - Update file paths to use `mdc:` syntax
   - Adapt to your project's documentation structure

### From Direct File Copy

If you copied Pythia files directly:

1. **Remove Copied Files**:

   ```bash
   rm -rf docs/pythia
   ```

2. **Use Workspace Integration**:
   - Reference commands directly
   - Use workspace navigation
   - Adapt to your project structure

## Examples

### Real Project Usage

#### Any Project Example

```bash
# Create task for navigation improvement
@create-task.md

# Context: Any project is a React TypeScript application
# Objective: Improve navigation system
# Priority: High
# Timeline: 2 weeks
```

#### API Documentation Example

```bash
# Analyze API integration
@analyze-architecture.md

# Focus: API communication patterns
# Context: REST API with authentication
# Requirements: Offline support, error handling
```

### Command Output Examples

#### Task Creation

```markdown
# Generated task-2025-07-navigation-improvement.md

## Task: Navigation Improvement

### Context

The project is a React TypeScript application requiring improved navigation.

### Objectives

- Enhance focus management
- Improve keyboard navigation
- Add accessibility features

### Implementation Plan

1. Analyze current navigation system
2. Design improved focus management
3. Implement keyboard navigation
4. Test with platform controls
```

#### Project Analysis

```markdown
# Generated analysis-project.md

## Project Analysis

### Current State

- React TypeScript application
- Platform-focused interface
- Redux state management
- Offline support capabilities

### Architecture Assessment

- Component structure: Well-organized
- State management: Redux implementation
- Performance: Platform-optimized rendering
- Accessibility: Needs improvement
```

## Future Enhancements

### Planned Features

- **Automated Project Detection**: Automatic project structure analysis
- **Command Templates**: Project-specific command templates
- **Advanced Navigation**: Enhanced workspace navigation
- **Integration APIs**: Programmatic command execution

### Community Contributions

- **Custom Commands**: Project-specific command extensions
- **Template Sharing**: Share project templates
- **Best Practices**: Community-driven best practices
- **Integration Examples**: Real-world usage examples

---

**Last Updated**: 2025-07-25
