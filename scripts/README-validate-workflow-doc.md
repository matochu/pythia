# validate-workflow-doc — CLI contract

Structural validation for Pythia workflow Markdown (plans, reviews, implementation reports, audits). Specs live under `.claude/skills/workflow/references/*-format.md`.

## Side effects

Validators **read** the target `.md` file(s) and print diagnostics to **stderr** (and may print a short success line to **stdout** for plan-only direct runs). They **do not** create, overwrite, or delete workspace files — no log/capture `.txt`, no temp artifacts under the project tree. When invoking from an agent host, run the script **without** shell redirection into the repository (`>`, `>>`, `tee` to paths under the repo).

## Command

```bash
bash scripts/validate-workflow-doc.sh [options] <file.md> [file.md ...]
```

Run from the **Pythia repository root** (or invoke `scripts/validate-workflow-doc.sh` via an absolute path to this repo). Pass **absolute or relative** paths to each `.md` file to check.

## Options

| Option | Meaning |
|--------|---------|
| `--type plan\|review\|implementation\|audit` | Force document type (default: infer from filename suffix). |
| `--mdlint` | Run `markdownlint` on each file if `markdownlint` is on `PATH` (optional hygiene). |
| `--no-mdlint` | Do not run markdownlint (default). |
| `-h`, `--help` | Print usage and exit 0. |

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | All files passed structural checks. |
| `1` | One or more contract violations (see stderr). |
| `2` | Usage error, missing file, unknown type, or validator script failure. |

## Stderr format

Each problem line should look like:

```text
/path/to/file.md:LINE: [rule_id] Human-readable message
```

When a line number is not available, `LINE` may be `0`.

Stable `rule_id` values are defined in the validator scripts (e.g. `plan.revision_log.round_tokens`, `review.round.verdict`).

## Supported files

| Suffix | Type |
|--------|------|
| `*.plan.md` | plan |
| `*.review.md` | review |
| `*.implementation.md` | implementation |
| `*.audit.md` | audit |

## See also

- `scripts/validate-plan.sh` — plan-only entry (also invoked by the dispatcher).
- Skill: `.agents/skills/validate/SKILL.md` (agent invocation contract).
