# Cross-Document Link Rules

Single source of truth for how skills cite other `.pythia/**/*.md` documents.

## Inline links

Always prefer inline links in prose over dedicated relation sections:

- `[text](path)` — plain citation in prose
- `[text](path#@label)` — when the relation type matters for sync/backlinks

**When to use `#@label`**: only when the relation type adds information a reader or tool needs — not by default.

## Label vocabulary

From `.pythia/config/relation.md`:

| Label | Meaning |
| ----- | ------- |
| `source` | this document cites the target as primary evidence or input |
| `based-on` | this document extends or derives from the target |
| `related` | see-also; neither source nor derivation |

## Label decision tree

Ask three questions in order — stop at the first `yes`:

1. **Does this document use the target as evidence, data, or a primary input?**
   → `source`. Example: a plan citing a research context it was built from.

2. **Does this document extend, revise, or build on the target?**
   → `based-on`. Example: a replan that revises an earlier plan; an implementation report referencing the plan it executed.

3. **Is the link a useful cross-reference but neither of the above?**
   → `related`. Example: two sibling contexts covering different angles of the same feature.

4. **None of the above — the link is just in-prose navigation.**
   → Use plain `[text](path)` with no label.

**Examples:**

```markdown
<!-- plan built from research → source -->
This plan is based on findings in [API Rate Limiting Research](contexts/api-rate-limits.context.md#@source).

<!-- replan that revises an earlier plan → based-on -->
This revision extends [Plan v1](plans/1-feature.plan.md#@based-on) to address review findings.

<!-- context referenced for broader awareness → related -->
See also [Auth Architecture](contexts/auth-overview.context.md#@related) for system context.

<!-- plain in-prose link — no typed relation needed -->
The implementation follows [step 3](plans/1-feature.plan.md#step-3).
```

## Never create `## Related` as a default section

`## Related` is a **migration artifact** for documents that have no natural prose context for their links. Do not add it to new artifacts. Place links inline where they fit naturally.

## Trailing refs — machine-owned

`## References` and `## Used by` at the end of any `.pythia/**/*.md` file are **written exclusively by `inputs.js sync`**. Never hand-write or edit these sections. Manual entries create phantom records that `refs-owned.js` flags as errors.

## Feature backlink for scoped contexts

When a context file lands under `feat-XXX/contexts/`, add a `[title](contexts/filename#@related)` inline link in the **feature doc body** (under the nearest prose section or `## Contexts`) so `sync` can build the backlink. Do not rely on the context frontmatter alone.
