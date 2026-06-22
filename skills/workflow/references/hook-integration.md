# Hook integration (workflow skills)

Pythia installs **PreToolUse**, **PostToolUse**, and **Stop** hooks into the workspace (`.claude/settings.json`, `hooks.json`). Workflow skills must treat hooks as **guardrails**, not as substitutes for skill procedures.

## PostToolUse warnings ≠ Validator PASS

After **Edit/Write** on workflow `*.md` files, `post.js` runs advisory maintenance and structural checkers, then emits **warnings to stderr only**. Hooks **never block** saves.

Hook order for workflow docs:

1. `metadata/sync.js` updates derived metadata snapshots for plans, reviews, implementation reports, and audits.
2. Configured post-commands run next, including `inputs.js sync` when enabled by `## Post-commands`. `inputs.js sync` rebuilds `## References` from body link scan and `## Used by` from rdeps scan — phantom entries from prior LLM edits are removed at this step.
3. Workflow checkers from `## Workflow docs` run last (`structure.js`, `links.js`, `inputs-fresh.js`, `artifact-metadata.js`, `refs-owned.js`, ...).

This order lets checkers read the current metadata/input snapshot. It is still advisory; only `/validate` exit `0` is a validation pass.

**Phantom refs = bug**: if `## Used by` contains an entry not backed by an rdeps scan result, it is a phantom from a manual LLM edit. `refs-owned.js` catches these as `refs-owned.phantom_used_by` / `refs-owned.phantom_reference` errors. `inputs.js sync` removes them on the next save. Root cause: LLMs must never write or edit trailing refs sections.

| Signal | Meaning |
|--------|---------|
| PostToolUse stderr warnings | Fix if possible; **not** sufficient to claim format compliance |
| Validator subagent **exit `0`** per [/validate skill](../../validate/SKILL.md) | **Required** before claiming PASS or routing on verdicts |
| PostToolUse silent | **Not** proof of PASS — run Validator when the skill requires it |

**Do not** tell the user a workflow document "passed validation" based only on hook stderr (or lack of it).

## Workflow nudges (`pythia-nudge:`)

`post.js` calls `workflow-state.js` after workflow artifact edits. Messages are prefixed with `pythia-nudge:` on stderr.

| After edit | Typical nudge |
|------------|----------------|
| `*.plan.md` | Plan newer than review → `/review` |
| `*.review.md` | `NEEDS_REVISION` → `/replan`; `READY` → `/implement`; round ≥ 2 → escalate to user |
| `*.implementation.md` | Review not READY → warning; impl newer than audit → `/audit` |
| `*.audit.md` | Verdict routing → `/implement`, `/replan`, `/plan`, or done |

**`/loop` orchestrator**: reconcile nudges with **State Detection** (artifact files are authoritative). When working **outside** `/loop`, treat nudges as routing hints and run the suggested skill or spawn the correct subagent.

## PreToolUse and Stop

- **pre.js**: DENY only shell redirection into protected/cache paths; role-boundary and generated-cache edits are **warn-only**.
- **stop.js**: `footer-presence` checker on the assistant turn + reminder to report changed files. Footer enforcement is at **Stop**, not every turn — still emit `## Next Steps` and `**Active context**:` per [response-formats.md](response-formats.md) on every workflow skill reply.

## Codex

Codex workspaces also ship `.codex/rules/default.rules` with the same path/guardrail intent as `pre.js` prose guardrails.
