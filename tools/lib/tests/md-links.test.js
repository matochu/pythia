import { describe, it, expect } from 'vitest';
import { extractBacktickPaths } from '../md.js';

describe('extractBacktickPaths', () => {
  it('returns empty array for content with no backtick paths', () => {
    expect(extractBacktickPaths('# Doc\n\nJust prose.\n')).toEqual([]);
  });

  it('extracts a single .md path', () => {
    expect(extractBacktickPaths('See `tools/lib/md.js` and `docs/foo.md`.')).toContain('docs/foo.md');
  });

  it('extracts multiple .md paths', () => {
    const result = extractBacktickPaths('See `a/b.md` and `c/d.md`.');
    expect(result).toContain('a/b.md');
    expect(result).toContain('c/d.md');
  });

  it('deduplicates the same path cited twice', () => {
    const result = extractBacktickPaths('`foo.md` and again `foo.md`.');
    expect(result.filter((p) => p === 'foo.md')).toHaveLength(1);
  });

  it('skips paths inside fenced code blocks', () => {
    const content = '```\n`skip.md`\n```\n\nOutside `keep.md`.\n';
    const result = extractBacktickPaths(content);
    expect(result).not.toContain('skip.md');
    expect(result).toContain('keep.md');
  });

  it('skips backtick strings that look like URLs', () => {
    const result = extractBacktickPaths('See `https://example.com/foo.md`.');
    expect(result).toHaveLength(0);
  });

  it('skips non-.md backtick strings', () => {
    const result = extractBacktickPaths('Use `node` and `file.js` not `.md`.');
    expect(result).toHaveLength(0);
  });

  it('handles paths with directories and hyphens', () => {
    const result = extractBacktickPaths('See `.claude/skills/workflow/references/automation-workflow.md`.');
    expect(result).toContain('.claude/skills/workflow/references/automation-workflow.md');
  });
});
