import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { validateSpecialistPromptPack } from '../src/utils/specialist-prompt-pack.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const fixturesDir = path.join(repoRoot, 'cli/examples/specialists/v2');
const registryPath = path.join(fixturesDir, 'first-wave-prompt-registry.v2.json');

function loadFixture(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8')) as Record<string, any>;
}

describe('specialist prompt pack validator', () => {
  it.each([
    'animator.prompt-pack.v2.json',
    'ui.prompt-pack.v2.json',
    'sound.prompt-pack.v2.json',
    'gameplay.prompt-pack.v2.json',
  ])('accepts %s', filename => {
    expect(validateSpecialistPromptPack(loadFixture(filename))).toEqual({ valid: true, errors: [] });
  });

  it('requires guide-first selection arrays and shared output sections', () => {
    const fixture = loadFixture('ui.prompt-pack.v2.json');
    fixture.selectionGuide.selectWhen = [];
    fixture.outputContract.sections = ['Intent', 'Summary'];

    const result = validateSpecialistPromptPack(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_ARRAY', path: 'selectionGuide.selectWhen' })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_OUTPUT_SECTION', path: 'outputContract.sections' })
    );
  });

  it('requires prompt packs to reference the shared contract and specialist docs', () => {
    const fixture = loadFixture('animator.prompt-pack.v2.json');
    delete fixture.references.specialistDoc;

    const result = validateSpecialistPromptPack(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_REFERENCE_FIELD', path: 'references.specialistDoc' })
    );
  });

  it('rejects ungrounded runtime claims for guide-level and deferred packs', () => {
    const uiFixture = loadFixture('ui.prompt-pack.v2.json');
    uiFixture.runtimeBackedResources = ['review://animation/pending'];

    const gameplayFixture = loadFixture('gameplay.prompt-pack.v2.json');
    gameplayFixture.runtimeBackedTools = ['gameplay-preview-report'];

    expect(validateSpecialistPromptPack(uiFixture).errors).toContainEqual(
      expect.objectContaining({ code: 'UNGROUNDED_RUNTIME_CLAIM', path: 'runtimeBackedResources' })
    );
    expect(validateSpecialistPromptPack(gameplayFixture).errors).toContainEqual(
      expect.objectContaining({ code: 'UNGROUNDED_RUNTIME_CLAIM', path: 'runtimeBackedResources' })
    );
  });

  it('requires grounded packs to declare runtime-backed surfaces', () => {
    const fixture = loadFixture('animator.prompt-pack.v2.json');
    fixture.runtimeBackedResources = [];
    fixture.runtimeBackedTools = [];

    const result = validateSpecialistPromptPack(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_RUNTIME_SURFACE', path: 'runtimeBackedResources' })
    );
  });

  it('validates persona prompt shape when present', () => {
    const fixture = loadFixture('sound.prompt-pack.v2.json');
    fixture.personaPrompt.voice = '';
    fixture.personaPrompt.mustNot = [{}];

    const result = validateSpecialistPromptPack(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_PERSONA_PROMPT', path: 'personaPrompt.voice' })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_ARRAY_ITEM', path: 'personaPrompt.mustNot[0]' })
    );
  });
});

describe('first-wave prompt registry', () => {
  it('keeps the registry aligned with prompt-pack fixtures and docs', () => {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as {
      version: number;
      specialists: Array<Record<string, string>>;
    };

    expect(registry.version).toBe(2);
    expect(registry.specialists).toHaveLength(4);

    for (const entry of registry.specialists) {
      const packPath = path.join(repoRoot, entry.promptPack);
      const docPath = path.join(repoRoot, entry.specialistDoc);
      expect(fs.existsSync(packPath)).toBe(true);
      expect(fs.existsSync(docPath)).toBe(true);

      const pack = JSON.parse(fs.readFileSync(packPath, 'utf-8')) as Record<string, any>;
      expect(pack.specialistId).toBe(entry.specialistId);
      expect(pack.runtimeStatus).toBe(entry.runtimeStatus);
      expect(pack.references.specialistDoc).toBe(entry.specialistDoc);
      expect(fs.existsSync(path.join(repoRoot, pack.references.contractDoc))).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, pack.references.architectureDoc))).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, pack.references.selectionGuideDoc))).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, pack.references.promptArchitectureDoc))).toBe(true);
    }
  });
});
