# Hook integration (workflow skills)

Pythia installs **PreToolUse**, **PostToolUse**, and **Stop** hooks into the workspace (`.claude/settings.json`, `hooks.json`). Workflow skills must treat hooks as **guardrails**, not as substitutes for skill procedures.

## PostToolUse warnings ≠ Validator PASS

After **Edit/Write** on workflow `*.md` files, `post.js` runs structural checkers (`doc-structure.js`, `links.js`, …) and emits **warnings to stderr only**. Hooks **never block** saves.

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
