export interface SpecialistContractValidationError {
  code: string;
  path: string;
  message: string;
}

export interface SpecialistContractValidationResult {
  valid: boolean;
  errors: SpecialistContractValidationError[];
}

const REQUIRED_TOP_LEVEL_FIELDS = [
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

export const CANONICAL_SPECIALIST_CONFIRMATION_TOKENS = [
  'delete-approved-or-canonical-asset',
  'destroy-approved-or-canonical-gameobject',
  'irreversible-overwrite-approved-or-canonical-asset',
  'irreversible-replace-approved-or-canonical-gameobject',
] as const;

const REQUIRED_FEEDBACK_FLAGS = [
  'summaryRequired',
  'evidenceRequired',
  'focusedQuestionRequired',
  'feedbackCaptureRequired',
  'revisionTaskExtractionRequired',
  'resultReportRequired',
] as const;

const REQUIRED_EVIDENCE_CATEGORIES = ['visual', 'state', 'validation', 'debug'] as const;
const UNBOUNDED_TOOL_GRANTS = new Set(['*', 'all', 'all-tools']);
const EXECUTABLE_BUS_KEYS = new Set([
  'bus',
  'queue',
  'scheduler',
  'mailbox',
  'dispatch',
  'dispatcher',
  'polling',
  'pollingLoop',
  'lifecycle',
  'lifecycleOwner',
]);

function addError(
  errors: SpecialistContractValidationError[],
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

function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function isWildcard(value: string): boolean {
  return value.includes('*');
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues);
  }
  if (isRecord(value)) {
    return Object.values(value).flatMap(collectStringValues);
  }
  return [];
}

function validateStringArrayField(
  contract: Record<string, unknown>,
  field: string,
  errors: SpecialistContractValidationError[]
): void {
  const value = contract[field];
  if (!isNonEmptyArray(value)) {
    addError(errors, 'EMPTY_ARRAY', field, `${field} must be a non-empty array.`);
    return;
  }
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      addError(errors, 'INVALID_ARRAY_ITEM', `${field}[${index}]`, `${field} entries must be non-empty strings.`);
    }
  });
}

function validateObjectArrayField(
  contract: Record<string, unknown>,
  field: string,
  requiredStringFields: string[],
  errors: SpecialistContractValidationError[]
): void {
  const value = contract[field];
  if (!isNonEmptyArray(value)) {
    addError(errors, 'EMPTY_ARRAY', field, `${field} must be a non-empty array.`);
    return;
  }

  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      addError(errors, 'INVALID_ARRAY_ITEM', `${field}[${index}]`, `${field} entries must be objects.`);
      return;
    }

    for (const requiredField of requiredStringFields) {
      if (!isNonEmptyString(entry[requiredField])) {
        addError(
          errors,
          'INVALID_ARRAY_ITEM',
          `${field}[${index}].${requiredField}`,
          `${field} entries must include a non-empty ${requiredField} string.`
        );
      }
    }
  });
}

function validateRequiredFields(
  contract: Record<string, unknown>,
  errors: SpecialistContractValidationError[]
): void {
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in contract)) {
      addError(errors, 'MISSING_FIELD', field, `Missing required specialist contract field: ${field}.`);
    }
  }
}

function validateIdentity(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  for (const field of ['id', 'displayName', 'discipline', 'mission'] as const) {
    if (field in contract && !isNonEmptyString(contract[field])) {
      addError(errors, 'INVALID_STRING', field, `${field} must be a non-empty string.`);
    }
  }

  if ('version' in contract && contract.version !== 1) {
    addError(errors, 'INVALID_VERSION', 'version', 'Specialist contract v1 fixtures must use version === 1.');
  }
}

function validateCollections(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  for (const field of ['allowedScope', 'forbiddenScope', 'acceptanceScenarios']) {
    if (field in contract) {
      validateStringArrayField(contract, field, errors);
    }
  }

  if ('rolePrompts' in contract) {
    validateObjectArrayField(contract, 'rolePrompts', ['id', 'purpose'], errors);
  }

  if ('resources' in contract) {
    validateObjectArrayField(contract, 'resources', ['uri', 'mode', 'purpose'], errors);
  }
}

function validateFeedbackProtocol(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('feedbackProtocol' in contract)) return;

  const feedbackProtocol = contract.feedbackProtocol;
  if (!isRecord(feedbackProtocol)) {
    addError(errors, 'INVALID_FEEDBACK_PROTOCOL', 'feedbackProtocol', 'feedbackProtocol must be an object.');
    return;
  }

  for (const flag of REQUIRED_FEEDBACK_FLAGS) {
    if (feedbackProtocol[flag] !== true) {
      addError(
        errors,
        'INVALID_FEEDBACK_PROTOCOL',
        `feedbackProtocol.${flag}`,
        `${flag} must be true for chat-first v1 specialist contracts.`
      );
    }
  }
}

function validateEvidenceRequirements(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('evidenceRequirements' in contract)) return;

  const evidenceRequirements = contract.evidenceRequirements;
  if (!isRecord(evidenceRequirements)) {
    addError(errors, 'INVALID_EVIDENCE_REQUIREMENTS', 'evidenceRequirements', 'evidenceRequirements must be an object.');
    return;
  }

  for (const category of REQUIRED_EVIDENCE_CATEGORIES) {
    const requirement = evidenceRequirements[category];
    if (!isRecord(requirement)) {
      addError(
        errors,
        'MISSING_EVIDENCE_CATEGORY',
        `evidenceRequirements.${category}`,
        `${category} evidence requirements must be present.`
      );
      continue;
    }

    if (!isNonEmptyArray(requirement.acceptedSources)) {
      addError(
        errors,
        'MISSING_EVIDENCE_SOURCE',
        `evidenceRequirements.${category}.acceptedSources`,
        `${category} evidence requirements must list at least one accepted source.`
      );
    }
  }
}

function validateConfirmationScope(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('confirmationRequiredScope' in contract)) return;

  const confirmationRequiredScope = contract.confirmationRequiredScope;
  if (!Array.isArray(confirmationRequiredScope)) {
    addError(errors, 'INVALID_CONFIRMATION_SCOPE', 'confirmationRequiredScope', 'confirmationRequiredScope must be an array.');
    return;
  }
  if (confirmationRequiredScope.length === 0) {
    addError(errors, 'EMPTY_ARRAY', 'confirmationRequiredScope', 'confirmationRequiredScope must include canonical destructive confirmation tokens.');
    return;
  }

  const canonical = new Set<string>(CANONICAL_SPECIALIST_CONFIRMATION_TOKENS);
  for (const [index, token] of confirmationRequiredScope.entries()) {
    if (!isNonEmptyString(token) || !canonical.has(token)) {
      addError(
        errors,
        'INVALID_CONFIRMATION_SCOPE',
        `confirmationRequiredScope[${index}]`,
        'Confirmation scope must use the canonical Animator v1 delete/destroy or irreversible overwrite/replace tokens.'
      );
    }
  }
}

function validateTools(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('tools' in contract)) return;

  const tools = contract.tools;
  if (!isRecord(tools)) {
    addError(errors, 'INVALID_TOOLS', 'tools', 'tools must be an object with exact/wildcard declarations.');
    return;
  }

  const exact = tools.exact;
  const wildcard = tools.wildcard;
  if (!isNonEmptyArray(exact) && !isNonEmptyArray(wildcard)) {
    addError(errors, 'EMPTY_TOOLS', 'tools', 'tools must declare at least one exact or wildcard entry.');
  }

  for (const [path, values] of [
    ['tools.exact', exact],
    ['tools.wildcard', wildcard],
    ['tools.destructiveOrIrreversible', tools.destructiveOrIrreversible],
  ] as const) {
    if (values === undefined) continue;
    if (!Array.isArray(values)) {
      addError(errors, 'INVALID_TOOLS', path, `${path} must be an array when present.`);
      continue;
    }
    values.forEach((entry, index) => {
      if (!isNonEmptyString(entry)) {
        addError(errors, 'INVALID_TOOL_ENTRY', `${path}[${index}]`, 'Tool entries must be non-empty strings.');
        return;
      }
      if (UNBOUNDED_TOOL_GRANTS.has(entry)) {
        addError(errors, 'UNBOUNDED_TOOL_GRANT', `${path}[${index}]`, 'Specialist contracts must not grant all tools.');
      }
    });
  }

  if (isNonEmptyArray(tools.destructiveOrIrreversible)) {
    const confirmationScope = Array.isArray(contract.confirmationRequiredScope)
      ? contract.confirmationRequiredScope
      : [];
    const hasAllCanonicalTokens = CANONICAL_SPECIALIST_CONFIRMATION_TOKENS.every(token =>
      confirmationScope.includes(token)
    );
    if (!hasAllCanonicalTokens) {
      addError(
        errors,
        'MISSING_CONFIRMATION_METADATA',
        'confirmationRequiredScope',
        'Destructive or irreversible tool declarations require canonical confirmation metadata.'
      );
    }
  }
}

function validateProfile(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('profile' in contract)) return;

  const profile = contract.profile;
  if (!isRecord(profile)) {
    addError(errors, 'INVALID_PROFILE', 'profile', 'profile must be an object.');
    return;
  }

  if ('mapsTo' in profile) {
    addError(errors, 'RUNTIME_PROJECTION_FIELD', 'profile.mapsTo', 'Slice 2 fixtures must not declare runtime projection fields.');
  }

  if ('id' in profile && !isNonEmptyString(profile.id)) {
    addError(errors, 'INVALID_PROFILE_FIELD', 'profile.id', 'profile.id must be a non-empty string.');
  }

  for (const field of ['id', 'prompts', 'resources', 'tools'] as const) {
    if (!(field in profile)) {
      addError(errors, 'MISSING_PROFILE_FIELD', `profile.${field}`, `profile.${field} is required.`);
    }
  }

  for (const field of ['prompts', 'resources', 'tools'] as const) {
    const values = profile[field];
    if (values !== undefined && !isNonEmptyArray(values)) {
      addError(errors, 'EMPTY_PROFILE_FIELD', `profile.${field}`, `profile.${field} must be a non-empty array.`);
      continue;
    }
    if (Array.isArray(values)) {
      values.forEach((entry, index) => {
        if (!isNonEmptyString(entry)) {
          addError(errors, 'INVALID_PROFILE_FIELD', `profile.${field}[${index}]`, `profile.${field} entries must be non-empty strings.`);
        }
      });
    }
  }

  const profileTools = Array.isArray(profile.tools) ? profile.tools : [];
  const wildcardValues = [
    ...profileTools.filter((entry): entry is string => isNonEmptyString(entry) && isWildcard(entry)),
    ...collectStringValues(isRecord(contract.tools) ? contract.tools.wildcard : undefined).filter(isWildcard),
  ];

  profileTools.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      addError(errors, 'INVALID_TOOL_ENTRY', `profile.tools[${index}]`, 'Profile tool entries must be non-empty strings.');
      return;
    }
    if (UNBOUNDED_TOOL_GRANTS.has(entry)) {
      addError(errors, 'UNBOUNDED_TOOL_GRANT', `profile.tools[${index}]`, 'Specialist profiles must not grant all tools.');
    }
  });

  if (wildcardValues.length > 0 && !isNonEmptyString(profile.wildcardSemantics)) {
    addError(
      errors,
      'MISSING_WILDCARD_SEMANTICS',
      'profile.wildcardSemantics',
      'Wildcard tool declarations require documented declaration-only wildcard semantics.'
    );
  }
}

function validateAutonomyRiskPolicy(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('autonomyRiskPolicy' in contract)) return;

  const policy = contract.autonomyRiskPolicy;
  if (!isRecord(policy)) {
    addError(errors, 'INVALID_AUTONOMY_RISK_POLICY', 'autonomyRiskPolicy', 'autonomyRiskPolicy must be an object.');
    return;
  }

  if (!isNonEmptyString(policy.defaultMode)) {
    addError(errors, 'INVALID_AUTONOMY_RISK_POLICY', 'autonomyRiskPolicy.defaultMode', 'defaultMode must be a non-empty string.');
  }
  if (policy.ordinaryFeedbackDoesNotRequireHardApproval !== true) {
    addError(
      errors,
      'INVALID_AUTONOMY_RISK_POLICY',
      'autonomyRiskPolicy.ordinaryFeedbackDoesNotRequireHardApproval',
      'Ordinary feedback must remain feedback-first and not hard-approval-gated.'
    );
  }
}

function validateHandoffHooks(contract: Record<string, unknown>, errors: SpecialistContractValidationError[]): void {
  if (!('handoffHooks' in contract)) return;

  const handoffHooks = contract.handoffHooks;
  if (!isRecord(handoffHooks)) {
    addError(errors, 'INVALID_HANDOFF_HOOKS', 'handoffHooks', 'handoffHooks must be an object.');
    return;
  }

  if (handoffHooks.conceptualOnly !== true) {
    addError(errors, 'EXECUTABLE_BUS_FIELD', 'handoffHooks.conceptualOnly', 'handoffHooks must remain conceptual-only in v1.');
  }
  if (!isNonEmptyArray(handoffHooks.events)) {
    addError(errors, 'INVALID_HANDOFF_HOOKS', 'handoffHooks.events', 'handoffHooks.events must list conceptual event labels.');
  }
}

function validateNoExecutableBus(value: unknown, errors: SpecialistContractValidationError[], path = ''): void {
  if (path === 'profile.setupHints' || path.startsWith('profile.setupHints[') || path.startsWith('profile.setupHints.')) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNoExecutableBus(entry, errors, `${path}[${index}]`));
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (EXECUTABLE_BUS_KEYS.has(key)) {
      addError(errors, 'EXECUTABLE_BUS_FIELD', childPath, 'Executable bus, queue, scheduler, mailbox, dispatch, polling, or lifecycle fields are out of scope.');
    }
    if (key === 'executable' && child === true) {
      addError(errors, 'EXECUTABLE_BUS_FIELD', childPath, 'Executable bus behavior is out of scope for v1 contracts.');
    }
    validateNoExecutableBus(child, errors, childPath);
  }
}

export function validateSpecialistContract(input: unknown): SpecialistContractValidationResult {
  const errors: SpecialistContractValidationError[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ code: 'INVALID_CONTRACT', path: '', message: 'Specialist contract must be a JSON object.' }],
    };
  }

  validateRequiredFields(input, errors);
  validateIdentity(input, errors);
  validateCollections(input, errors);
  validateFeedbackProtocol(input, errors);
  validateEvidenceRequirements(input, errors);
  validateConfirmationScope(input, errors);
  validateTools(input, errors);
  validateProfile(input, errors);
  validateAutonomyRiskPolicy(input, errors);
  validateHandoffHooks(input, errors);
  validateNoExecutableBus(input, errors);

  return { valid: errors.length === 0, errors };
}
