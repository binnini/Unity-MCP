export interface SpecialistPromptPackValidationError {
  code: string;
  path: string;
  message: string;
}

export interface SpecialistPromptPackValidationResult {
  valid: boolean;
  errors: SpecialistPromptPackValidationError[];
}

type RuntimeStatus = 'grounded' | 'guide-level' | 'deferred';

const ALLOWED_RUNTIME_STATUSES = new Set<RuntimeStatus>(['grounded', 'guide-level', 'deferred']);
const REQUIRED_OUTPUT_SECTIONS = ['Intent', 'Summary', 'Evidence', 'Focused Question', 'Revision Tasks', 'Risk'] as const;

function addError(
  errors: SpecialistPromptPackValidationError[],
  code: string,
  path: string,
  message: string
): void {
  errors.push({ code, path, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function validateStringArrayField(
  container: Record<string, unknown>,
  field: string,
  errors: SpecialistPromptPackValidationError[],
  pathPrefix = ''
): string[] {
  const path = pathPrefix ? `${pathPrefix}.${field}` : field;
  const value = container[field];
  if (!Array.isArray(value) || value.length === 0) {
    addError(errors, 'INVALID_ARRAY', path, `${path} must be a non-empty array of strings.`);
    return [];
  }

  const strings: string[] = [];
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      addError(errors, 'INVALID_ARRAY_ITEM', `${path}[${index}]`, `${path} entries must be non-empty strings.`);
      return;
    }
    strings.push(entry);
  });
  return strings;
}

export function validateSpecialistPromptPack(input: unknown): SpecialistPromptPackValidationResult {
  const errors: SpecialistPromptPackValidationError[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ code: 'INVALID_PROMPT_PACK', path: '', message: 'Prompt pack must be a JSON object.' }],
    };
  }

  if (input.version !== 2) {
    addError(errors, 'INVALID_VERSION', 'version', 'Prompt pack fixtures must use version === 2.');
  }

  if (!isNonEmptyString(input.specialistId)) {
    addError(errors, 'INVALID_SPECIALIST_ID', 'specialistId', 'specialistId must be a non-empty string.');
  }

  if (!isNonEmptyString(input.runtimeStatus) || !ALLOWED_RUNTIME_STATUSES.has(input.runtimeStatus as RuntimeStatus)) {
    addError(
      errors,
      'INVALID_RUNTIME_STATUS',
      'runtimeStatus',
      'runtimeStatus must be one of grounded, guide-level, or deferred.'
    );
  }

  if (!isRecord(input.selectionGuide)) {
    addError(errors, 'INVALID_SELECTION_GUIDE', 'selectionGuide', 'selectionGuide must be an object.');
  } else {
    for (const field of ['selectWhen', 'avoidWhen', 'preferredEvidence', 'handoffTo'] as const) {
      validateStringArrayField(input.selectionGuide, field, errors, 'selectionGuide');
    }
  }

  if (!isRecord(input.outputContract)) {
    addError(errors, 'INVALID_OUTPUT_CONTRACT', 'outputContract', 'outputContract must be an object.');
  } else {
    const sections = validateStringArrayField(input.outputContract, 'sections', errors, 'outputContract');
    const missingSections = REQUIRED_OUTPUT_SECTIONS.filter(section => !sections.includes(section));
    if (missingSections.length > 0) {
      addError(
        errors,
        'MISSING_OUTPUT_SECTION',
        'outputContract.sections',
        `outputContract.sections must include: ${missingSections.join(', ')}.`
      );
    }

    for (const field of ['evidenceRequired', 'focusedQuestionRequired', 'revisionTasksRequiredWhenFeedbackCaptured'] as const) {
      if (input.outputContract[field] !== true) {
        addError(
          errors,
          'INVALID_OUTPUT_CONTRACT',
          `outputContract.${field}`,
          `${field} must be true for first-wave v2 prompt packs.`
        );
      }
    }
  }

  if ('personaPrompt' in input && input.personaPrompt !== undefined && input.personaPrompt !== null) {
    if (!isRecord(input.personaPrompt)) {
      addError(errors, 'INVALID_PERSONA_PROMPT', 'personaPrompt', 'personaPrompt must be an object when present.');
    } else {
      if (!isNonEmptyString(input.personaPrompt.voice)) {
        addError(errors, 'INVALID_PERSONA_PROMPT', 'personaPrompt.voice', 'personaPrompt.voice must be a non-empty string.');
      }
      for (const field of ['responsibilities', 'mustNot'] as const) {
        validateStringArrayField(input.personaPrompt, field, errors, 'personaPrompt');
      }
    }
  }

  const resources = Array.isArray(input.runtimeBackedResources) ? input.runtimeBackedResources : [];
  const tools = Array.isArray(input.runtimeBackedTools) ? input.runtimeBackedTools : [];

  if ('runtimeBackedResources' in input && !isStringArray(input.runtimeBackedResources)) {
    addError(
      errors,
      'INVALID_RUNTIME_SURFACE',
      'runtimeBackedResources',
      'runtimeBackedResources must be an array of non-empty strings.'
    );
  }

  if ('runtimeBackedTools' in input && !isStringArray(input.runtimeBackedTools)) {
    addError(
      errors,
      'INVALID_RUNTIME_SURFACE',
      'runtimeBackedTools',
      'runtimeBackedTools must be an array of non-empty strings.'
    );
  }

  const runtimeStatus = input.runtimeStatus as RuntimeStatus | undefined;
  if (runtimeStatus === 'grounded') {
    if (resources.length === 0 && tools.length === 0) {
      addError(
        errors,
        'MISSING_RUNTIME_SURFACE',
        'runtimeBackedResources',
        'grounded prompt packs must declare at least one runtime-backed resource or tool.'
      );
    }
  } else if ((runtimeStatus === 'guide-level' || runtimeStatus === 'deferred') && (resources.length > 0 || tools.length > 0)) {
    addError(
      errors,
      'UNGROUNDED_RUNTIME_CLAIM',
      'runtimeBackedResources',
      'guide-level or deferred prompt packs must not claim runtime-backed resources or tools.'
    );
  }

  return { valid: errors.length === 0, errors };
}
