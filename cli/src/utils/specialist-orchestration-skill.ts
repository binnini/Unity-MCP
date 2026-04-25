import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  consumeSpecialistPromptPack,
  type ConsumedPreferredEvidence,
  type SpecialistPromptPackConsumption,
} from './specialist-prompt-consumer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '..', '..');

const DEFAULT_REGISTRY_PATH = path.join(
  cliRoot,
  'examples',
  'specialists',
  'v2',
  'first-wave-prompt-registry.v2.json',
);
const REGISTRY_PATH_ENV_VAR = 'UNITY_MCP_SPECIALIST_PROMPT_REGISTRY_PATH';

export const SPECIALIST_ORCHESTRATION_SUPPORTED_AGENT_IDS = [
  'claude-code',
  'cursor',
  'codex',
] as const;

export const SPECIALIST_ORCHESTRATION_ARTIFACT_DIR = 'unity-mcp-specialists-v2';
export const SPECIALIST_ORCHESTRATION_ARTIFACT_FILENAME = 'SKILL.md';
export const SPECIALIST_ORCHESTRATION_ARTIFACT_RELATIVE_PATH = path.join(
  SPECIALIST_ORCHESTRATION_ARTIFACT_DIR,
  SPECIALIST_ORCHESTRATION_ARTIFACT_FILENAME,
);
export const SPECIALIST_ORCHESTRATION_OWNERSHIP_MARKER =
  '<!-- GENERATED: unity-mcp-cli setup-skills specialists-v2 orchestration; CLI-owned temporary artifact; do not hand-edit. -->';

interface SpecialistRegistryEntry {
  specialistId: string;
  promptPack: string;
  specialistDoc: string;
  runtimeStatus: 'grounded' | 'guide-level' | 'deferred';
}

interface SpecialistRegistry {
  version: number;
  specialists: SpecialistRegistryEntry[];
}

export interface RenderSpecialistOrchestrationOptions {
  registryPath?: string;
}

function loadJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function resolveFromCliRoot(relativePath: string): string {
  return path.join(cliRoot, '..', relativePath);
}

function formatEvidenceLine(entry: ConsumedPreferredEvidence): string {
  if (entry.value === 'review://animation/session/{sessionId}') {
    return `- \`${entry.value}\` (${entry.kind}; read-only projection over \`.omx/state/specialists/review-sessions/animator/{sessionId}.json\`)`;
  }

  return `- \`${entry.value}\` (${entry.kind})`;
}

function renderConsumptionSection(consumption: SpecialistPromptPackConsumption): string {
  const preferredEvidence = consumption.preferredEvidence.length > 0
    ? consumption.preferredEvidence.map(formatEvidenceLine).join('\n')
    : '- None';

  const runtimeBackedFirst = consumption.resourceToolUsage.runtimeBackedFirst.length > 0
    ? consumption.resourceToolUsage.runtimeBackedFirst.map(value => `- \`${value}\``).join('\n')
    : '- None';

  const externalFallback = consumption.resourceToolUsage.externalFallback.length > 0
    ? consumption.resourceToolUsage.externalFallback.map(value => `- \`${value}\``).join('\n')
    : '- None';

  const handoffRoutes = consumption.handoffPlan.routes.length > 0
    ? consumption.handoffPlan.routes.map(route => `- ${route.specialistId} (${route.trigger})`).join('\n')
    : '- None';

  const appliedLayers = consumption.appliedLayers.map(layer => {
    return [
      `#### ${layer.id}`,
      '',
      layer.content,
    ].join('\n');
  }).join('\n\n');

  return [
    `## ${consumption.specialistId}`,
    `- Runtime status: ${consumption.runtimeStatus}`,
    `- Surface: ${consumption.surface}`,
    '- Prompt stack order: selection-guide -> output-contract -> persona-prompt',
    '- Preferred evidence before freestyle exploration:',
    preferredEvidence,
    '- Runtime-backed evidence first:',
    runtimeBackedFirst,
    '- External fallback only:',
    externalFallback,
    '- Handoff routes:',
    handoffRoutes,
    '',
    '### Consumed prompt layers',
    '',
    appliedLayers,
  ].join('\n');
}

export function shouldGenerateSpecialistOrchestrationSkill(agentId: string): boolean {
  return SPECIALIST_ORCHESTRATION_SUPPORTED_AGENT_IDS.includes(
    agentId as (typeof SPECIALIST_ORCHESTRATION_SUPPORTED_AGENT_IDS)[number],
  );
}

export function renderSpecialistOrchestrationSkill(
  options: RenderSpecialistOrchestrationOptions = {},
): string {
  const registryPath = options.registryPath ?? process.env[REGISTRY_PATH_ENV_VAR] ?? DEFAULT_REGISTRY_PATH;
  const registry = loadJsonFile<SpecialistRegistry>(registryPath);

  if (registry.version !== 2) {
    throw new Error(`Unsupported first-wave prompt registry version: ${registry.version}`);
  }

  const sections = registry.specialists.map(entry => {
    const promptPackPath = resolveFromCliRoot(entry.promptPack);
    const pack = loadJsonFile<unknown>(promptPackPath);
    const consumption = consumeSpecialistPromptPack(pack, 'mcp');

    if (consumption.specialistId !== entry.specialistId) {
      throw new Error(
        `Prompt-pack registry mismatch: expected specialistId "${entry.specialistId}" but got "${consumption.specialistId}".`,
      );
    }

    if (consumption.runtimeStatus !== entry.runtimeStatus) {
      throw new Error(
        `Prompt-pack registry mismatch: expected runtimeStatus "${entry.runtimeStatus}" for "${entry.specialistId}" but got "${consumption.runtimeStatus}".`,
      );
    }

    return renderConsumptionSection(consumption);
  });

  return [
    SPECIALIST_ORCHESTRATION_OWNERSHIP_MARKER,
    '# Unity MCP Specialists v2 Orchestration',
    '',
    'This is a CLI-owned temporary orchestration artifact appended by `unity-mcp-cli setup-skills`.',
    'It does not replace the Unity generator and must not be treated as the canonical runtime seam.',
    '',
    '## Slice A boundaries',
    '- Supported agents in this slice: claude-code, cursor, codex.',
    '- Animator is the only runtime-backed specialist in the first wave.',
    '- UI and Sound remain guide-level only.',
    '- Gameplay remains deferred.',
    '- Prompt application order is guide -> output contract -> persona.',
    '- `review://animation/session/{sessionId}` remains a read-only projection only.',
    '',
    ...sections,
    '',
  ].join('\n');
}

export interface MaterializeSpecialistOrchestrationSkillOptions
  extends RenderSpecialistOrchestrationOptions {
  skillsPath: string;
}

export function materializeSpecialistOrchestrationSkill(
  options: MaterializeSpecialistOrchestrationSkillOptions,
): string {
  const outputPath = path.join(
    options.skillsPath,
    SPECIALIST_ORCHESTRATION_ARTIFACT_RELATIVE_PATH,
  );
  const outputDir = path.dirname(outputPath);
  const outputDirAlreadyExisted = fs.existsSync(outputDir);
  const rendered = renderSpecialistOrchestrationSkill(options);
  const tempPath = path.join(
    outputDir,
    `.${SPECIALIST_ORCHESTRATION_ARTIFACT_FILENAME}.${process.pid}.tmp`,
  );

  fs.mkdirSync(outputDir, { recursive: true });

  try {
    fs.writeFileSync(tempPath, `${rendered.endsWith('\n') ? rendered : `${rendered}\n`}`, 'utf-8');
    fs.renameSync(tempPath, outputPath);
    return outputPath;
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }

    if (!outputDirAlreadyExisted && fs.existsSync(outputDir) && fs.readdirSync(outputDir).length === 0) {
      fs.rmdirSync(outputDir);
    }

    throw error;
  }
}
