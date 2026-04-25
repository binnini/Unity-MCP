import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');
}

function expectHeadingOrder(content: string, headings: string[]): void {
  const positions = headings.map(heading => content.indexOf(heading));
  positions.forEach(position => expect(position).toBeGreaterThanOrEqual(0));
  for (let index = 1; index < positions.length; index += 1) {
    expect(positions[index]).toBeGreaterThan(positions[index - 1]);
  }
}

describe('specialist MCP usage guide execution rules v2 docs', () => {
  it('documents structured grounded, guide-level, and deferred MCP execution boundaries', () => {
    const doc = readRepoFile('docs/specialists/mcp-usage-guide-execution-rules-v2.md');

    expectHeadingOrder(doc, [
      '## First-slice truthfulness baseline',
      '## Core execution rule',
      '## Surface classes',
      '## Execution rules by specialist status',
      '## preferredEvidence execution rules',
      '## Generic MCP evidence allowed across lanes',
      '## Reporting rule',
      '## Hard stop / handoff conditions',
      '## Deny rules',
    ]);

    for (const phrase of [
      '### Animator (grounded)',
      '### UI and Sound (guide-level)',
      '### Gameplay (deferred)',
      '1. select the specialist through the guide prompt,',
      '2. consume `preferredEvidence` before freestyle exploration,',
      'grounded runtime-backed entries',
      'guide-only evidence',
      'handoffTo',
    ]) {
      expect(doc).toContain(phrase);
    }
  });

  it('keeps deny rules aligned with first-slice truthfulness limits', () => {
    const doc = readRepoFile('docs/specialists/mcp-usage-guide-execution-rules-v2.md');

    for (const phrase of [
      'claiming UI/Sound runtime-backed specialist MCP surfaces',
      'claiming Gameplay MCP runtime backing',
      'inventing public CLI commands for specialist MCP management',
      'guide-level evidence hints as proof of grounded runtime status',
      'using prompt persona to overrule evidence boundaries',
    ]) {
      expect(doc).toContain(phrase);
    }
  });

  it('is linked from the v2 docs index and prompt architecture guidance', () => {
    const readme = readRepoFile('docs/specialists/README.md');
    const promptArchitecture = readRepoFile('docs/specialists/prompt-architecture-v2.md');

    expect(readme).toContain('[`mcp-usage-guide-execution-rules-v2.md`](mcp-usage-guide-execution-rules-v2.md)');
    expect(promptArchitecture).toContain('mcp-usage-guide-execution-rules-v2.md');
  });
});
