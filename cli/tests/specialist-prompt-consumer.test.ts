import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  consumeSpecialistPromptPack,
  InvalidSpecialistPromptPackError,
} from '../src/utils/specialist-prompt-consumer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const fixturesDir = path.join(repoRoot, 'cli/examples/specialists/v2');

function loadFixture(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8')) as Record<string, any>;
}

describe('specialist prompt-pack consumer', () => {
  it('applies guide, output contract, then persona in chat sessions', () => {
    const result = consumeSpecialistPromptPack(loadFixture('animator.prompt-pack.v2.json'), 'chat-session');

    expect(result.surface).toBe('chat-session');
    expect(result.appliedLayers.map(layer => layer.id)).toEqual([
      'selection-guide',
      'output-contract',
      'persona-prompt',
    ]);
    expect(result.prompt.indexOf('Selection Guide (animator, grounded):')).toBeLessThan(
      result.prompt.indexOf('Output Contract (animator):')
    );
    expect(result.prompt.indexOf('Output Contract (animator):')).toBeLessThan(
      result.prompt.indexOf('Persona (animator):')
    );
    expect(result.outputSections).toEqual([
      'Intent',
      'Summary',
      'Evidence',
      'Focused Question',
      'Revision Tasks',
      'Risk',
    ]);
  });

  it('classifies preferred evidence for MCP consumption and keeps grounded runtime-backed entries first', () => {
    const result = consumeSpecialistPromptPack(loadFixture('animator.prompt-pack.v2.json'), 'mcp');

    expect(result.resourceToolUsage.usePreferredEvidenceBeforeFreestyle).toBe(true);
    expect(result.resourceToolUsage.runtimeBackedFirst).toEqual([
      'animation://controller/{path}',
      'animation://clip/{path}',
      'review://animation/pending',
      'review://animation/session/{sessionId}',
    ]);
    expect(result.resourceToolUsage.externalFallback).toEqual(['screenshot-game-view', 'tests-run']);
    expect(result.preferredEvidence).toContainEqual(
      expect.objectContaining({
        value: 'review://animation/session/{sessionId}',
        kind: 'runtime-backed-resource',
        runtimeBacked: true,
        consumeVia: 'resource',
      })
    );
    expect(result.handoffPlan.handoffTo).toEqual(['ui', 'sound', 'gameplay']);
    expect(result.handoffPlan.routes).toEqual([
      { specialistId: 'ui', trigger: 'adjacent-owner' },
      { specialistId: 'sound', trigger: 'adjacent-owner' },
      { specialistId: 'gameplay', trigger: 'adjacent-owner' },
    ]);
  });

  it('keeps guide-level prompt packs truthful by treating preferred evidence as fallback guidance only', () => {
    const result = consumeSpecialistPromptPack(loadFixture('ui.prompt-pack.v2.json'), 'mcp');

    expect(result.runtimeStatus).toBe('guide-level');
    expect(result.resourceToolUsage.runtimeBackedFirst).toEqual([]);
    expect(result.resourceToolUsage.externalFallback).toEqual([
      'ui screenshots',
      'layout hierarchy snapshots',
      'interaction notes',
    ]);
    expect(result.preferredEvidence.every(entry => entry.kind === 'external-evidence')).toBe(true);
  });

  it('rejects invalid prompt packs before consumption', () => {
    const invalid = loadFixture('sound.prompt-pack.v2.json');
    invalid.outputContract.sections = ['Intent'];

    expect(() => consumeSpecialistPromptPack(invalid, 'chat-session')).toThrowError(
      InvalidSpecialistPromptPackError
    );
  });
});
