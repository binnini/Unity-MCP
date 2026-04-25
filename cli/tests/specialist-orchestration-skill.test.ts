import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  SPECIALIST_ORCHESTRATION_ARTIFACT_RELATIVE_PATH,
  SPECIALIST_ORCHESTRATION_OWNERSHIP_MARKER,
  materializeSpecialistOrchestrationSkill,
  renderSpecialistOrchestrationSkill,
  shouldGenerateSpecialistOrchestrationSkill,
} from '../src/utils/specialist-orchestration-skill.js';

describe('specialist orchestration skill renderer', () => {
  it('renders first-wave truthfulness boundaries and guide-first prompt ordering', () => {
    const rendered = renderSpecialistOrchestrationSkill();

    expect(rendered).toContain(SPECIALIST_ORCHESTRATION_OWNERSHIP_MARKER);
    expect(rendered).toContain('Supported agents in this slice: claude-code, cursor, codex.');
    expect(rendered).toContain('Animator is the only runtime-backed specialist in the first wave.');
    expect(rendered).toContain('UI and Sound remain guide-level only.');
    expect(rendered).toContain('Gameplay remains deferred.');
    expect(rendered).toContain('`review://animation/session/{sessionId}` remains a read-only projection only.');
    expect(rendered).toContain('## animator');
    expect(rendered).toContain('## ui');
    expect(rendered).toContain('## sound');
    expect(rendered).toContain('## gameplay');
    expect(rendered.indexOf('Selection Guide (animator, grounded):')).toBeLessThan(
      rendered.indexOf('Output Contract (animator):'),
    );
    expect(rendered.indexOf('Output Contract (animator):')).toBeLessThan(
      rendered.indexOf('Persona (animator):'),
    );
    expect(rendered).toContain(
      '`review://animation/session/{sessionId}` (runtime-backed-resource; read-only projection over `.omx/state/specialists/review-sessions/animator/{sessionId}.json`)',
    );
    expect(rendered).not.toMatch(/\bbus\b/i);
    expect(rendered).not.toMatch(/\bscheduler\b/i);
    expect(rendered).not.toMatch(/\bmailbox\b/i);
    expect(rendered).not.toMatch(/\blifecycle owner\b/i);
    expect(rendered).not.toMatch(/\bpublic CLI command\b/i);
  });

  it('writes a deterministic CLI-owned artifact and leaves neighboring files untouched', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specialist-orchestration-skill-'));

    try {
      const pluginOwnedPath = path.join(tmpDir, 'unity-generator-owned', 'SKILL.md');
      fs.mkdirSync(path.dirname(pluginOwnedPath), { recursive: true });
      fs.writeFileSync(pluginOwnedPath, 'plugin generated skill\n', 'utf-8');

      const artifactPath = materializeSpecialistOrchestrationSkill({ skillsPath: tmpDir });
      const first = fs.readFileSync(artifactPath, 'utf-8');

      expect(path.relative(tmpDir, artifactPath)).toBe(SPECIALIST_ORCHESTRATION_ARTIFACT_RELATIVE_PATH);
      expect(first).toContain(SPECIALIST_ORCHESTRATION_OWNERSHIP_MARKER);
      expect(fs.readFileSync(pluginOwnedPath, 'utf-8')).toBe('plugin generated skill\n');

      fs.writeFileSync(artifactPath, 'mutated by test\n', 'utf-8');
      materializeSpecialistOrchestrationSkill({ skillsPath: tmpDir });
      const second = fs.readFileSync(artifactPath, 'utf-8');

      expect(second).toBe(first);
      expect(fs.readFileSync(pluginOwnedPath, 'utf-8')).toBe('plugin generated skill\n');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('fails closed without leaving a partial artifact when registry loading fails', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specialist-orchestration-skill-fail-'));
    const missingRegistry = path.join(tmpDir, 'missing-registry.json');
    const artifactPath = path.join(tmpDir, SPECIALIST_ORCHESTRATION_ARTIFACT_RELATIVE_PATH);

    try {
      expect(() =>
        materializeSpecialistOrchestrationSkill({
          skillsPath: tmpDir,
          registryPath: missingRegistry,
        }),
      ).toThrowError();

      expect(fs.existsSync(artifactPath)).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('only supports the verified path-parity agent allowlist in Slice A', () => {
    expect(shouldGenerateSpecialistOrchestrationSkill('claude-code')).toBe(true);
    expect(shouldGenerateSpecialistOrchestrationSkill('cursor')).toBe(true);
    expect(shouldGenerateSpecialistOrchestrationSkill('codex')).toBe(true);
    expect(shouldGenerateSpecialistOrchestrationSkill('vscode-copilot')).toBe(false);
    expect(shouldGenerateSpecialistOrchestrationSkill('github-copilot-cli')).toBe(false);
  });
});
