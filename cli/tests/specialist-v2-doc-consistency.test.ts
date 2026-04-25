import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

type RuntimeStatus = 'grounded' | 'guide-level' | 'deferred';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');
}

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readRepoFile(relativePath)) as T;
}

function getSection(content: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`${escapedHeading}[\\s\\S]*?(?=\\n## |\\n### |$)`));
  expect(match, `Missing section: ${heading}`).not.toBeNull();
  return match![0];
}

function getSpecialistSection(content: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`### ${escapedName}[\\s\\S]*?(?=\\n### |\\n## |$)`));
  expect(match, `Missing specialist section: ${name}`).not.toBeNull();
  return match![0];
}

function parseSelectionGuideStatuses(content: string): Record<string, RuntimeStatus> {
  const rows = [...content.matchAll(/\|\s*(Animator|UI|Sound|Gameplay)\s*\|\s*(grounded|guide-level|deferred)\s*\|/g)];
  return Object.fromEntries(rows.map(match => [match[1].toLowerCase(), match[2] as RuntimeStatus]));
}

describe('specialist v2 cross-doc consistency', () => {
  it('keeps the first-wave registry aligned with prompt-pack runtime statuses', () => {
    const registry = loadJson<{
      version: number;
      specialists: Array<{ specialistId: string; promptPack: string; runtimeStatus: RuntimeStatus }>;
    }>('cli/examples/specialists/v2/first-wave-prompt-registry.v2.json');

    expect(registry.version).toBe(2);

    for (const entry of registry.specialists) {
      const pack = loadJson<{ specialistId: string; runtimeStatus: RuntimeStatus }>(entry.promptPack);
      expect(pack.specialistId).toBe(entry.specialistId);
      expect(pack.runtimeStatus).toBe(entry.runtimeStatus);
    }
  });

  it('keeps selection guide, first-wave catalog, and first-wave prompts aligned with registry truthfulness statuses', () => {
    const registry = loadJson<{
      specialists: Array<{ specialistId: string; runtimeStatus: RuntimeStatus }>;
    }>('cli/examples/specialists/v2/first-wave-prompt-registry.v2.json');
    const registryStatuses = Object.fromEntries(
      registry.specialists.map(entry => [entry.specialistId, entry.runtimeStatus])
    ) as Record<string, RuntimeStatus>;

    const selectionGuide = readRepoFile('docs/specialists/specialist-selection-guide-v2.md');
    expect(parseSelectionGuideStatuses(selectionGuide)).toEqual(registryStatuses);

    const catalog = readRepoFile('docs/specialists/first-wave-catalog-v2.md');
    expect(getSpecialistSection(catalog, 'Animator')).toContain('- Status: grounded');
    expect(getSpecialistSection(catalog, 'UI')).toContain('- Status: guide-level only');
    expect(getSpecialistSection(catalog, 'Sound')).toContain('- Status: guide-level only');
    expect(getSpecialistSection(catalog, 'Gameplay')).toContain('- Status: deferred despite prompt prior art');

    const promptRollout = readRepoFile('docs/specialists/first-wave-prompts-v2.md');
    expect(getSpecialistSection(promptRollout, 'Animator')).toContain('- Runtime status: grounded');
    expect(getSpecialistSection(promptRollout, 'UI')).toContain('- Runtime status: guide-level');
    expect(getSpecialistSection(promptRollout, 'Sound')).toContain('- Runtime status: guide-level');
    expect(getSpecialistSection(promptRollout, 'Gameplay')).toContain('- Runtime status: deferred');
  });

  it('keeps new v2 policy baselines aligned with the same registry truthfulness model', () => {
    const injectionPolicy = readRepoFile('docs/specialists/specialist-injection-policy-v2.md');
    const mcpRules = readRepoFile('docs/specialists/mcp-usage-guide-execution-rules-v2.md');
    const promotionCriteria = readRepoFile('docs/specialists/promotion-criteria-v2.md');

    const injectionBaseline = getSection(injectionPolicy, '## First-slice truthfulness baseline');
    expect(injectionBaseline).toContain('**Animator** is the only grounded/runtime-backed specialist.');
    expect(injectionBaseline).toContain('**UI** and **Sound** are guide-level only.');
    expect(injectionBaseline).toContain('**Gameplay** is deferred despite prompt prior art.');

    const mcpBaseline = getSection(mcpRules, '## First-slice truthfulness baseline');
    expect(mcpBaseline).toContain('**Animator** is the only grounded/runtime-backed specialist.');
    expect(mcpBaseline).toContain('**UI** and **Sound** may guide MCP usage');
    expect(mcpBaseline).toContain('**Gameplay** is deferred and may only appear through handoff/defer wording.');

    const promotionBaseline = getSection(promotionCriteria, '## Current baseline');
    expect(promotionBaseline).toContain('**Animator**: grounded');
    expect(promotionBaseline).toContain('**UI**: guide-level only');
    expect(promotionBaseline).toContain('**Sound**: guide-level only');
    expect(promotionBaseline).toContain('**Gameplay**: deferred despite prompt prior art');

    expect(getSection(injectionPolicy, '## First-slice deny rules')).toContain('treating UI or Sound as runtime-backed');
    expect(getSection(mcpRules, '## Deny rules')).toContain('claiming Gameplay MCP runtime backing');
    expect(getSection(promotionCriteria, '## Deny rules')).toContain('using prompt packs alone as promotion evidence');
  });
});
