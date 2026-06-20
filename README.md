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
npx pythia-workspace [target-dir]          # auto: init a new workspace, or update an existing one
npx pythia-workspace init [target-dir]     # first-time install
npx pythia-workspace update [target-dir]   # pull the latest skills & instructions (one-step, even for old workspaces)
npx pythia-workspace version [target-dir]  # show installed framework version, surfaces, migration status
npx pythia-workspace uninstall [target-dir] # remove managed surfaces and runtime (preserves .pythia/workflows/)
```

`target-dir` is a positional argument (default: current directory). `init`, `update`, and `uninstall` accept `--dry-run` (preview without writing). `uninstall` also accepts `--yes` to skip the confirmation prompt.

### What lands in your project

See [docs/workspace-manager.md](docs/workspace-manager.md#layout-and-terminology) for **project root vs pythia workspace**, git layers, and how `inputs.js` resolves paths.

```
AGENTS.md / CLAUDE.md     # workflow instructions for Codex and Claude Code
.agents/skills/           # skills surface for Codex
.claude/skills/           # skills surface for Claude Code
.pythia/                  # pythia workspace (not the CLI target itself — target is the parent dir)
  manifest.json           # installed version + content hashes (managed by CLI)
  config/settings.md      # your workspace config — never overwritten
  README.md
  workflows/              # where features and their artifacts live
  runtime/                # materialized hooks, checks, migrate engine (regenerated by update)
```

`AGENTS.md` and `CLAUDE.md` come from a single source, so they can't drift apart. On `update`, the skills are refreshed and the instruction files regenerated — and if you've edited a generated file locally, the previous content is saved under `.pythia/backups/managed-overwrites/` before being overwritten. Your `config/settings.md` is seeded once and left alone.

To remove everything pythia installed while keeping your workflow artifacts, run `npx pythia-workspace uninstall --yes` (required in CI/scripts; interactive TTY sessions get a confirmation prompt). See [docs/workspace-manager.md](docs/workspace-manager.md) for the full removal contract.

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

Workspace settings live in `.pythia/config/settings.md` (plain Markdown you own): reply language, document language, and project context. The path registry is `.pythia/config/paths.md`. The CLI seeds these once; migrations may rename legacy paths (e.g. `.pythia/config.md` → `.pythia/config/settings.md`) on `update`.

## Development

```bash
npm test                   # vitest (tools/cli/tests/, tools/migrate/, tools/hooks/, tools/lib/)
npm run test:workflow-doc  # workflow-document format validator tests
npm run release:check-migrations
```

The CLI lives in `tools/cli/`. The migration engine lives in `tools/migrate/` (materialized into `.pythia/runtime/migrate/` in each workspace on `init`/`update`). Canonical skills source is `skills/`; `.claude/skills`, `.agents/skills`, and opt-in `.cursor/skills` are installed surfaces generated on `pythia init`.

## Concept

For the full philosophy — Pythia as a mediator layer between human intent and model execution, the document taxonomy, and the core/working/project knowledge-transformation cycle — see [CONCEPT.md](CONCEPT.md).
