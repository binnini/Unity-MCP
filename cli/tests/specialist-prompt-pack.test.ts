import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { validateSpecialistPromptPack } from '../src/utils/specialist-prompt-pack.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const fixturesDir = path.join(repoRoot, 'cli/examples/specialists/v2');

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
