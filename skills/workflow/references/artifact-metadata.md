# Artifact Metadata Contract

Workflow artifacts use one body `## Metadata` section with plain markdown list items (`- key: value`) — no bold keys, no YAML frontmatter, no `Schema:` tag.

```md
## Metadata

- key: value
```

Document identity (`kind`, `id`, `title`, `feature`) is **inferred from file path** — never written in metadata. See [Inferred fields](#inferred-fields) below.

`## References` and `## Used by` are machine-owned by `inputs.js sync` — never part of artifact metadata.

## Inferred fields

| Field | Source |
| ----- | ------ |
| `kind` | File suffix (see [Artifact kinds](#artifact-kinds) below) |
| `id` | Filename slug (basename without extension suffixes) |
| `title` | File's H1 line |
| `feature` | Nearest `feat-*` path segment |

**Suffix classification order** (first match wins):

1. `*.retro.md` → `retro`
2. `*.plan.md` → `plan`
3. `*.review.md` → `review`
4. `*.implementation.md` → `implementation-report`
5. `*.audit.md` → `audit-report`
6. `*.context.md` or `*.ctx.md` → `context`
7. `feat-*.md` → `feature`
8. `*.md` → `note`

This order ensures `feat-*.retro.md` is classified as `retro`, not `feature`.

## Forbidden metadata keys

These keys must **not** appear in `## Metadata` on any workflow artifact:

`Schema`, `Title`, `Artifact`, `Feature`, `Id`, `Plan-Id`

They are either inferred from path (no need to write them) or removed in the v1 → v2 migration.

## Artifact kinds

### Plan

Required: `status`, `version`
Optional: `branch`, `updated`

| Key | Values |
| --- | ------ |
| `status` | `Draft` · `Ready for implementation` · `In progress` · `Implemented` · `Blocked` · `Archived` · `Cancelled` |
| `version` | `v{N}` |
| `branch` | git branch name |
| `updated` | `YYYY-MM-DD` |

**Note**: `status` and `version` are written; `round` is **not** a plan metadata key. The plan revision log **table column** `Round` is part of the plan body, not plan metadata.

### Review

Required: `status`, `plan_version`, `round`, `verdict`
Optional: `updated`

| Key | Values |
| --- | ------ |
| `status` | `active` · `completed` · `archived` |
| `plan_version` | `v{N}` — snapshot of plan version at review time |
| `round` | `R{N}` |
| `verdict` | `READY` · `NEEDS_REVISION` |
| `updated` | `YYYY-MM-DD` |

### Implementation report

Required: `status`, `plan_version`, `round`, `result`
Optional: `updated`

| Key | Values |
| --- | ------ |
| `status` | `active` · `completed` · `blocked` |
| `plan_version` | `v{N}` |
| `round` | `I{N}` |
| `result` | `implemented` · `partial` · `blocked` · `failed` |
| `updated` | `YYYY-MM-DD` |

### Audit report

Required: `status`, `round`, `verdict`
Optional: `updated`

| Key | Values |
| --- | ------ |
| `status` | `active` · `completed` |
| `round` | `A{N}` |
| `verdict` | `ready` · `needs-fixes` · `plan-fix` · `re-plan` |
| `updated` | `YYYY-MM-DD` |

### Feature doc

All optional: `status`, `updated`

| Key | Values |
| --- | ------ |
| `status` | `draft` · `active` · `completed` · `archived` · `cancelled` |

### Context

All optional: `status`, `kind`, `updated`

| Key | Values |
| --- | ------ |
| `status` | `draft` · `ready` · `active` · `archived` |
| `kind` | `research` |

`kind: research` replaces the v1 `Artifact: research-context` field.

### Retro

All optional: `status`, `updated`

| Key | Values |
| --- | ------ |
| `status` | `active` · `completed` · `archived` |

### Note / task

All optional: `status`, `updated`

## v1 → v2 key mapping

| v1 key | v2 key / action |
| --- | --- |
| `Schema` | **drop** (inferred) |
| `Id` | **drop** (inferred from filename) |
| `Title` | **drop** (inferred from H1) |
| `Artifact` | **drop** (inferred from path suffix) |
| `Feature` | **drop** (inferred from path) |
| `Plan-Id` | **drop** |
| `Version` (plan) | → `version` |
| `Status` (any) | → `status` |
| `Branch` | → `branch` |
| `Round` (plan metadata only) | **drop** from plan `## Metadata` (table column stays) |
| `Round` (review) | → `round` |
| `Round` (implementation) | → `round` |
| `Round` (audit) | → `round` |
| `Plan-Version` | → `plan_version` |
| `Plan Version` | → `plan_version` |
| `Verdict` | → `verdict` |
| `Result` | → `result` |
| `Artifact: research-context` | → path-inferred `context` kind + `kind: research` |

## Machine-readable contract

This JSON block is consumed by `tools/lib/metadata/schema.js`. Keep it aligned with the human tables above.

```json artifact-metadata-contract
{
  "schemaVersion": "pythia-artifact-v2",
  "inferredFromPath": ["kind", "id", "title", "feature"],
  "forbiddenKeys": ["Schema", "Title", "Artifact", "Feature", "Id", "Plan-Id"],
  "classificationOrder": ["retro", "plan", "review", "implementation-report", "audit-report", "context", "feature", "note"],
  "artifacts": {
    "plan": {
      "patterns": ["*.plan.md"],
      "required": ["status", "version"],
      "optional": ["branch", "updated"],
      "enums": {
        "status": ["Draft", "Ready for implementation", "In progress", "Implemented", "Blocked", "Archived", "Cancelled"]
      }
    },
    "review": {
      "patterns": ["*.review.md"],
      "required": ["status", "plan_version", "round", "verdict"],
      "optional": ["updated"],
      "enums": {
        "status": ["active", "completed", "archived"],
        "verdict": ["READY", "NEEDS_REVISION"]
      }
    },
    "implementation-report": {
      "patterns": ["*.implementation.md"],
      "required": ["status", "plan_version", "round", "result"],
      "optional": ["updated"],
      "enums": {
        "status": ["active", "completed", "blocked"],
        "result": ["implemented", "partial", "blocked", "failed"]
      }
    },
    "audit-report": {
      "patterns": ["*.audit.md"],
      "required": ["status", "round", "verdict"],
      "optional": ["updated"],
      "enums": {
        "status": ["active", "completed"],
        "verdict": ["ready", "needs-fixes", "plan-fix", "re-plan"]
      }
    },
    "retro": {
      "patterns": ["*.retro.md"],
      "required": [],
      "optional": ["status", "updated"],
      "enums": {
        "status": ["active", "completed", "archived"]
      }
    },
    "context": {
      "patterns": ["*.context.md", "*.ctx.md"],
      "required": [],
      "optional": ["status", "kind", "updated"],
      "enums": {
        "status": ["draft", "ready", "active", "archived"],
        "kind": ["research", "brainstorm"]
      }
    },
    "feature": {
      "patterns": ["feat-*.md"],
      "required": [],
      "optional": ["status", "updated"],
      "enums": {
        "status": ["draft", "active", "completed", "archived", "cancelled"]
      }
    },
    "note": {
      "patterns": ["*.md"],
      "required": [],
      "optional": ["status", "updated"],
      "enums": {}
    }
  }
}
```

## Examples

### Plan

```md
# Plan 9-example: Example Feature Repair

## Metadata

- status: Draft
- version: v1
- branch: main
- updated: 2026-06-23
```

### Review

```md
# 9-example Review — READY

## Metadata

- status: completed
- plan_version: v1
- round: R1
- verdict: READY
- updated: 2026-06-23
```

### Implementation report

```md
# 9-example Implementation

## Metadata

- status: completed
- plan_version: v1
- round: I1
- result: implemented
- updated: 2026-06-23
```

### Audit report

```md
# 9-example Audit

## Metadata

- status: completed
- round: A1
- verdict: ready
- updated: 2026-06-23
```

### Feature doc

```md
# Feature: Example Feature

## Metadata

- status: active
```

### Context (research)

```md
# Research: Example Options Survey

## Metadata

- status: ready
- kind: research
- updated: 2026-06-23
```

## Migration

Metadata migration covers sync-eligible `.pythia/` data markdown: `.pythia/**/*.md` except `.pythia/README.md`, `.pythia/config/**`, `.pythia/runtime/**`, `.pythia/backups/**`, `AGENTS.md`, and `CLAUDE.md`. It converts v1 bold-bullet metadata (including `Schema: pythia-artifact-v1` headers) to v2 list `- key: value` format, drops forbidden fields, strips legacy YAML frontmatter, and prepends H1 from legacy `Title` or slug when missing.
