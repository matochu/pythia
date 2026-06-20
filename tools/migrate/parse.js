// Parse a migration .md file into structured steps.
// Format:
//   ## Step N
//   **Target**: <relpath>
//   **Kind**: auto|llm
//   **Check**: <idempotent check description>
//   **Op:** (for auto) or **Apply:** (for llm) ...
//   ```
//   op: <name>
//   key: value
//   ```

export function parseMigration(content) {
  const stepBlocks = content.split(/\n(?=## Step \d)/);
  const steps = [];

  for (const block of stepBlocks) {
    if (!/^## Step \d/.test(block)) continue;

    const stepNum = parseInt(block.match(/^## Step (\d+)/)?.[1] ?? '0', 10);

    const target = block.match(/\*\*Target\*\*:\s*`?([^\n`]+)`?/)?.[1]?.trim();
    const kind = block.match(/\*\*Kind\*\*:\s*(auto|llm)/i)?.[1]?.toLowerCase();
    const check = block.match(/\*\*Check\*\*:\s*([^\n]+)/)?.[1]?.trim();

    if (!kind) continue;

    if (kind === 'auto') {
      // Extract the fenced code block after **Op:**
      const opMatch = block.match(/\*\*Op:\*\*[\s\S]*?```[^\n]*\n([\s\S]*?)```/);
      if (!opMatch) continue;
      const opLines = opMatch[1].split('\n');
      const op = {};
      const MULTILINE_KEYS = new Set(['content', 'find', 'replace']);
      const OP_FIELD_KEYS = new Set([
        'op', 'path', 'find', 'replace', 'from', 'to', 'key', 'value', 'section', 'content', 'after_section', 'skip_if', 'glob',
      ]);
      let i = 0;
      while (i < opLines.length) {
        const line = opLines[i];
        const idx = line.indexOf(':');
        if (idx === -1) { i++; continue; }
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trimStart();
        if (MULTILINE_KEYS.has(k)) {
          const valueLines = v && v !== '|' ? [v] : [];
          i++;
          while (i < opLines.length) {
            const next = opLines[i];
            const nextColon = next.indexOf(':');
            if (nextColon > 0) {
              const nextKey = next.slice(0, nextColon).trim();
              if (OP_FIELD_KEYS.has(nextKey)) break;
            }
            valueLines.push(next);
            i++;
          }
          while (valueLines.length > 0 && valueLines[valueLines.length - 1].trim() === '') {
            valueLines.pop();
          }
          if (valueLines.length > 0 && valueLines[0] === '') valueLines.shift();
          op[k] = valueLines.join('\n');
        } else {
          op[k] = v.trim();
          i++;
        }
      }
      steps.push({ stepNum, target, kind: 'auto', check, op });
    } else {
      const applyMatch = block.match(/\*\*Apply\*\*:\s*([\s\S]*?)(?=\*\*Success condition\*\*|\*\*Failure condition\*\*|$)/);
      const apply = applyMatch?.[1]?.trim() ?? '';
      const successMatch = block.match(/\*\*Success condition\*\*:\s*([^\n]+)/);
      const success = successMatch?.[1]?.trim() ?? '';
      steps.push({ stepNum, target, kind: 'llm', check, apply, success });
    }
  }

  return steps;
}

export function migrationHasLlm(steps) {
  return steps.some((s) => s.kind === 'llm');
}
