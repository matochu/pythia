import { isPythiaSyncMarkdownRelPath } from '../refs.js';

export const DEFAULT_ARTIFACT_METADATA_MIGRATION_SCOPES = [
  {
    name: 'pythia-data-markdown',
    root: '.pythia',
    patterns: ['*.md'],
    dataOnly: true,
  },
];

export function matchesArtifactPattern(base, pattern) {
  if (pattern === 'feat-*.md') return base.startsWith('feat-') && base.endsWith('.md');
  if (pattern.startsWith('*.')) return base.endsWith(pattern.slice(1));
  return base === pattern;
}

export function artifactMetadataMigrationScopes(op = {}) {
  if (Array.isArray(op.scopes)) return op.scopes;
  return [
    {
      name: op.name ?? 'legacy-single-root',
      root: op.root ?? '.pythia/workflows',
      patterns: op.patterns ?? [],
      dataOnly: Boolean(op.dataOnly),
    },
  ];
}

export function defaultArtifactMetadataMigrationScopes() {
  return DEFAULT_ARTIFACT_METADATA_MIGRATION_SCOPES.map((scope) => ({
    ...scope,
    patterns: [...scope.patterns],
  }));
}

export function isArtifactMetadataScopeFile(rel, scope) {
  if (scope.dataOnly && !isPythiaSyncMarkdownRelPath(rel)) return false;
  const root = scope.root.replace(/\/+$/, '');
  if (rel !== root && !rel.startsWith(`${root}/`)) return false;
  const base = rel.split('/').pop() ?? rel;
  return scope.patterns.some((pattern) => matchesArtifactPattern(base, pattern));
}
