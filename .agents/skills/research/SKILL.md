---
name: research
description: Run feature research with document pre-search and produce a context document covering options, best practices, and third-party findings.
applyTo: []
---

# Skill: /research

**Purpose**: Run **research for a feature** via the Researcher subagent. Research is grounded by a **pre-search across all pythia/project documents** (they are scattered), then broad/deep research (options, best practices, 3rd party). Output = context document in `feat-XXX/contexts/{topic}.context.md`. Hermetic per feature; agent doc context = feature.

## Input Formats

Choose any of the following:

```
/research {topic}                       # Auto-detect FEATURE_ID from chat, provide topic
/research feat-2026-01-123 {topic}    # FEATURE_ID + research topic
/research {topic} --context path/to/existing.context.md  # Verify existing context
/research {topic} --name context-name # Research with specific output filename
```

**When {topic} only**: auto-detect FEATURE_ID from chat, use topic to drive research.

**When --context provided**: Researcher verifies the document instead of conducting new research; outputs verification report in chat.

**When --name provided**: output file is named `{context-name}.context.md` (otherwise derived from topic).

## Instructions for user

- **Minimal case**: `/research {topic}` — skill infers FEATURE_ID from chat context.
- **With FEATURE_ID**: `/research feat-2026-01-123 WebAuthn options` (explicit feature + topic).
- **Verify existing**: `/research my-topic --context contexts/existing.context.md` (check an existing context).
- **Custom output name**: `/research my-topic --name my-custom-name` (control output filename).
- **Research topic examples**: "WebAuthn options", "caching best practices", "agent skills for code review".

## Instructions for model

**CRITICAL — Execution context**: When the user invokes `/research` directly (inline mode, no "loop" or "auto"), execute the research **in the current context** — you ARE the Researcher. Do **NOT** launch a subagent. Follow the Researcher role instructions from [researcher.md](../agents/researcher.md). Subagent delegation for `/research` happens ONLY in loop/auto mode.

Input: feature context (feature doc path, existing contexts, plans) + research topic; **if user passed an existing context** (path or content), also pass it.

**Researcher must**:

**When user passes an existing context document:**

1. **Verify** the document: check cited sources (URLs, file paths), validate that claims match sources, note outdated or broken links, missing citations, or contradictions.
2. **Report in chat** (verification report): summary of findings (what is valid, what is outdated or unverified, what should be updated or improved). Do **not** overwrite the context file automatically — present the report so the user can decide on update or improvement.
3. If the user then asks to update/improve, proceed with edits or a fresh research pass as requested.

**When no existing context is passed (new research):**

1. **Pre-search pythia first**: Search **all** relevant pythia/project documents (`.pythia/workflows/features/`, `.pythia/contexts/`, `.pythia/notes/`, feature dirs — contexts, plans, reports, notes). Documents are scattered; use semantic search and/or grep for the topic and related terms. Use findings to avoid duplicate work and to ground the research.
2. Then follow the full research procedure: frame and decompose, multi-source search (web, codebase, 3rd party, skill-search when relevant), evaluate and score sources, resolve contradictions, synthesize.
3. Produce a context document in `{feature-dir}/contexts/{topic}.context.md` using `/ctx` structure; update the feature's Related Contexts.
4. Every new research context should include, when applicable:
   - **Architectural analysis / option variants**
   - **One recommended option/architecture** (do not leave only a neutral list when a recommendation is possible)
   - **Implementation split guidance**: how this could be broken into future plans depending on complexity/scope
   - **Clear statement of what is still unresolved** vs what is ready for planning
5. Prefer one recommended direction. If multiple variants are presented, explicitly say:
   - which one is recommended
   - why it is preferred over the others
   - whether other variants are fallback-only, later-phase, or rejected
6. If the topic is large enough to imply implementation work, include a short section on **possible plan decomposition**, for example:
   - one larger plan
   - two-plan split
   - three-plan split
     and recommend one of those decompositions.

If Researcher cannot be launched, tell the user to run `/research` with the same feature and topic, or retry when the agent is available.

**Output**: For new research — context file in `feat-XXX/contexts/`, feature's Related Contexts updated, short chat summary. For existing context — **verification report in chat** (no file change until user decides).

**Validation**: Pre-search step was performed when doing new research (pythia/project docs); when verifying existing context, report was produced and no overwrite without user decision.

**See also**: [/ctx skill](../ctx/SKILL.md), [/feat skill](../feat/SKILL.md)
