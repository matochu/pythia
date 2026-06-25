/**
 * Parse the fragment portion of a markdown link href to extract anchor and relation type.
 *
 * Fragment syntax: `#anchor@label` | `#@label` | `#anchor` | `#fragment`
 *
 * - `foo.md#sec@based-on`  → { anchor: 'sec', relType: 'based-on' }
 * - `foo.md#@source`       → { anchor: '', relType: 'source' }
 * - `foo.md#sec`           → { anchor: 'sec', relType: '' }
 * - `foo.md`               → { anchor: '', relType: '' }
 *
 * The `@` in URL authority (e.g. `user@host`) is never parsed — only the `#fragment` portion
 * is processed here. The caller is responsible for passing only the fragment (after `#`).
 *
 * @param {string} fragment — the raw fragment string after `#` (may be empty or undefined)
 * @returns {{ anchor: string; relType: string }}
 */
export function parseLinkFragment(fragment) {
  const raw = (fragment ?? '').trim();
  if (!raw) return { anchor: '', relType: '' };

  const atIdx = raw.indexOf('@');
  if (atIdx === -1) return { anchor: raw, relType: '' };

  const anchor = raw.slice(0, atIdx).trim();
  const relType = raw.slice(atIdx + 1).trim();
  return { anchor, relType };
}
