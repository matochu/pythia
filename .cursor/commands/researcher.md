# Command: /researcher

**Purpose**: Invoke the **Researcher** subagent to do broad/deep research on a topic and produce a **context document** in the feature (or project). Same output as `/context-feature` for research-type context — `feat-XXX/contexts/{topic}.context.md` with proper structure and linking.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc (or say "project" for project-level).
- Provide **research topic or question** (e.g. "WebAuthn options", "caching best practices", "agent skills for code review").

## Instructions for model

Delegate to the **Researcher** subagent (Task tool with `subagent_type="researcher"` or Researcher agent). Input: feature (or project) + research topic. Researcher produces a context document in `feat-XXX/contexts/{topic}.context.md` (or `.pythia/contexts/`) using `/context-feature` structure and updates the feature's Related Contexts. See `.claude/agents/researcher.md` and `.claude/skills/architecture-workflow/references/research-procedure.md`.

If Researcher cannot be launched, tell the user and suggest retrying when the agent is available.
