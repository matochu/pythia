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
/research path/to/existing.context.md   # Verify existing context, then continue in brainstorm
```

**When {topic} only**: auto-detect FEATURE_ID from chat, use topic to drive research.

**When an existing `.context.md` or `.ctx.md` path is provided**: Researcher verifies the document, reports findings in chat, and then continues in `brainstorm` mode for that context. Do not overwrite the file automatically.

## Instructions for user

- **Minimal case**: `/research {topic}` — skill infers FEATURE_ID from chat context.
- **With FEATURE_ID**: `/research feat-2026-01-123 WebAuthn options` (explicit feature + topic).
- **Verify existing**: `/research contexts/existing.context.md` (check an existing context, then continue brainstorming around it).
- **Research topic examples**: "WebAuthn options", "caching best practices", "agent skills for code review".

## Instructions for model

**CRITICAL — Execution context**: When the user invokes `/research` directly (inline mode, no "loop" or "auto"), execute the research **in the current context** — you ARE the Researcher. Do **NOT** launch a subagent. Follow the Researcher role instructions from [researcher.md](../../agents/researcher.md). Subagent delegation for `/research` happens ONLY in loop/auto mode.

Input: feature context (feature doc path, existing contexts, plans) + research topic; **if user passed an existing context path**, also pass it.

## Research Session Modes

`/research` is a persistent research session around a topic or context file. Modes describe Researcher behavior in the chat session, not file-level artifact states. `brainstorm` mode is Research Brainstorm Mode.

- `discover`: initial topic handling with pythia/project pre-search, existing artifact summary, known gaps, and possible research directions.
- `brainstorm`: interactive work around a topic or context file, including clarifying questions, alternatives, deeper investigation of one direction, broader search for other solution paths, and plan-readiness assessment.
- `verify`: existing context path verification behavior; report in chat, do not overwrite the context file automatically, then transition to `brainstorm` for follow-up work around that context.
- `update`: write agreed findings back to an existing context file when the user explicitly asks to write, revise, persist, or update findings.

### Mode Activation

Resolve exactly one mode in this order:

1. If the argument resolves to an existing `.context.md` or `.ctx.md` file, enter `verify` mode for that context, report findings in chat, do not edit it, then transition to `brainstorm` mode for the same context in the active footer.
2. Else if the user explicitly asks to write, revise, persist, or update findings and a context file is known, enter `update` mode after confirming the intended write target when ambiguous.
3. Else if the argument looks like a context path but the file does not exist, treat it as an invalid context path and ask whether the user intended a topic or a new context destination.
4. Else if the current `/research` session already has an active context file in the active context footer, enter `brainstorm` mode for that context.
5. Else if the previous `/research` response created a context file, enter `brainstorm` mode for the newly created context.
6. Else if the user explicitly asks to brainstorm, compare paths, explore alternatives, or dig deeper in the same research topic, enter `brainstorm` mode for the active topic even if no file exists yet.
7. Else enter `discover` mode for the topic.

If feature context cannot be inferred before writing or updating artifacts, do not stop at asking for a feature ID. Offer explicit placement options:

- create a feature with `/feat` and place the research under that feature's `contexts/` directory
- save the research as a global project context under `.pythia/contexts/{category}/`

Do not use ad hoc flags for this flow; placement is resolved through the session actions and explicit user confirmation.

After creating a new context file, transition into `brainstorm` mode instead of ending the session. If the user asks for planning from insufficient findings, keep the session in `brainstorm` and surface the missing decisions.

## Research Response Contract

Every `/research` response with a resolved feature, topic, or context must end with `## Next Steps`, an `**Actions**` block, and the active context footer. Do not include a `Copy to run elsewhere` block for `/research`: these chooser actions are inline continuation intents for the same Researcher session, not default handoffs to another workflow role.

Use only actions that are valid for the current state:

```markdown
## Next Steps

**Actions**
**[a]** Explore alternatives - compare other solution/research directions
**[q]** Clarify with me - ask missing scope or constraint questions
**[d]** Dig deeper - investigate one selected direction in more detail
**[b]** Brainstorm paths - work through possible solution/research paths interactively
**[p]** Plan from findings - assess whether findings are actionable enough for /plan
**[u]** Update context - write agreed findings back to the context file
**[f]** Create feature for research - start a feature so this research can live under feature contexts
**[g]** Save as global context - place this research under `.pythia/contexts/{category}/`

---
**Active context**: role: Researcher · feat: {feat-id|none} · research: {context-slug|topic} · mode: {discover|brainstorm|verify|update} · skill: /research
```

Omit `[u] Update context` when no context file exists yet, or mark it unavailable until the user asks to create one and confirms the target name. Offer `[f]` and `[g]` when research has no active feature or when the active context file has no related feature. Unknown chooser input should reprint the valid action keys for the current state.

### Chooser Action Semantics

| Action | Execution context | Artifact behavior | Preconditions / fallback |
| ------ | ----------------- | ----------------- | ------------------------ |
| `[a] Explore alternatives` | Inline Researcher response in the same chat | Chat-only unless user later chooses `[u]` | If topic is too broad, ask one narrowing question before comparing |
| `[q] Clarify with me` | Inline Researcher questions in the same chat | Chat-only | Ask only questions that materially change research direction or plan-readiness |
| `[d] Dig deeper` | Inline Researcher investigation in the same chat | Chat-only by default; may cite files/sources and stage findings for `[u]` | If no direction is selected, ask which direction to deepen |
| `[b] Brainstorm paths` | Inline Researcher brainstorming in the same chat | Chat-only by default; update agreed directions in the response | If no active topic/context exists, first run `discover` |
| `[p] Plan from findings` | Inline Researcher plan-readiness assessment | Chat-only gap summary or plan-candidate summary; never creates a plan file | If ready, summarize candidate plan slug/scope and tell the user `/plan` remains explicit |
| `[u] Update context` | Inline Researcher update flow in the same chat | Writes the active context only after user confirmation of target and agreed findings | If no context file exists, ask whether to create one and with what name; do not create implicitly |
| `[f] Create feature for research` | Inline Researcher handoff assessment in the same chat | Chat-only; does not create a feature file automatically | Offer when no active feature exists or the active context has no related feature; summarize a candidate `/feat` scope and tell the user `/feat` remains explicit |
| `[g] Save as global context` | Inline Researcher update/create flow in the same chat | Writes to `.pythia/contexts/{category}/` only after user confirms category, target name, and agreed findings | Offer when research is project-level or not ready to belong to a feature; if category or naming is ambiguous, ask for both before writing |

**Researcher must**:

**When user passes an existing context document path:**

1. **Verify** the document: check cited sources (URLs, file paths), validate that claims match sources, note outdated or broken links, missing citations, or contradictions.
2. **Report in chat** (verification report): summary of findings (what is valid, what is outdated or unverified, what should be updated or improved). Do **not** overwrite the context file automatically — present the report so the user can decide on update or improvement.
3. After reporting verification findings, keep the session active in `brainstorm` mode for that context so the user can choose alternatives, clarification, deeper verification, planning readiness, or an explicit update.

**When no existing context is passed (new research):**

1. **Pre-search pythia first**: Search **all** relevant pythia/project documents (`.pythia/workflows/features/`, `.pythia/contexts/`, `.pythia/notes/`, feature dirs — contexts, plans, reports, notes). Documents are scattered; use semantic search and/or grep for the topic and related terms. Use findings to avoid duplicate work and to ground the research.
2. Then follow the full research procedure: frame and decompose, multi-source search (web, codebase, 3rd party, skill-search when relevant), evaluate and score sources, resolve contradictions, synthesize.
3. Produce a context document in `{feature-dir}/contexts/{topic}.context.md` using `/context-feature` structure when a feature is active; update the feature's Related Contexts. If no feature is active, offer to create a feature with `/feat` or save to `.pythia/contexts/{category}/`; do not silently choose a destination or category.
4. Every new research context should include, when applicable:
   - **Architectural analysis / option variants**
   - **One recommended option/architecture** (do not leave only a neutral list when a recommendation is possible)
   - **Implementation split guidance**: how this could be broken into future plans depending on complexity/scope
   - **Clear statement of what is still unresolved** vs what is ready for planning
   - **Retrospective**: reusable findings useful outside this research context, not a summary of the research itself
   - **Decision Log**: explicit user choices, corrections, rejected directions, and accepted direction changes that shaped the research session
5. Prefer one recommended direction. If multiple variants are presented, explicitly say:
   - which one is recommended
   - why it is preferred over the others
   - whether other variants are fallback-only, later-phase, or rejected
6. If the topic is large enough to imply implementation work, include a short section on **possible plan decomposition**, for example:
   - one larger plan
   - two-plan split
   - three-plan split
     and recommend one of those decompositions.

**Inputs integration**:

- `/research` produces `*.context.md` artifacts.
- Create: when the research output is grounded in direct repo-file evidence, run `.pythia/runtime/inputs.js add <context-file> <dep> [<dep>...]` to record those direct source files. Do not run `update` on first creation.
- Revise stale research context: rewrite the context content first. Run `.pythia/runtime/inputs.js update <context-file>` only after the document already reflects the current source files.
- If there are no direct file dependencies, do not add an `inputs:` block.
- If `.pythia/runtime/inputs.js add` or `.pythia/runtime/inputs.js update` returns an error, show that raw failure to the user.

If Researcher cannot be launched, tell the user to run `/research` with the same feature and topic, or retry when the agent is available.

## Context Session Sections

When writing or updating a context file during `brainstorm`, `verify`, or `update` interactions, maintain these sections automatically when there is relevant content. Do not add a chooser action for extracting profile signals; later audit can decide whether and where these entries should be promoted into a user or agent profile.

### Retrospective

Use `## Retrospective` for findings that are useful outside the current research topic. Do not duplicate the research summary, source list, or option comparison. Add only transferable lessons:

- `[domain]` reusable domain insight
- `[method]` search/source/evaluation pattern that worked or failed
- `[workflow]` process lesson for future `/research`, `/plan`, `/feat`, or audit work
- `[research]` reusable lesson about evidence quality, source selection, or unresolved knowledge gaps
- `[risk]` reusable risk, anti-pattern, or check for future work

Labels are suggestions, not a closed enum; add domain-specific labels when they make future synthesis clearer.
Explicit user preferences belong in `## Decision Log`; only inferred workflow lessons belong in `## Retrospective`.

### Decision Log

Use `## Decision Log` to record explicit user choices and corrections that changed the direction or artifact behavior of the research. Keep entries concise and factual.

```markdown
- {context/condition}: {decision, correction, or preference}
```

The section itself means "user"; do not prefix entries with `User:`. Do not require type/status/durability/effect fields.

**Output**: For new research — context file in `feat-XXX/contexts/` or confirmed global category path, related indexes updated when applicable, short chat summary. For existing context path — **verification report in chat** plus Research Brainstorm Mode continuation (no file change until user decides).

**Validation**: Pre-search step was performed when doing new research (pythia/project docs); when verifying existing context, report was produced and no overwrite without user decision.

**See also**: [/ctx skill](../ctx/SKILL.md), [/feat skill](../feat/SKILL.md)
