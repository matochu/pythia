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
      let i = 0;
      while (i < opLines.length) {
        const line = opLines[i];
        const idx = line.indexOf(':');
        if (idx === -1) { i++; continue; }
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trimStart();
        // Multi-line value: if key is 'content', collect remaining lines until empty line or end
        if (k === 'content') {
          const contentLines = [v];
          i++;
          while (i < opLines.length) {
            contentLines.push(opLines[i]);
            i++;
          }
          // Remove trailing empty lines
          while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '') {
            contentLines.pop();
          }
          // If content: had no inline value, drop the leading empty string
          if (contentLines.length > 0 && contentLines[0] === '') contentLines.shift();
          op[k] = contentLines.join('\n');
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
