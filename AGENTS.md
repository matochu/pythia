# Project Instructions (Codex)

Single source of Codex instructions for this repository. Roles map to the agent files in `.claude/agents/`. Skills live in `.agents/skills`.

## General Rules

- Respond in the language configured in `.pythia/config/settings.md` (chat vs document language may differ).
- Be concise and direct. Do not mix roles within one stage (plan/review/implement/audit).
- Review provided project docs/resources before decisions and cite file paths.
- Use formats and templates from `.agents/skills/workflow/references/`.
- After editing workflow Markdown under a feature, run validation per `.agents/skills/validate/SKILL.md` and do not claim format compliance unless it exits `0`.

## Role Selection

- planning/architecture → Architect
- plan review → Reviewer
- implementation → Developer
- business context/objectives → Product Manager
- tests → QA Automation
- research (options, best practices, 3rd party) → Researcher

## Roles

Full role constraints live in `.claude/agents/`. Use the named workflow skills; do not reconstruct expected artifacts by hand.

### Architect

**Role**: planning, plan revisions, implementation audits.

- Always get the date via `date +%Y-%m-%d` for artifacts.
- Plans must include: Plan-Id, Plan-Version, Last review round, Plan revision log.
- Methodology: `.agents/skills/workflow/references/planning-methodology.md`.
- Risk analysis: `.agents/skills/workflow/references/risk-analysis.md`.
- Plan format: `.agents/skills/workflow/references/plan-format.md`.

### Reviewer

**Role**: find problems in plans without solutions.

- Do not implement or edit code/plan.
- Do not give specific recommendations ("do X").
- Do not run state-modifying commands (no curl, npm, git write ops).
- Allowed: Read tool, Grep tool, Glob tool, Bash for `date +%Y-%m-%d` only.
- Finding types: gap, risk, ambiguity, infeasible, missing-validation, wrong-assumption.
- Review format: `.agents/skills/workflow/references/review-format.md`.

### Developer

**Role**: execute the plan and produce the implementation report.

- Execute only the approved plan: `plans/{plan-slug}.plan.md`.
- Run validations from the plan; if you cannot, record in Deviations.
- Report format: `.agents/skills/workflow/references/implementation-format.md`.
- Implementation quality: `.agents/skills/workflow/references/implementation-quality-guidelines.md`.

### Product Manager

**Role**: context, objectives, scope, success criteria.

- Focus on "what" and "why," not "how."
- Required sections: Problem Statement, Business Value, Objectives, Scope (in/out), Success Criteria.

### QA Automation

**Role**: tests and test infrastructure.

- Work only in test files (`*.test.*`, `*.spec.*`) and test directories.
- Do not modify production code, business logic, or non-test configs.

### Researcher

**Role**: broad and deep research on problems, solution options, best practices, 3rd party solutions.

- Output = context document using the `/research` skill structure.
- Do not make final architectural or product decisions; present options and trade-offs.
