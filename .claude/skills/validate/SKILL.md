---
name: validate
description: Validate workflow markdown documents such as plans, reviews, implementation reports, and audits against the required format contract.
---

# Skill: /validate

**Purpose**: Check workflow Markdown against the **format contract** (plans, reviews, implementation reports, audits).

**Audience**: **Validator** (subagent, CI, human running `/validate`) uses **Commands** below. **Other skills** only delegate using § Validator subagent — **no** shell in parent prompts.

**Normative formats**: `.claude/skills/workflow/references/plan-format.md`, `review-format.md`, `implementation-format.md`, `audit-format.md`.

**Operator reference**: [scripts/README-validate-workflow-doc.md](../../../scripts/README-validate-workflow-doc.md)

## Supported files

| Pattern | Type |
|---------|------|
| `*.plan.md` | plan |
| `*.review.md` | review |
| `*.implementation.md` | implementation |
| `*.audit.md` | audit |

If the basename does not end with one of these suffixes, pass `--type plan|review|implementation|audit`.

## Commands (Validator / operator — implementation detail)

### From Pythia repo root

Do **not** redirect command output into the repo (no `> file.txt` / `tee`).

```bash
bash scripts/validate-workflow-doc.sh /absolute/path/to/file.md
bash scripts/validate-workflow-doc.sh file1.md file2.md
bash scripts/validate-workflow-doc.sh --type plan /path/to/unusual.md
bash scripts/validate-workflow-doc.sh --mdlint /path/to/file.plan.md   # optional; requires markdownlint on PATH
```

### Paths

Run from **this repository root**. File arguments may be absolute or relative paths to `.md` files.

## Exit codes

- `0` — passed contract check.
- `1` — contract violation.
- `2` — usage / missing file / unknown type.

## Hard rules for agents

1. **Do not** claim a workflow document passes unless the procedure in **this** skill completed with **exit `0`** in this session.
2. Include **stderr** in the chat when reporting failures.
3. **No auxiliary files (mandatory)**: do **not** create `.txt`/`.log` or any capture files in the workspace; no `>`/`tee` into the repo. The script **only reads** the target `.md`; stream results to the terminal and chat only.

## Validator subagent (delegation)

Parent skills should run validation in a **separate context** when possible. Parents **must not** paste `bash` lines — only paths and this template.

### Handoff prompt (parents — substitute absolute paths)

```
You are the Validator subagent.

1. Open and follow ONLY the /validate skill at:
   {ABS_PATH_TO_VALIDATE_SKILL}
2. Validate exactly this workflow Markdown file:
   {ABS_PATH_TO_WORKFLOW_MD}
3. Run the procedure defined inside that skill (cd, env — all details are there). Do not edit the Markdown file. **Do not** write any files (no logs, no redirects into the workspace).
4. Reply: exit code, full stderr if non-zero, PASS or FAIL.
```

### Host mapping (parent roles / Task tool)

If “spawn Validator subagent” is ambiguous: **plan**, **replan**, **review**, **implement**, **audit**, and **loop** each document **(Concrete tooling — …)** under **Validation** (or the orchestrator block for `/loop`). See [.agents/skills/review/SKILL.md](../../.agents/skills/review/SKILL.md) for the Reviewer pattern; sibling skills mirror the same **Task** / `subagent_type` / handoff-only rules for their role.

### Rules for parent roles

- Do **not** claim pass unless Validator returned **exit `0`**, or **inline fallback**: you opened `{ABS_PATH_TO_VALIDATE_SKILL}` and completed **one** run for `{ABS_PATH_TO_WORKFLOW_MD}` per that document.

### Loop orchestrator

See [/loop skill](../loop/SKILL.md).

## Role → artifact

| Action | File |
|--------|------|
| Plan created / replanned | `*.plan.md` |
| Review round written | `*.review.md` |
| Implementation report updated | `*.implementation.md` |
| Audit written | `*.audit.md` |

## Limitations

Structural / enum checks from format specs only, not semantic quality of review or audit text.
