# Guides

Practical guides for integrating and working with the Pythia documentation system in your workspace.

## Available Guides

- [Workspace Integration (via Setup)](./guide-workspace-integration.md) — Run `@setup.md`, verify, and start working
- [How to Use LLM for Effective Documentation](./guide-llm-documentation-workflow.md) — Day-to-day LLM usage patterns
- [Prioritization Methods](./guide-prioritization-methods.md) — ICE, RICE, WSJF, Value/Effort

## How to Use with Tasks and LLM

- Use `@manage-task.md` inside a task to run the lifecycle (Context-First → Plan → Execute → Review → Complete)
- Create new context documents with `@create-context.md` and link them bidirectionally
- Run quality gates with `@analyze-ai-solutions.md` (diff-aware, tests/coverage, artifacts)
- Artifacts location (default): `.pythia/memory-bank/` (sessions, patterns, decisions)

## Creating New Guides

When creating a new guide:

1. Use the naming convention `guide-{topic}.md`
2. Include clear steps with examples and references to relevant commands
3. Add the new guide to this README index
4. Update the documentation map

## References

- [Documentation Map](../navigation/documentation-map.md)
- [Documentation Standards](../navigation/documentation-standards.md)
- [Manage Task](../commands/manage-task.md)
- [Create Context](../commands/create-context.md)
