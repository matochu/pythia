# Skill: /validate

**Purpose**: Check that workflow Markdown **matches the documented format contract** (plans, reviews, implementation reports, audits).

**Audience — read carefully**:

- **Validator** (Validator subagent, CI, or a human explicitly running `/validate`): you may use the **Commands** section and internal implementation details below.
- **All other roles** (`/plan`, `/replan`, `/review`, `/implement`, `/audit`, `/loop` orchestrator): **do not** memorize or paste shell commands. Delegate to a Validator subagent using **only** the handoff block in § Validator subagent (delegation), or use **inline fallback** by opening **this** skill file and running the procedure here **once** for the target path.

**Normative formats**: `.claude/skills/workflow/references/plan-format.md`, `review-format.md`, `implementation-format.md`, `audit-format.md`.

**Implementation / operator reference**: [scripts/README-validate-workflow-doc.md](../../../scripts/README-validate-workflow-doc.md)

## Supported files

| Pattern | Type |
|---------|------|
| `*.plan.md` | plan |
| `*.review.md` | review |
| `*.implementation.md` | implementation |
| `*.audit.md` | audit |

If the basename does not end with one of these suffixes, pass `--type plan|review|implementation|audit`.

## Commands (Validator / operator — implementation detail)

The subsections below are **not** for `/plan`, `/review`, etc. Parents delegate via § Validator subagent (delegation).

### From Pythia repo root

Run **without** redirecting output into the repository (no `> out.txt`, `tee log.txt`, etc.).

```bash
bash scripts/validate-workflow-doc.sh /absolute/path/to/file.md
bash scripts/validate-workflow-doc.sh file1.md file2.md
bash scripts/validate-workflow-doc.sh --type plan /path/to/unusual.md
bash scripts/validate-workflow-doc.sh --mdlint /path/to/file.plan.md   # optional; requires markdownlint on PATH
```

### Paths

Arguments may be **absolute** or **relative** paths to `.md` files. Run the script from **this repository root** so `scripts/` resolves correctly.

## Exit codes

- `0` — all checked files passed the workflow-doc contract check.
- `1` — contract violation (see stderr; each line should include a `[rule_id]`).
- `2` — usage error, missing file, or unknown type.

## Hard rules for agents

1. **Do not** state that a workflow document passes the contract unless the validation procedure in **this** skill completed with **exit `0`** in this session (Validator subagent counts).
2. Copy **stderr** into the chat when reporting failures.
3. This skill is **validation only** — fixing content is done by the Architect / Reviewer / Developer / Audit roles, not by inventing structure checks ad hoc.
4. **No auxiliary files (mandatory)**: while validating, **do not** create, overwrite, or delete any files in the workspace — no `.txt` / `.log` captures, no `>` / `>>` / `tee` into the repo tree, no scratch files next to the workflow doc. The official shell entrypoint **only reads** the target `.md` and prints diagnostics to the terminal (**stderr**). Report **exit code** and **stderr** in the chat from the live command stream only.

## Validator subagent (delegation)

Parent skills (`/plan`, `/replan`, `/review`, `/implement`, `/audit`, `/loop`) should run **workflow-doc validation** in a **separate context** when the host supports subagents (Task tool or equivalent). Parents **must not** paste shell commands into their prompts — only paths and this handoff text.

### Handoff prompt (parents — substitute absolute paths; no `bash` lines here)

```
You are the Validator subagent.

1. Open and follow ONLY the /validate skill at this absolute path:
   {ABS_PATH_TO_VALIDATE_SKILL}
   (e.g. …/.agents/skills/validate/SKILL.md or …/.claude/skills/validate/SKILL.md in this repo.)
2. Validate exactly this workflow Markdown file (absolute path):
   {ABS_PATH_TO_WORKFLOW_MD}
3. Execute the validation procedure defined inside that skill (which checkout to use, env vars if any — all details are in the skill, not in this message). Do not edit the Markdown file. **Do not** write any files (no logs, no redirects into the workspace).
4. Reply with: (a) exit code, (b) full stderr if non-zero, (c) one line: PASS or FAIL.
```

### Host mapping (parent roles / Task tool)

If “spawn Validator subagent” is ambiguous: **plan**, **replan**, **review**, **implement**, **audit**, and **loop** each document **(Concrete tooling — …)** under their **Validation** (or orchestrator) section — **Task** / `subagent_type` (e.g. `generalPurpose` or the same profile [/loop](../loop/SKILL.md) uses) and **handoff-only** delegated bodies (role-specific “do not paste …” lines). [.agents/skills/review/SKILL.md](../review/SKILL.md) shows the full pattern for Reviewer; use the same mechanics for other roles.

### Rules for parent roles

- Do **not** claim the contract check passed unless the Validator subagent returned **exit `0`**, or you used **inline fallback**: you opened `{ABS_PATH_TO_VALIDATE_SKILL}` yourself and completed **one** validation run for `{ABS_PATH_TO_WORKFLOW_MD}` per that document, then reported exit code + stderr.
- On failure, forward stderr `[rule_id]` lines to the authoring role for fixes, then re-run Validator.

### Loop orchestrator

When `/loop` spawns Reviewer / Developer / Audit subagents, the **orchestrator** should run the Validator subagent (or inline fallback) on the artifact **after** that subagent returns and **before** parsing verdicts or routing — see [/loop skill](../loop/SKILL.md).

## Role → which artifact to validate

| Role / action | Artifact |
|---------------|----------|
| After Architect creates or revises a plan | `*.plan.md` |
| After Reviewer writes a round | `*.review.md` |
| After Developer updates implementation report | `*.implementation.md` |
| After Architect writes audit | `*.audit.md` |

## Failure playbook (short)

- **Exit 1**: open the cited `[rule_id]`, compare with the format spec, patch the Markdown, re-run this skill until exit 0.

## Limitations

- The check covers **structure and enums** from the format specs, not whether review comments are correct or audit reasoning is sound.
- Optional `--mdlint` is hygiene only; the default run is the format contract.

## See also

- `scripts/validate-plan.sh` — plan-only (also invoked by the dispatcher).
- `scripts/validators/` — review / implementation / audit profiles.
