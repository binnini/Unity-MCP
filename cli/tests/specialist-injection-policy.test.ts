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

describe('specialist injection policy v2 docs', () => {
  it('documents canonical injection structure for grounded, guide-level, and deferred specialists', () => {
    const policy = readRepoFile('docs/specialists/specialist-injection-policy-v2.md');

    expectHeadingOrder(policy, [
      '## First-slice truthfulness baseline',
      '## Injection surfaces',
      '## Canonical layer order',
      '## Injection policy by specialist status',
      '## Selection gate before injection',
      '## Minimum truthful layer set',
      '## Persona gate',
      '## First-slice deny rules',
    ]);

    for (const phrase of [
      '**Animator** is the only grounded/runtime-backed specialist.',
      '**UI** and **Sound** are guide-level only.',
      '**Gameplay** is deferred despite prompt prior art.',
      '### Grounded specialist (`Animator`)',
      '### Guide-level specialist (`UI`, `Sound`)',
      '### Deferred specialist (`Gameplay`)',
      '1. **Guide prompt**',
      '2. **Output contract**',
      '3. **Persona prompt**',
    ]) {
      expect(policy).toContain(phrase);
    }

    expect(policy).toContain('smallest truthful specialist surface');
  });

  it('keeps deny rules aligned with first-slice truthfulness boundaries', () => {
    const policy = readRepoFile('docs/specialists/specialist-injection-policy-v2.md');

    for (const phrase of [
      'treating UI or Sound as runtime-backed',
      'treating Gameplay as grounded',
      'persona-only injection without an accepted guide layer',
      'bus/scheduler/mailbox/lifecycle semantics',
      'public CLI specialist management commands',
    ]) {
      expect(policy).toContain(phrase);
    }
  });

  it('is linked from the v2 docs index and prompt architecture', () => {
    const readme = readRepoFile('docs/specialists/README.md');
    const promptArchitecture = readRepoFile('docs/specialists/prompt-architecture-v2.md');

    expect(readme).toContain('[`specialist-injection-policy-v2.md`](specialist-injection-policy-v2.md)');
    expect(promptArchitecture).toContain('specialist-injection-policy-v2.md');
  });
});
