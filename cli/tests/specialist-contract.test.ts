import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  CANONICAL_SPECIALIST_CONFIRMATION_TOKENS,
  validateAnimatorReviewSessionArtifact,
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

describe('animator review session artifact validator', () => {
  function validReviewSession() {
    return {
      sessionId: 'animator-session-001',
      specialistId: 'animator',
      status: 'awaiting-feedback',
      targetRefs: ['animation://controller/Assets%2FCharacters%2FHero.controller'],
      intentRestatement: 'Tune the locomotion controller to reduce foot sliding.',
      summary: 'Current blend timings overshoot on the stop transition.',
      evidence: [
        {
          category: 'visual',
          source: 'screenshot-game-view',
          summary: 'Stop transition shows visible foot slide on frame 12.',
        },
        {
          category: 'state',
          source: 'animation://controller/Assets%2FCharacters%2FHero.controller',
          summary: 'Stop state exits from locomotion with a high transition duration.',
        },
      ],
      focusedQuestion: 'Should the stop transition duration be shortened for the canonical locomotion set?',
      riskNote: 'Avoid destructive overwrite of the approved controller without confirmation.',
      updatedAt: '2026-04-25T13:05:00Z',
    };
  }

  it('accepts a minimal evidence-linked animator review session artifact', () => {
    expect(validateAnimatorReviewSessionArtifact(validReviewSession())).toEqual({ valid: true, errors: [] });
  });

  it('requires canonical animator review session fields', () => {
    const fixture = validReviewSession();
    delete fixture.summary;

    const result = validateAnimatorReviewSessionArtifact(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_REVIEW_SESSION_FIELD', path: 'summary' })
    );
  });

  it('requires non-empty target refs and bounded evidence items', () => {
    const emptyTargets = validReviewSession();
    emptyTargets.targetRefs = [];
    expect(validateAnimatorReviewSessionArtifact(emptyTargets).errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_REVIEW_SESSION_FIELD', path: 'targetRefs' })
    );

    const invalidEvidence = validReviewSession();
    invalidEvidence.evidence = [{ category: 'audio', source: '', summary: '' }];

    const result = validateAnimatorReviewSessionArtifact(invalidEvidence);
    expect(result.valid).toBe(false);
    expect(result.errors.map(error => error.code)).toContain('INVALID_EVIDENCE_CATEGORY');
    expect(result.errors.map(error => error.path)).toContain('evidence[0].source');
    expect(result.errors.map(error => error.path)).toContain('evidence[0].summary');
  });

  it('requires revision tasks when feedback has been captured', () => {
    const fixture = validReviewSession();
    fixture.feedbackCaptured = 'Please tighten the stop pose timing.';

    const result = validateAnimatorReviewSessionArtifact(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_REVISION_TASKS', path: 'revisionTasks' })
    );
  });

  it('validates derived revision task fields and specialist identity', () => {
    const fixture = validReviewSession();
    fixture.specialistId = 'ui';
    fixture.feedbackCaptured = 'Reduce foot sliding and keep the same clip set.';
    fixture.revisionTasks = [{ id: 'rev-1', targetRef: '', action: 'Shorten stop transition.', acceptance: '' }];

    const result = validateAnimatorReviewSessionArtifact(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_SPECIALIST_ID', path: 'specialistId' })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_REVISION_TASK', path: 'revisionTasks[0].targetRef' })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_REVISION_TASK', path: 'revisionTasks[0].acceptance' })
    );
  });

  it('rejects unsafe session ids and revision targets outside the review context', () => {
    const fixture = validReviewSession();
    fixture.sessionId = '../escape';
    fixture.feedbackCaptured = 'Please keep the approved stop timing but reduce slide.';
    fixture.revisionTasks = [
      {
        id: 'rev-1',
        targetRef: 'animation://controller/Assets%2FCharacters%2FEnemy.controller',
        action: 'Retune the stop transition duration.',
        acceptance: 'Stop transition keeps the approved controller path and removes visible foot slide.',
      },
    ];

    const result = validateAnimatorReviewSessionArtifact(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_SESSION_ID', path: 'sessionId' })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_REVISION_LINKAGE', path: 'revisionTasks[0].targetRef' })
    );
  });

  it('rejects executable bus fields inside review session artifacts', () => {
    const fixture = validReviewSession() as Record<string, unknown>;
    fixture.lifecycleOwner = 'not-allowed';

    const result = validateAnimatorReviewSessionArtifact(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'EXECUTABLE_BUS_FIELD', path: 'lifecycleOwner' })
    );
  });
});
