import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  CANONICAL_SPECIALIST_CONFIRMATION_TOKENS,
  validateSpecialistContract,
} from '../src/utils/specialist-contract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const fixturePath = path.join(repoRoot, 'cli/examples/specialists/animator.contract.v1.json');

const requiredFields = [
  'id',
  'version',
  'displayName',
  'discipline',
  'mission',
  'rolePrompts',
  'allowedScope',
  'forbiddenScope',
  'confirmationRequiredScope',
  'resources',
  'tools',
  'profile',
  'feedbackProtocol',
  'evidenceRequirements',
  'autonomyRiskPolicy',
  'handoffHooks',
  'acceptanceScenarios',
] as const;

type Fixture = Record<string, any>;

function loadFixture(): Fixture {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf-8')) as Fixture;
}

function withoutField(field: string): Fixture {
  const fixture = loadFixture();
  delete fixture[field];
  return fixture;
}

function expectErrorCode(fixture: Fixture, code: string): void {
  const result = validateSpecialistContract(fixture);
  expect(result.valid).toBe(false);
  expect(result.errors.map(error => error.code)).toContain(code);
}

describe('specialist contract validator', () => {
  it('accepts the Animator reference fixture', () => {
    const fixture = loadFixture();
    const result = validateSpecialistContract(fixture);

    expect(result).toEqual({ valid: true, errors: [] });
    expect(fixture.version).toBe(1);
    expect(fixture.schemaVersion).toBeUndefined();
    expect(fixture.kind).toBeUndefined();
    for (const field of requiredFields) {
      expect(fixture[field]).toBeDefined();
    }
    expect(fixture.confirmationRequiredScope).toEqual([...CANONICAL_SPECIALIST_CONFIRMATION_TOKENS]);
    expect(fixture.handoffHooks.conceptualOnly).toBe(true);
    expect(fixture.bus).toBeUndefined();
    expect(fixture.profile.mapsTo).toBeUndefined();
  });

  it('returns stable structured errors', () => {
    const result = validateSpecialistContract({});

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    for (const error of result.errors) {
      expect(error.code).toEqual(expect.any(String));
      expect(error.path).toEqual(expect.any(String));
      expect(error.message).toEqual(expect.any(String));
    }
  });

  it.each(requiredFields)('requires %s', field => {
    const result = validateSpecialistContract(withoutField(field));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_FIELD', path: field })
    );
  });

  it('rejects malformed nested contract shapes', () => {
    const badAllowedScope = loadFixture();
    badAllowedScope.allowedScope = [{ oops: true }];
    expectErrorCode(badAllowedScope, 'INVALID_ARRAY_ITEM');

    const badResource = loadFixture();
    badResource.resources = [{}];
    expectErrorCode(badResource, 'INVALID_ARRAY_ITEM');

    const badProfileId = loadFixture();
    badProfileId.profile.id = 123;
    expectErrorCode(badProfileId, 'INVALID_PROFILE_FIELD');

    const badDestructiveTool = loadFixture();
    badDestructiveTool.tools.destructiveOrIrreversible = ['*'];
    expectErrorCode(badDestructiveTool, 'UNBOUNDED_TOOL_GRANT');
  });

  it('rejects missing feedback protocol', () => {
    expectErrorCode(withoutField('feedbackProtocol'), 'MISSING_FIELD');
  });

  it('rejects false feedback protocol flags', () => {
    const fixture = loadFixture();
    fixture.feedbackProtocol.evidenceRequired = false;

    expectErrorCode(fixture, 'INVALID_FEEDBACK_PROTOCOL');
  });

  it('rejects missing evidence requirements and missing evidence categories', () => {
    expectErrorCode(withoutField('evidenceRequirements'), 'MISSING_FIELD');

    const fixture = loadFixture();
    delete fixture.evidenceRequirements.visual;
    expectErrorCode(fixture, 'MISSING_EVIDENCE_CATEGORY');
  });

  it('rejects evidence categories without accepted sources', () => {
    const fixture = loadFixture();
    fixture.evidenceRequirements.debug.acceptedSources = [];

    expectErrorCode(fixture, 'MISSING_EVIDENCE_SOURCE');
  });

  it('rejects unbounded all-tools profile grants', () => {
    const profileStar = loadFixture();
    profileStar.profile.tools = ['*'];
    expectErrorCode(profileStar, 'UNBOUNDED_TOOL_GRANT');

    const exactAllTools = loadFixture();
    exactAllTools.tools.exact = ['all-tools'];
    expectErrorCode(exactAllTools, 'UNBOUNDED_TOOL_GRANT');
  });

  it('requires wildcard semantics for wildcard grants', () => {
    const fixture = loadFixture();
    delete fixture.profile.wildcardSemantics;

    expectErrorCode(fixture, 'MISSING_WILDCARD_SEMANTICS');
  });

  it('keeps setupHints opaque', () => {
    const shapes: unknown[] = [
      'freeform setup note',
      { arbitrary: { nested: ['values'] } },
      { queue: 'ignored because setupHints is opaque', lifecycleOwner: 'also ignored' },
      ['array', { of: 'objects' }, { scheduler: 'ignored' }],
      42,
      null,
    ];

    for (const setupHints of shapes) {
      const fixture = loadFixture();
      fixture.profile.setupHints = setupHints;
      expect(validateSpecialistContract(fixture)).toEqual({ valid: true, errors: [] });
    }
  });

  it('rejects empty confirmation metadata and destructive capabilities without canonical confirmation scope', () => {
    const emptyConfirmation = loadFixture();
    emptyConfirmation.confirmationRequiredScope = [];
    expectErrorCode(emptyConfirmation, 'EMPTY_ARRAY');

    const destructiveWithoutMetadata = loadFixture();
    destructiveWithoutMetadata.tools.destructiveOrIrreversible = ['delete-approved-controller'];
    destructiveWithoutMetadata.confirmationRequiredScope = [
      'delete-approved-or-canonical-asset',
    ];
    expectErrorCode(destructiveWithoutMetadata, 'MISSING_CONFIRMATION_METADATA');
  });

  it('rejects malformed profile prompt and resource entries', () => {
    const badPrompt = loadFixture();
    badPrompt.profile.prompts = [{}];
    expectErrorCode(badPrompt, 'INVALID_PROFILE_FIELD');

    const badResource = loadFixture();
    badResource.profile.resources = [{}];
    expectErrorCode(badResource, 'INVALID_PROFILE_FIELD');
  });

  it('rejects runtime projection fields', () => {
    const fixture = loadFixture();
    fixture.profile.mapsTo = 'UNITY_MCP_TOOLS';

    expectErrorCode(fixture, 'RUNTIME_PROJECTION_FIELD');
  });

  it('rejects broad confirmation classes', () => {
    for (const broadClass of [
      'all-changes',
      'style-direction-change',
      'any-existing-asset-edit',
      'promote-draft',
      'cross-specialist-change',
    ]) {
      const fixture = loadFixture();
      fixture.confirmationRequiredScope = [...CANONICAL_SPECIALIST_CONFIRMATION_TOKENS, broadClass];
      expectErrorCode(fixture, 'INVALID_CONFIRMATION_SCOPE');
    }
  });

  it('rejects executable bus fields and requires conceptual handoff hooks', () => {
    const topLevelBus = loadFixture();
    topLevelBus.bus = { executable: false };
    expectErrorCode(topLevelBus, 'EXECUTABLE_BUS_FIELD');

    const executableBus = loadFixture();
    executableBus.handoffHooks.executable = true;
    expectErrorCode(executableBus, 'EXECUTABLE_BUS_FIELD');

    const nonConceptualHooks = loadFixture();
    nonConceptualHooks.handoffHooks.conceptualOnly = false;
    expectErrorCode(nonConceptualHooks, 'EXECUTABLE_BUS_FIELD');

    const scheduler = loadFixture();
    scheduler.handoffHooks.scheduler = 'later';
    expectErrorCode(scheduler, 'EXECUTABLE_BUS_FIELD');
  });

  it('does not expose runtime allowlist output from the validator module', () => {
    const result = validateSpecialistContract(loadFixture());

    expect(Object.keys(result)).toEqual(['valid', 'errors']);
    expect(JSON.stringify(result)).not.toContain('UNITY_MCP_TOOLS');
  });
});
