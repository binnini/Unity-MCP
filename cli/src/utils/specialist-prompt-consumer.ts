import {
  validateSpecialistPromptPack,
  type SpecialistPromptPackValidationError,
} from './specialist-prompt-pack.js';

export type SpecialistRuntimeStatus = 'grounded' | 'guide-level' | 'deferred';
export type SpecialistPromptConsumerSurface = 'chat-session' | 'mcp';
export type SpecialistPromptLayerId = 'selection-guide' | 'output-contract' | 'persona-prompt';
export type PreferredEvidenceKind = 'runtime-backed-resource' | 'runtime-backed-tool' | 'external-evidence';

export interface SpecialistPromptPack {
  version: 2;
  specialistId: string;
  runtimeStatus: SpecialistRuntimeStatus;
  selectionGuide: {
    selectWhen: string[];
    avoidWhen: string[];
    preferredEvidence: string[];
    handoffTo: string[];
  };
  outputContract: {
    sections: string[];
    evidenceRequired: true;
    focusedQuestionRequired: true;
    revisionTasksRequiredWhenFeedbackCaptured: true;
  };
  personaPrompt?: {
    voice: string;
    responsibilities: string[];
    mustNot: string[];
  } | null;
  runtimeBackedResources: string[];
  runtimeBackedTools: string[];
  references: {
    contractDoc: string;
    architectureDoc: string;
    specialistDoc: string;
    selectionGuideDoc: string;
    promptArchitectureDoc: string;
  };
}

export interface ConsumedPromptLayer {
  id: SpecialistPromptLayerId;
  content: string;
}

export interface ConsumedPreferredEvidence {
  value: string;
  kind: PreferredEvidenceKind;
  runtimeBacked: boolean;
  consumeVia: 'resource' | 'tool' | 'external';
}

export interface ConsumedHandoffPlan {
  specialistId: string;
  trigger: 'scope-mismatch' | 'adjacent-owner';
}

export interface SpecialistPromptPackConsumption {
  specialistId: string;
  runtimeStatus: SpecialistRuntimeStatus;
  surface: SpecialistPromptConsumerSurface;
  appliedLayers: ConsumedPromptLayer[];
  prompt: string;
  outputSections: string[];
  preferredEvidence: ConsumedPreferredEvidence[];
  resourceToolUsage: {
    usePreferredEvidenceBeforeFreestyle: true;
    runtimeBackedFirst: string[];
    externalFallback: string[];
  };
  handoffPlan: {
    handoffTo: string[];
    triggerOnAvoidWhen: true;
    triggerOnEvidenceOutsideSpecialistScope: true;
    routes: ConsumedHandoffPlan[];
  };
}

export class InvalidSpecialistPromptPackError extends Error {
  readonly errors: SpecialistPromptPackValidationError[];

  constructor(errors: SpecialistPromptPackValidationError[]) {
    super('Invalid specialist prompt pack.');
    this.name = 'InvalidSpecialistPromptPackError';
    this.errors = errors;
  }
}

function renderBulletList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}

function createSelectionGuideLayer(
  pack: SpecialistPromptPack,
  surface: SpecialistPromptConsumerSurface
): ConsumedPromptLayer {
  const usageTail =
    surface === 'mcp'
      ? 'Use preferredEvidence before freestyle exploration. If the evidence you need is outside this specialist lane, hand off instead of widening scope.'
      : 'Keep specialist selection and evidence boundaries anchored to this guide before answering.';

  return {
    id: 'selection-guide',
    content: [
      `Selection Guide (${pack.specialistId}, ${pack.runtimeStatus}):`,
      'Select when:',
      renderBulletList(pack.selectionGuide.selectWhen),
      'Avoid when:',
      renderBulletList(pack.selectionGuide.avoidWhen),
      'Preferred evidence to consult first:',
      renderBulletList(pack.selectionGuide.preferredEvidence),
      'Adjacent handoff targets:',
      renderBulletList(pack.selectionGuide.handoffTo),
      usageTail,
    ].join('\n'),
  };
}

function createOutputContractLayer(pack: SpecialistPromptPack): ConsumedPromptLayer {
  return {
    id: 'output-contract',
    content: [
      `Output Contract (${pack.specialistId}):`,
      'Preserve these sections in order:',
      renderBulletList(pack.outputContract.sections),
      '- Evidence is required.',
      '- A focused question is required.',
      '- If feedbackCaptured exists, revision tasks must be extracted.',
    ].join('\n'),
  };
}

function createPersonaLayer(pack: SpecialistPromptPack): ConsumedPromptLayer | null {
  if (!pack.personaPrompt) {
    return null;
  }

  return {
    id: 'persona-prompt',
    content: [
      `Persona (${pack.specialistId}):`,
      `Voice: ${pack.personaPrompt.voice}`,
      'Responsibilities:',
      renderBulletList(pack.personaPrompt.responsibilities),
      'Must not:',
      renderBulletList(pack.personaPrompt.mustNot),
      'Persona only refines delivery after the guide and output contract are already applied.',
    ].join('\n'),
  };
}

function classifyPreferredEvidence(pack: SpecialistPromptPack): ConsumedPreferredEvidence[] {
  const runtimeResources = new Set(pack.runtimeBackedResources);
  const runtimeTools = new Set(pack.runtimeBackedTools);

  return pack.selectionGuide.preferredEvidence.map(value => {
    if (runtimeResources.has(value)) {
      return {
        value,
        kind: 'runtime-backed-resource',
        runtimeBacked: true,
        consumeVia: 'resource',
      };
    }

    if (runtimeTools.has(value)) {
      return {
        value,
        kind: 'runtime-backed-tool',
        runtimeBacked: true,
        consumeVia: 'tool',
      };
    }

    return {
      value,
      kind: 'external-evidence',
      runtimeBacked: false,
      consumeVia: 'external',
    };
  });
}

export function consumeSpecialistPromptPack(
  input: unknown,
  surface: SpecialistPromptConsumerSurface
): SpecialistPromptPackConsumption {
  const validation = validateSpecialistPromptPack(input);
  if (!validation.valid) {
    throw new InvalidSpecialistPromptPackError(validation.errors);
  }

  const pack = input as SpecialistPromptPack;
  const appliedLayers = [
    createSelectionGuideLayer(pack, surface),
    createOutputContractLayer(pack),
    createPersonaLayer(pack),
  ].filter((layer): layer is ConsumedPromptLayer => layer !== null);

  const preferredEvidence = classifyPreferredEvidence(pack);
  const runtimeBackedFirst = preferredEvidence.filter(entry => entry.runtimeBacked).map(entry => entry.value);
  const externalFallback = preferredEvidence.filter(entry => !entry.runtimeBacked).map(entry => entry.value);

  return {
    specialistId: pack.specialistId,
    runtimeStatus: pack.runtimeStatus,
    surface,
    appliedLayers,
    prompt: appliedLayers.map(layer => layer.content).join('\n\n'),
    outputSections: [...pack.outputContract.sections],
    preferredEvidence,
    resourceToolUsage: {
      usePreferredEvidenceBeforeFreestyle: true,
      runtimeBackedFirst,
      externalFallback,
    },
    handoffPlan: {
      handoffTo: [...pack.selectionGuide.handoffTo],
      triggerOnAvoidWhen: true,
      triggerOnEvidenceOutsideSpecialistScope: true,
      routes: pack.selectionGuide.handoffTo.map(specialistId => ({
        specialistId,
        trigger: 'adjacent-owner',
      })),
    },
  };
}
