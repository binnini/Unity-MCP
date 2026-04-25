import * as fs from 'fs';
import * as path from 'path';
import type { HandoffApprovalDecision } from './handoff-ledger.js';

const HANDOFF_SPOOL_SCHEMA_VERSION = 1;
const HANDOFF_SPOOL_DIR = path.join('.unity-mcp', 'handoff-spool');
const DISCORD_NOTIFICATIONS_DIR = 'discord-notifications';
const APPROVAL_INTENTS_DIR = 'approval-intents';

export type DiscordNotificationRecordKind = 'approval_card' | 'monitoring_card';
export type DiscordVisibilityScope = 'approval_gate' | 'windows_validation_status';
export type DiscordRenderedFrom = 'ledger' | 'spool_summary' | 'mixed';

export interface DiscordNotificationSpoolRecord {
  schemaVersion: number;
  provider: 'discord';
  recordKind: DiscordNotificationRecordKind;
  messageId: string;
  channelId: string;
  handoffId: string;
  recordVersion: number;
  requestedAction: string;
  sourceLane: string;
  targetLane: string;
  visibilityScope: DiscordVisibilityScope;
  subjectLabel: string | null;
  renderedFrom: DiscordRenderedFrom;
  sentAt: string;
  consumedAt: string | null;
  decision: HandoffApprovalDecision | null;
  supersededAt: string | null;
}

export interface QueuedApprovalIntentSpoolRecord {
  schemaVersion: number;
  provider: 'discord';
  intentId: string;
  interactionId: string;
  handoffId: string;
  handoffVersion: number;
  decision: HandoffApprovalDecision;
  actorId: string;
  createdAt: string;
  providerEvent: {
    messageId: string;
    channelId?: string;
  };
  verification: {
    signatureVerified: boolean;
    timestamp: string;
  };
}

export class HandoffSpoolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandoffSpoolError';
  }
}

export function getHandoffSpoolDirectory(projectPath: string): string {
  return path.join(path.resolve(projectPath), HANDOFF_SPOOL_DIR);
}

export function getDiscordNotificationFilePath(projectPath: string, messageId: string): string {
  return path.join(getHandoffSpoolDirectory(projectPath), DISCORD_NOTIFICATIONS_DIR, `${messageId}.json`);
}

export function getQueuedApprovalIntentFilePath(projectPath: string, interactionId: string): string {
  return path.join(getHandoffSpoolDirectory(projectPath), APPROVAL_INTENTS_DIR, `${interactionId}.json`);
}

export function writeDiscordNotificationSpoolRecord(projectPath: string, record: DiscordNotificationSpoolRecord): string {
  const filePath = getDiscordNotificationFilePath(projectPath, record.messageId);
  ensureParentDirectory(filePath);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n');
  return filePath;
}

export function listDiscordNotificationSpoolRecords(projectPath: string): DiscordNotificationSpoolRecord[] {
  const directory = path.join(getHandoffSpoolDirectory(projectPath), DISCORD_NOTIFICATIONS_DIR);
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory)
    .filter(entry => entry.endsWith('.json'))
    .map(entry => {
      const filePath = path.join(directory, entry);
      return parseDiscordNotificationSpoolRecord(fs.readFileSync(filePath, 'utf-8'), filePath);
    })
    .sort((left, right) => Date.parse(right.sentAt) - Date.parse(left.sentAt) || right.messageId.localeCompare(left.messageId));
}

export function readDiscordNotificationSpoolRecord(projectPath: string, messageId: string): DiscordNotificationSpoolRecord {
  const filePath = getDiscordNotificationFilePath(projectPath, messageId);
  if (!fs.existsSync(filePath)) {
    throw new HandoffSpoolError(`No Discord notification spool record found for message: ${messageId}`);
  }
  return parseDiscordNotificationSpoolRecord(fs.readFileSync(filePath, 'utf-8'), filePath);
}

export function markDiscordNotificationConsumed(projectPath: string, messageId: string, decision: HandoffApprovalDecision, consumedAt: string): DiscordNotificationSpoolRecord {
  const record = readDiscordNotificationSpoolRecord(projectPath, messageId);
  const nextRecord: DiscordNotificationSpoolRecord = {
    ...record,
    consumedAt,
    decision,
  };
  writeDiscordNotificationSpoolRecord(projectPath, nextRecord);
  return nextRecord;
}

export function findActiveDiscordMonitoringRecord(
  projectPath: string,
  input: {
    handoffId: string;
    recordVersion: number;
    visibilityScope: Exclude<DiscordVisibilityScope, 'approval_gate'>;
  },
): DiscordNotificationSpoolRecord | null {
  return listDiscordNotificationSpoolRecords(projectPath).find(record =>
    record.recordKind === 'monitoring_card'
    && record.handoffId === input.handoffId
    && record.recordVersion === input.recordVersion
    && record.visibilityScope === input.visibilityScope
    && record.supersededAt === null,
  ) ?? null;
}

export function hasQueuedApprovalIntent(projectPath: string, interactionId: string): boolean {
  return fs.existsSync(getQueuedApprovalIntentFilePath(projectPath, interactionId));
}

export function writeQueuedApprovalIntent(projectPath: string, record: QueuedApprovalIntentSpoolRecord): string {
  const filePath = getQueuedApprovalIntentFilePath(projectPath, record.interactionId);
  ensureParentDirectory(filePath);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n');
  return filePath;
}

export function parseDiscordNotificationSpoolRecord(json: string, source = 'Discord notification spool record'): DiscordNotificationSpoolRecord {
  const parsed = parseJsonRecord(json, source);
  const recordVersion = parsed.recordVersion;
  if (!Number.isInteger(recordVersion) || Number(recordVersion) < 1) {
    throw new HandoffSpoolError(`Invalid ${source}.recordVersion`);
  }

  return {
    schemaVersion: assertSchemaVersion(parsed.schemaVersion, source),
    provider: assertLiteral(parsed.provider, 'discord', `${source}.provider`),
    recordKind: parsed.recordKind === undefined
      ? 'approval_card'
      : assertDiscordNotificationRecordKind(parsed.recordKind, `${source}.recordKind`),
    messageId: assertNonEmptyString(parsed.messageId, `${source}.messageId`),
    channelId: assertNonEmptyString(parsed.channelId, `${source}.channelId`),
    handoffId: assertNonEmptyString(parsed.handoffId, `${source}.handoffId`),
    recordVersion: Number(recordVersion),
    requestedAction: assertNonEmptyString(parsed.requestedAction, `${source}.requestedAction`),
    sourceLane: assertNonEmptyString(parsed.sourceLane, `${source}.sourceLane`),
    targetLane: assertNonEmptyString(parsed.targetLane, `${source}.targetLane`),
    visibilityScope: parsed.visibilityScope === undefined
      ? 'approval_gate'
      : assertDiscordVisibilityScope(parsed.visibilityScope, `${source}.visibilityScope`),
    subjectLabel: parsed.subjectLabel === undefined || parsed.subjectLabel === null
      ? null
      : assertNonEmptyString(parsed.subjectLabel, `${source}.subjectLabel`),
    renderedFrom: parsed.renderedFrom === undefined
      ? 'ledger'
      : assertDiscordRenderedFrom(parsed.renderedFrom, `${source}.renderedFrom`),
    sentAt: assertNonEmptyString(parsed.sentAt, `${source}.sentAt`),
    consumedAt: parsed.consumedAt === null ? null : assertNonEmptyString(parsed.consumedAt, `${source}.consumedAt`),
    decision: parsed.decision === null ? null : assertApprovalDecision(parsed.decision, `${source}.decision`),
    supersededAt: parsed.supersededAt === undefined || parsed.supersededAt === null
      ? null
      : assertNonEmptyString(parsed.supersededAt, `${source}.supersededAt`),
  };
}

export function createDiscordNotificationSpoolRecord(input: {
  messageId: string;
  channelId: string;
  handoffId: string;
  recordVersion: number;
  requestedAction: string;
  sourceLane: string;
  targetLane: string;
  recordKind?: DiscordNotificationRecordKind;
  visibilityScope?: DiscordVisibilityScope;
  subjectLabel?: string | null;
  renderedFrom?: DiscordRenderedFrom;
  sentAt?: string;
  supersededAt?: string | null;
}): DiscordNotificationSpoolRecord {
  if (!Number.isInteger(input.recordVersion) || input.recordVersion < 1) {
    throw new HandoffSpoolError('Invalid recordVersion for Discord notification spool record.');
  }

  return {
    schemaVersion: HANDOFF_SPOOL_SCHEMA_VERSION,
    provider: 'discord',
    recordKind: input.recordKind ?? 'approval_card',
    messageId: assertNonEmptyString(input.messageId, 'messageId'),
    channelId: assertNonEmptyString(input.channelId, 'channelId'),
    handoffId: assertNonEmptyString(input.handoffId, 'handoffId'),
    recordVersion: input.recordVersion,
    requestedAction: assertNonEmptyString(input.requestedAction, 'requestedAction'),
    sourceLane: assertNonEmptyString(input.sourceLane, 'sourceLane'),
    targetLane: assertNonEmptyString(input.targetLane, 'targetLane'),
    visibilityScope: input.visibilityScope ?? 'approval_gate',
    subjectLabel: input.subjectLabel ?? null,
    renderedFrom: input.renderedFrom ?? 'ledger',
    sentAt: input.sentAt ?? new Date().toISOString(),
    consumedAt: null,
    decision: null,
    supersededAt: input.supersededAt ?? null,
  };
}

export function createQueuedApprovalIntentSpoolRecord(input: {
  interactionId: string;
  handoffId: string;
  handoffVersion: number;
  decision: HandoffApprovalDecision;
  actorId: string;
  createdAt?: string;
  providerEvent: {
    messageId: string;
    channelId?: string;
  };
  verification: {
    signatureVerified: boolean;
    timestamp: string;
  };
}): QueuedApprovalIntentSpoolRecord {
  if (!Number.isInteger(input.handoffVersion) || input.handoffVersion < 1) {
    throw new HandoffSpoolError('Invalid handoffVersion for queued approval intent spool record.');
  }

  return {
    schemaVersion: HANDOFF_SPOOL_SCHEMA_VERSION,
    provider: 'discord',
    intentId: `discord:${assertNonEmptyString(input.interactionId, 'interactionId')}`,
    interactionId: input.interactionId,
    handoffId: assertNonEmptyString(input.handoffId, 'handoffId'),
    handoffVersion: input.handoffVersion,
    decision: input.decision,
    actorId: assertNonEmptyString(input.actorId, 'actorId'),
    createdAt: input.createdAt ?? new Date().toISOString(),
    providerEvent: {
      messageId: assertNonEmptyString(input.providerEvent.messageId, 'providerEvent.messageId'),
      ...(input.providerEvent.channelId ? { channelId: input.providerEvent.channelId } : {}),
    },
    verification: {
      signatureVerified: input.verification.signatureVerified,
      timestamp: assertNonEmptyString(input.verification.timestamp, 'verification.timestamp'),
    },
  };
}

function ensureParentDirectory(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function parseJsonRecord(json: string, source: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch (err) {
    throw new HandoffSpoolError(`Malformed JSON in ${source}: ${(err as Error).message}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new HandoffSpoolError(`Invalid ${source}; expected object`);
  }

  return parsed as Record<string, unknown>;
}

function assertSchemaVersion(value: unknown, field: string): number {
  if (value !== HANDOFF_SPOOL_SCHEMA_VERSION) {
    throw new HandoffSpoolError(`Unsupported schemaVersion in ${field}`);
  }
  return HANDOFF_SPOOL_SCHEMA_VERSION;
}

function assertLiteral<T extends string>(value: unknown, expected: T, field: string): T {
  if (value !== expected) {
    throw new HandoffSpoolError(`Invalid ${field}`);
  }
  return expected;
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HandoffSpoolError(`Invalid or missing ${field}`);
  }
  return value;
}

function assertApprovalDecision(value: unknown, field: string): HandoffApprovalDecision {
  if (value !== 'approve' && value !== 'reject') {
    throw new HandoffSpoolError(`Invalid ${field}`);
  }
  return value;
}

function assertDiscordNotificationRecordKind(value: unknown, field: string): DiscordNotificationRecordKind {
  if (value !== 'approval_card' && value !== 'monitoring_card') {
    throw new HandoffSpoolError(`Invalid ${field}`);
  }
  return value;
}

function assertDiscordVisibilityScope(value: unknown, field: string): DiscordVisibilityScope {
  if (value !== 'approval_gate' && value !== 'windows_validation_status') {
    throw new HandoffSpoolError(`Invalid ${field}`);
  }
  return value;
}

function assertDiscordRenderedFrom(value: unknown, field: string): DiscordRenderedFrom {
  if (value !== 'ledger' && value !== 'spool_summary' && value !== 'mixed') {
    throw new HandoffSpoolError(`Invalid ${field}`);
  }
  return value;
}
