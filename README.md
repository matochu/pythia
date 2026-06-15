# Pythia

**A structured workflow for building software with AI agents.**

Ad-hoc prompting produces ad-hoc results. You ask an agent to "implement X," it improvises architecture, skips validation, and leaves nothing behind that you — or the next agent — can audit. There is no shared plan, no role discipline, no durable memory of *why* a decision was made.

Pythia is the layer that fixes this. It turns a single feature request into a disciplined lifecycle — **plan → review → implement → audit → retrospect** — where each stage is run by a role with strict boundaries, gated on the previous stage, and recorded as a durable document. The agent stops improvising and starts following a process you can inspect at every step.

## The idea

Pythia treats the conversation between you and an AI agent as something that needs structure, not just a chat box. It provides three things:

- **Roles with boundaries.** A Reviewer finds problems but never writes code. A Developer executes an approved plan but never redesigns it. An Architect plans and audits but doesn't implement. Roles can't bleed into each other, so you never get a "planner" that quietly ships its own untested guess.
- **Artifacts as shared memory.** Every stage writes a file — the plan, the review, the implementation report, the audit. These are the contract between human and agent and between one agent and the next. Reopen a feature months later and the full reasoning is on disk, versioned.
- **Gates and a verifiable loop.** Implementation can't start until a review verdict is `READY`. After implementation, an audit (run by a *fresh* agent, so it isn't biased by the session that wrote the code) decides what happens next: done, fix, patch the plan, or re-plan. The loop runs until the work genuinely passes — not until the agent claims it's finished.

## The feature lifecycle

```
/feat       Define the feature — problem, scope, success criteria   (Product Manager → Architect)
/research   Optional: investigate options, prior art, trade-offs     (Researcher)  → context doc
/plan       Turn it into concrete, validatable steps                 (Architect)   → plan.md
/review     Find gaps, risks, wrong assumptions — no fixes           (Reviewer)    → review.md
/implement  Execute the approved plan, run validation, report honestly (Developer) → implementation.md
/audit      Verify the result against the plan, fresh-eyed           (Architect)   → audit.md
/retro      Distill what was learned for next time                   (Architect)   → retro.md
```

The verdicts drive the loop automatically:

- **Review** `NEEDS_REVISION` → `/replan`, then review again (max 2 rounds, then it asks you).
- **Audit** `ready` → done · `needs-fixes` → Developer fixes · `plan-fix` → Architect patches the plan · `re-plan` → start the planning leg over.

Run any stage by hand, or hand the whole thing to **`/loop`**, which detects where a feature is from its artifacts and runs the remaining stages — spawning a separate sub-agent per role so isolation holds.

## Artifacts

Every feature is self-contained and hermetic:

```
.pythia/workflows/features/feat-YYYY-MM-{slug}/
├── feat-YYYY-MM-{slug}.md      # the feature definition
├── plans/      {n}-{slug}.plan.md
├── reports/    {n}-{slug}.review.md · .implementation.md · .audit.md
├── contexts/   research & context documents
└── notes/      retrospectives · audit problem logs
```

Plans are versioned, reviews and implementations are append-only across rounds, and a project-level retrospective (`/retro-all`) aggregates lessons across every feature into a living knowledge base.

## Installation

Pythia ships as a CLI that installs the whole workflow — skills, agent role definitions, and the `.pythia` working directory — into any project.

```bash
npx pythia-workspace          # auto: init a new workspace, or update an existing one
npx pythia-workspace init     # first-time install
npx pythia-workspace update   # pull the latest skills & instructions
```

Both commands accept `--target <dir>` (default: current directory) and `--dry-run` (preview without writing).

### What lands in your project

```
AGENTS.md / CLAUDE.md     # workflow instructions for Codex and Claude Code
.agents/skills/           # skills surface for Codex
.claude/skills/           # skills surface for Claude Code
.pythia/
  version.json            # installed version + content hashes (also the update signal)
  config.md               # your workspace config — never overwritten
  README.md
  workflows/              # where features and their artifacts live
```

`AGENTS.md` and `CLAUDE.md` come from a single source, so they can't drift apart. On `update`, the skills are refreshed and the instruction files regenerated — and if you've edited a generated file locally, it's saved to `<file>.bak` before being overwritten, so nothing is lost silently. Your `config.md` is seeded once and left alone.

## Skills

| Skill | Role | Purpose |
|-------|------|---------|
| `/workflow` | — | Overview and entry point for the full lifecycle |
| `/feat` | PM + Architect | Define a feature: problem, value, scope, success criteria |
| `/research` | Researcher | Investigate options & prior art → context document |
| `/ctx` | Architect | Create a standalone context document for a feature |
| `/plan` | Architect | Create or revise an implementation plan |
| `/review` | Reviewer | Surface gaps, risks, and ambiguities — without proposing fixes |
| `/replan` | Architect | Revise a plan after review findings or implementation blockers |
| `/implement` | Developer | Execute an approved plan and write the implementation report |
| `/audit` | Architect | Audit the implementation against the plan; issue the verdict |
| `/loop` | — | Detect feature state and orchestrate the remaining stages |
| `/retro` | Architect | Synthesize a retrospective for one feature |
| `/retro-all` | Architect | Aggregate retrospectives across all features |
| `/validate` | — | Check workflow Markdown against the format contract |
| `/skill-search-and-fit` | — | Find and evaluate agent skills from public catalogs |
| `/skill-sync-cursor-to-claude` | — | Sync skills from Cursor to Claude Code / Desktop |

## Configuration

`.pythia/config.md` is plain Markdown you own. It sets the agent's reply language and document language (which can differ), the paths to skills and workflows, and free-form project context the agent should always keep in mind. The CLI reads it but never rewrites it.

## Development

```bash
npm run build              # compile the CLI (tsc → dist/)
npm test                   # CLI tests (src/cli/tests/)
npm run test:workflow-doc  # workflow-document format validator tests
```

The CLI lives in `src/cli/`. The canonical skills source is `skills/`; the per-agent `.claude/skills` and `.agents/skills` directories are generated from it on install.

## Concept

For the full philosophy — Pythia as a mediator layer between human intent and model execution, the document taxonomy, and the core/working/project knowledge-transformation cycle — see [CONCEPT.md](CONCEPT.md).
