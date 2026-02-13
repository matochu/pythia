# Implementation Report Format Specification

**File**: `reports/{plan-slug}.implementation.md`

## Required Structure

```markdown
# Implementation Report: {plan-slug}

## Executed Plan Steps
1. Step 1: [Status: done/partial/skipped]
   - Files changed: [list]
   - Commands executed: [list]
   - Results: [outcome]

2. Step 2: [Same structure]

## Files Changed
- `path/to/file1.ts` — [what changed]
- `path/to/file2.ts` — [what changed]

## Commands Executed
- `npm test` — [result]
- `npm run build` — [result]

## Deviations
[If deviated from plan — why]

## Open Issues
[Any remaining issues]
```

## Key Sections

- **Executed Plan Steps**: Status per step from plan
- **Files Changed**: List of modified files with descriptions
- **Commands Executed**: Validation commands and results
- **Deviations**: Any deviations from plan with explanations
- **Open Issues**: Remaining issues or blockers
