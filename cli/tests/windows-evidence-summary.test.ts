import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createHandoffRecord, createLeaderWriter, writeHandoffRecord } from '../src/utils/handoff-ledger.js';
import { reconcileQueuedWindowsEvidence, submitQueuedWindowsEvidence } from '../src/utils/windows-evidence-reconcile.js';
import {
  deriveWindowsEvidenceSummaryForHandoff,
  deriveWindowsEvidenceSummaries,
} from '../src/utils/windows-evidence-summary.js';

const tempDirs: string[] = [];

function makeProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unity-mcp-windows-evidence-summary-'));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'Assets'), { recursive: true });
  return dir;
}

function makeEnvelope(input: {
  handoffId?: string;
  handoffVersion?: number;
  submittedAt: string;
  outcome: 'passed' | 'failed' | 'blocked';
  laneId?: string;
  summary?: string;
}) {
  return {
    schemaVersion: 1,
    kind: 'windows_lane_evidence_envelope',
    handoffId: input.handoffId ?? 'handoff-1',
    handoffVersion: input.handoffVersion ?? 1,
    sourceLane: {
      kind: 'windows_codex',
      laneId: input.laneId ?? 'windows-runner-1',
    },
    submittedAt: input.submittedAt,
    outcome: input.outcome,
    summary: input.summary ?? `Outcome: ${input.outcome}`,
    evidenceRefs: [
      {
        type: 'log',
        uri: `file:///tmp/${input.outcome}-${input.submittedAt}.log`,
      },
    ],
  } as const;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('windows evidence summary', () => {
  it('returns pending_reconcile from spool history even when no ledger record exists', () => {
    const projectPath = makeProject();
    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      submittedAt: '2026-04-25T02:00:00.000Z',
      outcome: 'passed',
    }));

    const summary = deriveWindowsEvidenceSummaryForHandoff(projectPath, 'handoff-1');

    expect(summary).toMatchObject({
      handoffId: 'handoff-1',
      handoffVersion: 1,
      representativeStatus: 'pending_reconcile',
      queueState: 'pending',
      latestOutcome: 'passed',
      ledgerRecordVersion: null,
      basedOn: 'spool_history',
    });
    expect(summary?.notes).toContain('No matching handoff ledger record found; summary is spool-derived only.');
  });

  it('prefers the latest handoffVersion and latest submittedAt within that version', () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    writeHandoffRecord(projectPath, writer, createHandoffRecord({
      handoffId: 'handoff-1',
      sourceLane: 'windows-codex',
      targetLane: 'mac-omx-leader',
      requestedAction: 'verification -> CI/CD',
      createdBy: writer,
    }));

    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      handoffVersion: 1,
      submittedAt: '2026-04-25T01:00:00.000Z',
      outcome: 'passed',
    }));
    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      handoffVersion: 2,
      submittedAt: '2026-04-25T02:00:00.000Z',
      outcome: 'failed',
    }));
    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      handoffVersion: 2,
      submittedAt: '2026-04-25T03:00:00.000Z',
      outcome: 'passed',
    }));
    reconcileQueuedWindowsEvidence({
      projectPath,
      leaderActor: 'mac-omx-leader',
    });

    const summary = deriveWindowsEvidenceSummaryForHandoff(projectPath, 'handoff-1');

    expect(summary).toMatchObject({
      handoffVersion: 2,
      representativeStatus: 'passed',
      queueState: 'reconciled',
      latestOutcome: 'passed',
      lastSubmittedAt: '2026-04-25T03:00:00.000Z',
    });
  });

  it('surfaces pending_error when latest version still has queued error state', () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    writeHandoffRecord(projectPath, writer, createHandoffRecord({
      handoffId: 'handoff-1',
      sourceLane: 'windows-codex',
      targetLane: 'mac-omx-leader',
      requestedAction: 'verification -> CI/CD',
      createdBy: writer,
    }));

    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      handoffVersion: 3,
      submittedAt: '2026-04-25T04:00:00.000Z',
      outcome: 'blocked',
    }));
    reconcileQueuedWindowsEvidence({
      projectPath,
      leaderActor: 'mac-omx-leader',
    });

    const summary = deriveWindowsEvidenceSummaryForHandoff(projectPath, 'handoff-1');

    expect(summary).toMatchObject({
      handoffVersion: 3,
      representativeStatus: 'pending_reconcile',
      queueState: 'pending_error',
      latestOutcome: 'blocked',
    });
    expect(summary?.notes.join('\n')).toContain('Latest pending reconcile error');
  });

  it('keeps deterministic ordering across multiple handoffs', () => {
    const projectPath = makeProject();
    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      handoffId: 'handoff-a',
      submittedAt: '2026-04-25T01:00:00.000Z',
      outcome: 'passed',
    }));
    submitQueuedWindowsEvidence(projectPath, makeEnvelope({
      handoffId: 'handoff-b',
      submittedAt: '2026-04-25T02:00:00.000Z',
      outcome: 'failed',
    }));

    const summaries = deriveWindowsEvidenceSummaries(projectPath);

    expect(summaries.map(summary => summary.handoffId)).toEqual(['handoff-b', 'handoff-a']);
  });
});
