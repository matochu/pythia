# Research Procedure

**Purpose**: Structured workflow for the Researcher subagent to perform broad and deep research and produce context documents for feature or project. Aligned with best practices from deep-research and research-agent skills (question decomposition, multi-source coverage, source scoring, contradiction resolution, citation discipline).

## When to Use

- Before or alongside planning: explore problem space, solution options, best practices, 3rd party solutions.
- When a feature or project needs a dedicated context document that summarizes research (options, trade-offs, sources) without making the final decision.
- **When user passes an existing context path**: verify it (sources, claims), report in chat, and continue in brainstorm for user-directed follow-up (no automatic overwrite).

## Session Flow

`/research` supports four chat-session modes:

- `discover`: initial topic handling with pythia/project pre-search, existing artifact summary, known gaps, and possible research directions.
- `brainstorm`: Research Brainstorm Mode; interactive work around a topic or context file after a context is opened, created, or explicitly used for alternatives, deeper investigation, or path brainstorming.
- `verify`: existing-context path verification; report findings in chat, do not edit automatically, then continue in `brainstorm` for that context.
- `update`: write agreed findings back to a known context file after the user explicitly asks to write, revise, persist, or update them.

New research may stop at a research map when more direction is needed, or create a context document and then continue in `brainstorm` mode. Existing `.context.md` or `.ctx.md` paths enter `verify` first and then continue in `brainstorm` for follow-up work.

Research chooser actions are inline continuation intents for the same Researcher session. They can explore alternatives, clarify scope, dig deeper into a selected direction, brainstorm solution paths, assess plan-readiness, or update the active context after confirmation. They are not default handoffs to `/plan`, `/ctx`, or a subagent.

When research is not tied to an active feature, or when the active context has no related feature, the Researcher should explicitly offer two placement paths before writing: create a feature with `/feat` and put the research under that feature's `contexts/`, or save the research as a global project context under `.pythia/contexts/{category}/`. The global path requires a user-confirmed category and target name before writing.

## When existing context is passed (verification mode)

If the user provides an **existing context document path** to `/research`:

1. **Verify**: Check every cited source (URLs, file paths) — do they still exist, do they support the claim? Note: broken or outdated links, missing citations, claims that contradict the source, or new evidence that supersedes the document.
2. **Report in chat**: Produce a **verification report** (do not edit the file yet):
   - What is **valid** (sources OK, claims still supported).
   - What is **outdated or unverified** (broken links, missing refs, claims needing re-check).
   - **Recommendations**: what to update or improve (e.g. “Replace link X”, “Add source for claim Y”, “Section Z is superseded by …”).
3. **Brainstorm continuation**: Present the report so the user can choose — update now, improve in a follow-up, dig deeper, compare alternatives, assess planning readiness, or leave as-is. Only after user asks to update/improve, apply edits or run a fresh research pass.

## Research Steps

### 0. Pre-search: pythia and project docs first

Project and feature knowledge is **scattered** across many locations. Before any external or codebase search, search **all relevant pythia/project documents** to avoid duplicate work and to ground the research in existing decisions and context.

- **Scope**: `.pythia/` (if present): `workflows/features/` (feature docs, plans, contexts, reports, notes per feature), `contexts/`, `notes/` (e.g. retro-project.md). Also project root and feature directories for any other docs (templates, references).
- **Action**: Use semantic search and/or grep across these paths for the research topic and related terms. Collect: existing context docs, plan decisions, retro findings, feature objectives that touch the topic.
- **Use**: Summarize what is already known or decided; feed into “Frame the problem” (step 1) and into later steps so external search complements rather than duplicates pythia knowledge.

### 1. Frame the problem and decompose

- Clarify the research question or topic (from user or from feature/plan).
- Identify constraints (tech stack, timeline, scope, must-have vs nice-to-have).
- State what is already known (from feature doc, existing contexts, codebase) vs what needs to be discovered.
- **Question decomposition**: Break the question into research dimensions and sub-questions:
  - **Web**: official docs, standards, blog posts from maintainers, community posts.
  - **Codebase**: current patterns, usage examples, integration points (grep, read).
  - **3rd party**: library APIs, implementation details, release notes.
- Plan steps (e.g. TodoWrite) so search can be parallel where dimensions are independent.

### 2. Search for options and practices (multi-source)

- **Solution options**: Multiple approaches (e.g. build vs buy, different libraries, patterns). Search in parallel where possible across web, codebase, 3rd party.
- **Best practices**: Industry/community standards, official recommendations. Cite every claim (URL or file path).
- **3rd party solutions**: Tools, libraries, frameworks, services — name, link, brief pros/cons, compatibility with current stack.
- **Agent skills / tooling** (when topic is agent skills, catalogs, or tooling): Follow `.agents/skills/skill-search-and-fit/SKILL.md`:
  - **Search order**: Cursor community repos → Skills.sh → AgentSkills.io → GitHub (vercel-labs, anthropics/skills, etc.).
  - **Quality**: Use the skill’s checklist (description, compatibility, progressive disclosure, etc.); score 0–10; note conflicts with existing skills.
  - In context output: skill name, repo/source, description, compatibility, quality score, install path; cite URLs.

### 3. Evaluate, score sources, resolve contradictions

- For each option: pros, cons, trade-offs (complexity, maintenance, risk, fit with codebase).
- **Source scoring**: Rate relevance/quality (e.g. 0–10): authoritative sources 8–10, implementation/code 7–9, community 5–7.
- **Credibility hierarchy** (when sources conflict): primary source code > official docs > community consensus. Cross-check (official docs, actual code, version-specific behavior); state resolution or “unresolved” with evidence.
- Note gaps (missing info, unclear licensing, no recent updates).
- Do not decide “the” solution; present options so Architect or PM can choose.

### 4. Synthesize into context document

- Write (or update) a context document in the correct location:
  - **Feature**: `{feature-dir}/contexts/{topic}.context.md`
  - **Project**: `.pythia/contexts/{category}/{topic}.context.md` or project-defined category location
- If no feature is active and no destination was requested, ask the user to choose between feature-scoped research via `/feat` and a global project context before writing. For global context, ask for category and context slug if either is ambiguous.
- Structure: Problem/scope, Options (with sources), Best practices (with citations), 3rd party solutions (with links), Summary of trade-offs, **Confidence and gaps** (see Output Format). Include metadata (Related Feature, Created, Last Updated).
- Update feature’s Related Contexts section if output is feature-scoped.
- During brainstorm, verify, or update interactions, maintain `## Retrospective` and `## Decision Log` sections automatically when relevant. These sections capture transferable lessons and user research decisions; do not add a chooser action for extracting profile signals.

## Output Format (context document)

- Follow the same structure as other feature contexts: metadata, Links to Related Documents (Related Feature, Related Plans, Related Contexts), main content, Used by (can be empty initially).
- Use clear headings: e.g. Problem statement, Solution options, Best practices, 3rd party solutions, Trade-offs summary, **Confidence and gaps**.
- **Citation discipline**: Every non-obvious claim must have a source (URL or file:line). Aim for 2–3 sources per major claim where possible.
- **Confidence and gaps**: For important findings, note confidence (high / medium / low) or mark gaps; call out unresolved questions or contradictions and what evidence was checked.
- **Retrospective**: Reusable lessons outside the current topic only, labeled when useful as `[domain]`, `[method]`, `[workflow]`, `[research]`, or `[risk]`. Explicit user preferences belong in `## Decision Log`; only inferred workflow lessons belong here.
- **Decision Log**: Concise user-only bullets in the form `{context/condition}: {decision, correction, or preference}` for explicit user choices, corrections, rejected directions, accepted directions, and artifact-placement decisions that changed the research session.

## Integration with workflow

- Research can run **before** `/plan` (to feed options into the plan) or **in parallel** with context creation.
- Output of research is a **context document**; plans can reference it in `## Contexts` and use it during planning and review.
- Researcher does not run `/plan` or `/ctx` as separate commands — it produces or updates the context file and links directly, following the same conventions as `/ctx`. Plan-readiness output remains a chat assessment until the user explicitly invokes planning.
