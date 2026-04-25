import {
  type HandoffRecord,
  readHandoffRecord,
} from './handoff-ledger.js';
import {
  listQueuedWindowsEvidenceSpoolRecords,
  type QueuedWindowsEvidenceSpoolRecord,
} from './windows-evidence-spool.js';

export type WindowsEvidenceRepresentativeStatus = 'pending_reconcile' | 'passed' | 'failed' | 'blocked';
export type WindowsEvidenceQueueState = 'pending' | 'pending_error' | 'reconciled';

export interface WindowsEvidenceRepresentativeSummary {
  handoffId: string;
  handoffVersion: number;
  representativeStatus: WindowsEvidenceRepresentativeStatus;
  latestOutcome: QueuedWindowsEvidenceSpoolRecord['outcome'];
  queueState: WindowsEvidenceQueueState;
  latestSourceLane: string;
  lastSubmittedAt: string;
  lastAppliedRecordVersion: number | null;
  ledgerRecordVersion: number | null;
  ledgerState: HandoffRecord['state'] | null;
  basedOn: 'spool_history';
  notes: string[];
  selectedRecordId: string;
}

const OUTCOME_SEVERITY: Record<QueuedWindowsEvidenceSpoolRecord['outcome'], number> = {
  blocked: 3,
  failed: 2,
  passed: 1,
};

export function deriveWindowsEvidenceSummaryForHandoff(
  projectPath: string,
  handoffId: string,
): WindowsEvidenceRepresentativeSummary | null {
  const records = listQueuedWindowsEvidenceSpoolRecords(projectPath).filter(record => record.handoffId === handoffId);
  return deriveWindowsEvidenceSummaryFromRecords(projectPath, handoffId, records);
}

export function deriveWindowsEvidenceSummaries(projectPath: string): WindowsEvidenceRepresentativeSummary[] {
  const grouped = new Map<string, QueuedWindowsEvidenceSpoolRecord[]>();
  for (const record of listQueuedWindowsEvidenceSpoolRecords(projectPath)) {
    const entries = grouped.get(record.handoffId);
    if (entries) {
      entries.push(record);
    } else {
      grouped.set(record.handoffId, [record]);
    }
  }

  return [...grouped.entries()]
    .map(([handoffId, records]) => deriveWindowsEvidenceSummaryFromRecords(projectPath, handoffId, records))
    .filter((summary): summary is WindowsEvidenceRepresentativeSummary => summary !== null)
    .sort((left, right) => compareIsoDesc(left.lastSubmittedAt, right.lastSubmittedAt) || left.handoffId.localeCompare(right.handoffId));
}

export function deriveWindowsEvidenceSummaryFromRecords(
  projectPath: string,
  handoffId: string,
  records: QueuedWindowsEvidenceSpoolRecord[],
): WindowsEvidenceRepresentativeSummary | null {
  if (records.length === 0) {
    return null;
  }

  const latestHandoffVersion = Math.max(...records.map(record => record.handoffVersion));
  const scopedRecords = records.filter(record => record.handoffVersion === latestHandoffVersion);
  const sortedRecords = [...scopedRecords].sort(compareRecordsForRepresentativeSelection);
  const selected = sortedRecords[0];

  if (!selected) {
    return null;
  }

  const pendingRecords = scopedRecords.filter(record => record.consumedAt === null);
  const latestPendingRecord = [...pendingRecords].sort(compareRecordsForRepresentativeSelection)[0] ?? null;
  const ledger = readOptionalHandoffRecord(projectPath, handoffId);
  const notes: string[] = [];

  if (!ledger) {
    notes.push('No matching handoff ledger record found; summary is spool-derived only.');
  } else if (ledger.recordVersion < latestHandoffVersion) {
    notes.push(`Handoff ledger version ${ledger.recordVersion} is behind latest Windows evidence version ${latestHandoffVersion}.`);
  }

  if (latestPendingRecord?.lastError) {
    notes.push(`Latest pending reconcile error: ${latestPendingRecord.lastError}`);
  }

  const representativeStatus: WindowsEvidenceRepresentativeStatus = latestPendingRecord
    ? 'pending_reconcile'
    : selected.outcome;

  const queueState: WindowsEvidenceQueueState = latestPendingRecord
    ? latestPendingRecord.lastError
      ? 'pending_error'
      : 'pending'
    : 'reconciled';

  return {
    handoffId,
    handoffVersion: latestHandoffVersion,
    representativeStatus,
    latestOutcome: selected.outcome,
    queueState,
    latestSourceLane: selected.sourceLaneId,
    lastSubmittedAt: selected.submittedAt,
    lastAppliedRecordVersion: selected.appliedRecordVersion,
    ledgerRecordVersion: ledger?.recordVersion ?? null,
    ledgerState: ledger?.state ?? null,
    basedOn: 'spool_history',
    notes,
    selectedRecordId: selected.recordId,
  };
}

function readOptionalHandoffRecord(projectPath: string, handoffId: string): HandoffRecord | null {
  try {
    return readHandoffRecord(projectPath, handoffId);
  } catch {
    return null;
  }
}

function compareRecordsForRepresentativeSelection(
  left: QueuedWindowsEvidenceSpoolRecord,
  right: QueuedWindowsEvidenceSpoolRecord,
): number {
  return compareIsoDesc(left.submittedAt, right.submittedAt)
    || OUTCOME_SEVERITY[right.outcome] - OUTCOME_SEVERITY[left.outcome]
    || right.recordId.localeCompare(left.recordId);
}

function compareIsoDesc(left: string, right: string): number {
  return Date.parse(right) - Date.parse(left);
}
