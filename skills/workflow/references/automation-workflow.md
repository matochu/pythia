# Automation Workflow Guide

**Purpose**: Capture process automation opportunities and reusable project findings during planning, review, implementation, audit, and retrospective cycles.

## Core Rule

Do not create `## Observations` sections in workflow artifacts.

- Reusable project findings go to `## Retrospective`.
- User choices, corrections, and preferences go to `## Decision Log`.
- `## Decision Log` is user-only and uses simple entries: `{context/condition}: {decision, correction, or preference}`.
- Retrospective labels are extensible. Suggested labels include `[codebase]`, `[risk]`, `[process]`, `[tooling]`, `[plan]`, `[research]`, and `[automation]`.

## What To Capture In Retrospective

Record findings that are useful beyond the current local edit or research question:

- `[codebase]` bugs, fragile patterns, technical debt, missing error handling, maintainability issues
- `[risk]` reusable risks, anti-patterns, deprecations, or future validation checks
- `[process]` workflow friction, repeated manual coordination, unclear handoffs
- `[tooling]` validator, script, fixture, or command behavior that should shape future work
- `[plan]` plan structure failures or planning assumptions that did not hold
- `[research]` reusable research lessons, source-selection patterns, unresolved knowledge gaps
- `[automation]` repeated procedures that are candidates for scripts, validators, or skills

Do not put one-off implementation summaries, issue restatements, or user decisions in Retrospective.

## Capture Points

### Planning (`/plan`)

**Where**: plan document `## Retrospective`.

**Capture**:

- codebase constraints discovered while planning
- plan assumptions that may affect future features
- repeated manual validation or dependency tracking patterns
- automation opportunities noticed before implementation

```markdown
## Retrospective

### v1 — 2026-05-15

- [codebase] Existing context indexes are manually maintained and easy to desynchronize.
- [automation] Plan validation and context input checks repeat across `/plan` and `/replan`.
```

### Review (`/review`)

**Where**: review report `## Retrospective`.

**Capture**:

- reusable risks found while reviewing the plan
- recurring plan-quality failures
- missing validation patterns that should inform future planning
- automation opportunities identified from repeated review findings

Review reports must not contain `## Decision Log`; reviewer findings belong in the review body, and transferable lessons belong in `## Retrospective`.

### Implementation (`/implement`)

**Where**: implementation report `## Retrospective`, grouped under the current implementation round when the report is round-based.

**Capture**:

- codebase behavior that surprised or constrained implementation
- tooling or validation gaps found while executing the plan
- plan assumptions that were wrong or incomplete
- repeated command or edit patterns suitable for automation

```markdown
## Retrospective

### I1 — 2026-05-15

- [tooling] Workflow validators need explicit guardrails for legacy section names.
- [automation] The same parity scan is needed across `.agents` and `.claude` skill copies.
```

Implementation changes themselves belong in `## Summary` or `### Out-of-Plan Work`, not in Retrospective.

### Replan (`/replan`)

**Where**: updated plan `## Retrospective`, usually as a new `### v{N}` block.

**Capture**:

- synthesized findings from review and implementation reports
- repeated problems across multiple rounds
- risks that became concrete during implementation
- automation opportunities that recur across artifacts

Replan should consolidate duplicate Retrospective entries instead of copying every source line.

### Research (`/research`)

**Where**: context or research markdown `## Retrospective`.

**Capture**:

- reusable research findings useful outside the current topic
- source-selection or verification lessons
- domain risks and unresolved knowledge gaps
- workflow lessons for future research, planning, or audit

Research user choices and corrections go to `## Decision Log`, not Retrospective.

### Audit (`/audit`)

**Where**: audit report body and follow-up direction.

**Capture/use**:

- read plan and implementation `## Retrospective`
- check whether unresolved retrospective findings affect the audit verdict
- read user-only `## Decision Log` only for conformance to explicit user choices
- do not require priority labels or structured metadata in `## Decision Log`

Audit findings are verdict evidence. Durable project learnings can later be synthesized by `/retro`.

### Feature Retrospective (`/retro`)

**Where**: feature retro report.

**Collects**:

- all `## Retrospective` blocks from plans, reviews, implementation reports, audits, and feature contexts/research files
- user-only `## Decision Log` blocks from plans, implementation reports, replans, and research contexts

**Synthesis**:

- merge duplicate findings
- keep reusable project lessons
- filter out local one-off corrections
- highlight repeated user/workflow preferences as evidence for future profile or audit work
- do not write user profile files directly

## Decision Log Boundary

`## Decision Log` is not a backlog and not a codebase issue list. It captures only explicit user choices/corrections in a simple form:

```markdown
## Decision Log

- Chat responses: write implementation summaries in Ukrainian.
- Workflow implementation reports: always write implementation docs in English.
- `/research` invocation syntax: do not add flag-style options.
```

Do not add `User:` prefixes, effect columns, priority labels, or Type/Status/Durability metadata.

## Automation Candidate Checklist

Good automation candidates usually have at least one of these properties:

- same command sequence appears in several workflow stages
- same validation scan is manually repeated across `.agents` and `.claude`
- same fixture update is required after every format contract change
- same cross-artifact consistency check keeps finding regressions
- same context/input dependency update is easy to forget

Prefer recording automation candidates in Retrospective first. Create or change automation only when the repeated pattern is clear enough to justify it.

## See Also

- [plan-format.md](./plan-format.md) — plan Retrospective and Decision Log structure
- [implementation-format.md](./implementation-format.md) — implementation report Retrospective and Decision Log structure
- [review-format.md](./review-format.md) — review Retrospective structure
