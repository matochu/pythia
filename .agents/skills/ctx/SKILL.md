---
applyTo: []
---

# Skill: /ctx

**Purpose**: Create context documents **for specific features**. Feature contexts are stored in the feature directory and linked to the feature document.

## Input Formats

Choose any of the following:

```
/ctx {topic}                            # Auto-detect FEATURE_ID from chat, provide topic
/ctx feat-2026-01-123 {topic}          # FEATURE_ID + context topic
/ctx {topic} --name context-name       # Custom output filename
/ctx {topic} --format markdown         # Specify output format
```

**When {topic} only**: auto-detect FEATURE_ID from chat, create context for topic.

**When --name provided**: output file is named `{context-name}.context.md` (otherwise derived from topic).

**When --format provided**: use specific format (default: markdown with /ctx structure).

## Instructions for user

- **Minimal case**: `/ctx {topic}` — skill infers FEATURE_ID from chat context.
- **With FEATURE_ID**: `/ctx feat-2026-01-123 technical-analysis` (explicit feature + topic).
- **Custom output name**: `/ctx my-topic --name my-custom-name` (control output filename).
- **Examples**: `/ctx technical-analysis`, `/ctx architecture-decisions`, `/ctx domain-knowledge`.
- ❌ `feature-name/`
- ❌ `custom-feature/`

**Context Files**: `{descriptive-name}.context.md` or `{type}-{topic}.context.md`

- ✅ `technical-analysis.context.md`
- ✅ `architecture-decisions.context.md`
- ✅ `domain-knowledge.context.md`
- ❌ `context-2025-11-18-topic.md` (date not needed in feature contexts)
- ❌ `topic.md` (missing `.context` suffix)

### Context to Feature Relationship

**One-to-Many**: Feature → Contexts

- One feature can have multiple contexts (different topics)
- Each context belongs to exactly one feature
- Contexts are created as needed during implementation or research
- Contexts contain analysis and knowledge not in main feature document

**Linking:**

- Context must reference feature: `**Related Feature**: [Feature Name](../feat-YYYY-MM-name.md)`
- Feature should list contexts: In "Related Contexts" section

### Research-type context

When the requested context is **research** (solution options, best practices, 3rd party solutions, broad/deep exploration):

- **Inline mode (default)**: You ARE the Researcher — execute the research and produce the context document yourself. Do NOT launch a subagent.
- **Loop/auto mode only**: Delegate to the **Researcher** subagent via [researcher.md](../agents/researcher.md) with feature + topic; Researcher produces the context document in `feat-XXX/contexts/{topic}.context.md` using this command's structure and linking.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc (e.g. `feat-2025-10-feature-name`)
- Provide **context topic** (e.g. "Technical Analysis", "Architecture Decisions")
- Context will be created in `feat-XXX/contexts/{topic}.context.md`

## Instructions for model

You are the **[Architect (architect.md)](../agents/architect.md)**. Create context documents for features.

Get current date via `date +%Y-%m-%d`. Validate feature and context scope. Create context file in `feat-XXX/contexts/{topic}.context.md` with bidirectional references.

**See also**: [/research skill](../research/SKILL.md), [/feat skill](../feat/SKILL.md)
