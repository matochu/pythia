# Artifact Metadata Contract

Workflow artifacts use one body `## Metadata` section. Metadata is parsed only from bullet lines in this exact shape:

```md
## Metadata

- **Key**: value
```

`Schema: pythia-artifact-v1` is the contract id for the current field matrix below. This reference is the runtime source of truth used by skills and validation. Generated `## References` and `## Used by` remain owned by input freshness tooling and are not part of artifact metadata.

## Universal Fields

Every schema-tagged document requires only the fields that identify the metadata contract and the document:

- `Schema`
- `Id`
- `Title`
- `Artifact`

Other fields are artifact-specific and configured by the field matrix. Avoid fields that merely restate runtime evidence or can go stale, such as generated `Created` / `Updated` dates.

## Optional Fields

The schema currently recognizes these optional fields:

- `Feature`
- `Status`
- `Version`
- `Generator`
- `Plan`
- `Plan-Version`
- `Review`
- `Implementation`
- `Round`
- `Verdict`
- `Result`
- `Branch`
- `Shape`
- `Sub-category`
- `Tags`

Unknown fields fail for schema-tagged files. This keeps migrations honest: stale legacy keys must be removed, not tolerated.

## Artifact Matrix

| Artifact | Required fields beyond universal | Common optional fields | Closed enums |
| -------- | -------------------------------- | ---------------------- | ------------ |
| `feature` | none | `Status` | `Status`: `draft`, `active`, `completed`, `archived`, `cancelled` |
| `context` | none | `Feature`, `Shape`, `Status` | `Status`: `draft`, `ready`, `active`, `archived`; `Shape`: `notes`, `survey`, `decision-record`, `source-summary` |
| `research-context` | none | `Feature`, `Shape`, `Status` | `Status`: `draft`, `ready-for-plan`, `ready`, `archived`; `Shape`: `survey`, `options`, `source-summary`, `decision-support` |
| `plan` | `Status`, `Version`, `Branch`, `Round` | `Feature` | `Status`: `Draft`, `Ready for implementation`, `In progress`, `Implemented`, `Blocked`, `Archived`, `Cancelled` |
| `review` | `Plan`, `Plan-Version`, `Round`, `Verdict` | `Feature`, `Status` | `Status`: `active`, `completed`, `archived`; `Verdict`: `READY`, `NEEDS_REVISION` |
| `implementation-report` | `Plan`, `Plan-Version`, `Review`, `Round`, `Result` | `Feature`, `Status` | `Status`: `active`, `completed`, `blocked`; `Result`: `implemented`, `partial`, `blocked`, `failed` |
| `audit-report` | `Implementation`, `Round`, `Verdict` | `Feature`, `Status` | `Status`: `active`, `completed`; `Verdict`: `ready`, `needs-fixes`, `plan-fix`, `re-plan` |
| `retro` | none | `Feature`, `Status` | `Status`: `active`, `completed`, `archived` |
| `note` | none | `Feature`, `Tags` | none |

`Status` is lifecycle state. `Verdict` is a review or audit decision. `Result` is the current implementation outcome snapshot; detailed progress stays in the implementation report body and compatibility table.

## Machine-Readable Contract

This JSON block is consumed by validators. Keep it aligned with the human table above.

```json artifact-metadata-contract
{
  "schemaVersion": "pythia-artifact-v1",
  "universalFields": ["Schema", "Id", "Title", "Artifact"],
  "optionalFields": [
    "Feature",
    "Status",
    "Version",
    "Generator",
    "Plan",
    "Plan-Version",
    "Review",
    "Implementation",
    "Round",
    "Verdict",
    "Result",
    "Branch",
    "Shape",
    "Sub-category",
    "Tags"
  ],
  "artifacts": {
    "feature": {
      "patterns": ["feat-*.md"],
      "required": ["Schema", "Id", "Title", "Artifact"],
      "generators": ["feat"],
      "enums": {
        "Status": ["draft", "active", "completed", "archived", "cancelled"]
      }
    },
    "context": {
      "patterns": ["*.context.md", "*.ctx.md"],
      "required": ["Schema", "Id", "Title", "Artifact"],
      "generators": ["ctx", "research"],
      "enums": {
        "Status": ["draft", "ready", "active", "archived"],
        "Shape": ["notes", "survey", "decision-record", "source-summary"]
      }
    },
    "research-context": {
      "patterns": ["*.context.md", "*.ctx.md"],
      "required": ["Schema", "Id", "Title", "Artifact"],
      "generators": ["research"],
      "enums": {
        "Status": ["draft", "ready-for-plan", "ready", "archived"],
        "Shape": ["survey", "options", "source-summary", "decision-support"]
      }
    },
    "plan": {
      "patterns": ["*.plan.md"],
      "required": ["Schema", "Id", "Title", "Artifact", "Status", "Version", "Branch", "Round"],
      "generators": ["plan", "replan"],
      "enums": {
        "Status": ["Draft", "Ready for implementation", "In progress", "Implemented", "Blocked", "Archived", "Cancelled"]
      }
    },
    "review": {
      "patterns": ["*.review.md"],
      "required": ["Schema", "Id", "Title", "Artifact", "Plan", "Plan-Version", "Round", "Verdict"],
      "generators": ["review"],
      "enums": {
        "Status": ["active", "completed", "archived"],
        "Verdict": ["READY", "NEEDS_REVISION"]
      }
    },
    "implementation-report": {
      "patterns": ["*.implementation.md"],
      "required": ["Schema", "Id", "Title", "Artifact", "Plan", "Plan-Version", "Review", "Round", "Result"],
      "generators": ["implement"],
      "enums": {
        "Status": ["active", "completed", "blocked"],
        "Result": ["implemented", "partial", "blocked", "failed"]
      }
    },
    "audit-report": {
      "patterns": ["*.audit.md"],
      "required": ["Schema", "Id", "Title", "Artifact", "Implementation", "Round", "Verdict"],
      "generators": ["audit"],
      "enums": {
        "Status": ["active", "completed"],
        "Verdict": ["ready", "needs-fixes", "plan-fix", "re-plan"]
      }
    },
    "retro": {
      "patterns": ["*.retro.md"],
      "required": ["Schema", "Id", "Title", "Artifact"],
      "generators": ["retro"],
      "enums": {
        "Status": ["active", "completed", "archived"]
      }
    },
    "note": {
      "patterns": ["*.md"],
      "required": ["Schema", "Id", "Title", "Artifact"],
      "generators": ["manual", "migration"],
      "enums": {}
    }
  }
}
```

## Examples

### Implementation Report

```md
## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: 1-example-plan-implementation
- **Title**: Example Plan Implementation
- **Artifact**: implementation-report
- **Feature**: feat-2026-05-example
- **Plan**: plans/1-example-plan.plan.md
- **Plan-Version**: v1
- **Review**: reports/1-example-plan.review.md
- **Round**: I1
- **Result**: implemented
```

### Review

```md
## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: 1-example-plan-review
- **Title**: Example Plan Review
- **Artifact**: review
- **Feature**: feat-2026-05-example
- **Plan**: plans/1-example-plan.plan.md
- **Plan-Version**: v1
- **Round**: R1
- **Verdict**: READY
```

### Generic Data Note

```md
## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: task-2025-07-command-methodology-integration
- **Title**: Command Methodology Integration
- **Artifact**: note
```

## Migration

Metadata migration covers sync-eligible `.pythia/` data markdown: `.pythia/**/*.md` except `.pythia/README.md`, `.pythia/config/**`, `.pythia/runtime/**`, `.pythia/backups/**`, `AGENTS.md`, and `CLAUDE.md`. It converts old metadata carriers into this body metadata contract and removes legacy keys.

Legacy conversion inputs include `Plan-Id`, `Plan-Version`, review `Plan`, review `Plan Version`, review `Last Status`, review `Last Review Round`, implementation header `Plan:` / `Review:`, implementation compatibility `Result`, and feature/context identity frontmatter. Removed field names such as `Created`, `Updated`, `Subject`, and `Subject-Version` are not emitted by the current schema.
