import { describe, it, expect } from 'vitest';
import { convertLegacyRelations } from '../metadata/migration.js';

describe('convertLegacyRelations', () => {
  it('is idempotent when no legacy relations exist', () => {
    const content = '# Doc\n\nJust prose.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(false);
    expect(result.content).toBe(content);
  });

  it('converts ## Sources section to ## Related with source label', () => {
    const content = '# Doc\n\n## Sources\n\n- [Karpathy](https://gist.github.com/karpathy)\n\n## Next\n\nContent.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('## Related');
    expect(result.content).toContain('[Karpathy](https://gist.github.com/karpathy#@source)');
    expect(result.content).not.toContain('## Sources');
  });

  it('converts ### Sources section', () => {
    const content = '# Doc\n\n### Sources\n\n- [Foo](foo.md)\n\n## Next\n\nContent.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Foo](foo.md#@source)');
  });

  it('converts ## Related Documentation section', () => {
    const content = '# Doc\n\n## Related Documentation\n\n- [Bar](bar.context.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Bar](bar.context.md#@related)');
    expect(result.content).not.toContain('## Related Documentation');
  });

  it('converts ### Related Documentation section', () => {
    const content = '# Doc\n\n### Related Documentation\n\n- [Baz](baz.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Baz](baz.md#@related)');
  });

  it('converts ## Related Contexts section', () => {
    const content = '# Doc\n\n## Related Contexts\n\n- [Ctx](ctx.context.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Ctx](ctx.context.md#@related)');
  });

  it('converts ## Related Documents section', () => {
    const content = '# Doc\n\n## Related Documents\n\n- [Doc](doc.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Doc](doc.md#@related)');
  });

  it('converts ## Related Pythia Skills section', () => {
    const content = '# Doc\n\n## Related Pythia Skills\n\n- [Plan](skills/plan/SKILL.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Plan](skills/plan/SKILL.md#@related)');
  });

  it('converts **Builds on** preamble to based-on', () => {
    const content = '# Doc\n\n**Builds on**: [Criteria](criteria.context.md)\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Criteria](criteria.context.md#@based-on)');
    expect(result.content).not.toContain('**Builds on**');
  });

  it('converts **Canonical Criteria** preamble to source', () => {
    const content = '# Doc\n\n**Canonical Criteria**: [SDD](sdd.ctx.md)\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[SDD](sdd.ctx.md#@source)');
  });

  it('converts **Pythia Mental Model** preamble to source', () => {
    const content = '# Doc\n\n**Pythia Mental Model**: [Model](model.md)\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Model](model.md#@source)');
  });

  it('converts **Sources** preamble to source', () => {
    const content = '# Doc\n\n**Sources**: [Src](src.md)\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Src](src.md#@source)');
  });

  it('converts **Related** preamble to related', () => {
    const content = '# Doc\n\n**Related**: [X](x.md)\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[X](x.md#@related)');
  });

  it('converts **Related Feature** preamble to #@related', () => {
    const content = '# Doc\n\n**Related Feature**: [Feat](feat.md)\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).not.toContain('**Related Feature**');
    expect(result.content).toContain('feat.md#@related');
  });

  it('removes builds_on metadata field and adds based-on item', () => {
    const content = '# Doc\n\n## Metadata\n\n- builds_on: [Base](base.md)\n- status: draft\n\nProse.\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Base](base.md#@based-on)');
    expect(result.content).not.toContain('builds_on:');
  });

  it('preserves description as — suffix', () => {
    const content = '# Doc\n\n## Sources\n\n- [Karpathy](https://gist.github.com/karpathy) — LLM overview\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('— LLM overview');
  });

  it('merges into existing ## Related section idempotently', () => {
    const content = '# Doc\n\n## Related\n\n- [Existing](existing.md#@related)\n\n## Sources\n\n- [New](new.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('[Existing](existing.md#@related)');
    expect(result.content).toContain('[New](new.md#@source)');
    // Only one ## Related section
    expect((result.content.match(/^## Related$/gm) ?? []).length).toBe(1);
  });

  it('does not touch ## Contexts section', () => {
    const content = '# Doc\n\n## Contexts\n\n- [Ctx](ctx.md)\n\n## Sources\n\n- [Src](src.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('## Contexts');
    expect(result.content).toContain('[Ctx](ctx.md)');
  });

  it('deduplicates by href — same href cited twice only appears once', () => {
    const content = '# Doc\n\n## Sources\n\n- [A](a.md)\n\n## Related Documentation\n\n- [A dup](a.md)\n';
    const result = convertLegacyRelations('x.md', content);
    expect(result.changed).toBe(true);
    const matches = result.content.match(/a\.md#@/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('is idempotent on second run', () => {
    const content = '# Doc\n\n## Sources\n\n- [Src](src.md)\n';
    const first = convertLegacyRelations('x.md', content);
    expect(first.changed).toBe(true);
    const second = convertLegacyRelations('x.md', first.content);
    expect(second.changed).toBe(false);
  });
});
