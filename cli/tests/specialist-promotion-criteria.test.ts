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

describe('specialist promotion criteria v2 docs', () => {
  it('documents structured promotion gates for UI, Sound, and Gameplay without collapsing truthfulness levels', () => {
    const doc = readRepoFile('docs/specialists/promotion-criteria-v2.md');

    expectHeadingOrder(doc, [
      '## Current baseline',
      '## General promotion rule',
      '## Promotion tiers',
      '## UI promotion criteria',
      '## Sound promotion criteria',
      '## Gameplay promotion criteria',
      '## Review-session promotion rule',
      '## Deny rules',
    ]);

    for (const phrase of [
      '### Guide-level -> grounded',
      '### Deferred -> guide-level',
      '### Deferred -> grounded',
      '## UI promotion criteria',
      '## Sound promotion criteria',
      '## Gameplay promotion criteria',
      'Prompt prior art alone is never enough for promotion.',
    ]) {
      expect(doc).toContain(phrase);
    }
  });

  it('keeps promotion deny rules aligned with first-slice non-goals', () => {
    const doc = readRepoFile('docs/specialists/promotion-criteria-v2.md');

    for (const phrase of [
      'using prompt packs alone as promotion evidence',
      'docs-only naming as runtime proof',
      'guide-level evidence recommendations as grounded MCP support',
      'deferred handoff language as proof of active specialist ownership',
      'public CLI specialist lifecycle commands as a shortcut to grounding',
    ]) {
      expect(doc).toContain(phrase);
    }
  });

  it('is linked from the v2 docs index', () => {
    const readme = readRepoFile('docs/specialists/README.md');
    expect(readme).toContain('[`promotion-criteria-v2.md`](promotion-criteria-v2.md)');
  });
});
