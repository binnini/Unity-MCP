import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createHandoffRecord, createLeaderWriter, readHandoffRecord, transitionHandoffState, writeHandoffRecord } from '../src/utils/handoff-ledger.js';
import { runCliAsync } from './helpers/cli.js';

const tempDirs: string[] = [];

function makeProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unity-mcp-handoff-cli-'));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'Assets'), { recursive: true });
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('handoff command surface', () => {
  it('shows the handoff subcommands in help output', async () => {
    const result = await runCliAsync(['handoff', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('serve');
    expect(result.stdout).toContain('notify-discord');
    expect(result.stdout).toContain('publish-discord-status');
    expect(result.stdout).toContain('transition');
    expect(result.stdout).toContain('open-approval');
    expect(result.stdout).toContain('dispatch-approved');
    expect(result.stdout).toContain('submit-windows-evidence');
    expect(result.stdout).toContain('list-windows-evidence');
    expect(result.stdout).toContain('reconcile-windows-evidence');
    expect(result.stdout).not.toContain('submit-assignment');
    expect(result.stdout).not.toContain('poll-windows-evidence');
  });

  it('queues and reconciles Windows evidence through the CLI', async () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    writeHandoffRecord(projectPath, writer, createHandoffRecord({
      handoffId: 'handoff-1',
      sourceLane: 'windows-codex',
      targetLane: 'mac-omx-leader',
      requestedAction: 'verification -> CI/CD',
      createdBy: writer,
    }));

    const evidencePath = path.join(projectPath, 'windows-evidence.json');
    fs.writeFileSync(evidencePath, JSON.stringify({
      schemaVersion: 1,
      kind: 'windows_lane_evidence_envelope',
      handoffId: 'handoff-1',
      handoffVersion: 1,
      sourceLane: {
        kind: 'windows_codex',
        laneId: 'windows-runner-1',
      },
      submittedAt: '2026-04-24T00:00:00.000Z',
      outcome: 'passed',
      summary: 'CLI integration evidence',
      evidenceRefs: [
        {
          type: 'note',
          uri: 'file:///tmp/windows-evidence-note.txt',
        },
      ],
    }, null, 2));

    const submit = await runCliAsync(['handoff', 'submit-windows-evidence', '--path', projectPath, '--input-file', evidencePath]);
    expect(submit.exitCode).toBe(0);
    expect(submit.stdout).toContain('Queued Windows evidence');

    const reconcile = await runCliAsync(['handoff', 'reconcile-windows-evidence', '--path', projectPath, '--leader-actor', 'mac-omx-leader']);
    expect(reconcile.exitCode).toBe(0);
    expect(reconcile.stdout).toContain('APPLIED handoff-1@1');
    expect(readHandoffRecord(projectPath, 'handoff-1').evidenceRefs).toEqual([
      'note:file:///tmp/windows-evidence-note.txt',
    ]);
  });

  it('lists queued Windows evidence through the CLI', async () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    writeHandoffRecord(projectPath, writer, createHandoffRecord({
      handoffId: 'handoff-2',
      sourceLane: 'windows-codex',
      targetLane: 'mac-omx-leader',
      requestedAction: 'verification -> CI/CD',
      createdBy: writer,
    }));

    const evidencePath = path.join(projectPath, 'windows-evidence-list.json');
    fs.writeFileSync(evidencePath, JSON.stringify({
      schemaVersion: 1,
      kind: 'windows_lane_evidence_envelope',
      handoffId: 'handoff-2',
      handoffVersion: 1,
      sourceLane: {
        kind: 'windows_codex',
        laneId: 'windows-runner-2',
      },
      submittedAt: '2026-04-24T00:00:00.000Z',
      outcome: 'blocked',
      summary: 'Waiting on Unity editor lock.',
      evidenceRefs: [
        {
          type: 'log',
          uri: 'file:///tmp/windows-evidence-log.txt',
        },
      ],
    }, null, 2));

    await runCliAsync(['handoff', 'submit-windows-evidence', '--path', projectPath, '--input-file', evidencePath]);
    const list = await runCliAsync(['handoff', 'list-windows-evidence', '--path', projectPath]);
    expect(list.exitCode).toBe(0);
    expect(list.stdout).toContain('handoff-2@1');
    expect(list.stdout).toContain('windows-runner-2');
    expect(list.stdout).toContain('blocked');
    expect(list.stdout).toContain('pending');
  });

  it('shows a derived read-only summary for Windows evidence history', async () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    writeHandoffRecord(projectPath, writer, createHandoffRecord({
      handoffId: 'handoff-3',
      sourceLane: 'windows-codex',
      targetLane: 'mac-omx-leader',
      requestedAction: 'verification -> CI/CD',
      createdBy: writer,
    }));

    const evidencePath = path.join(projectPath, 'windows-evidence-summary.json');
    fs.writeFileSync(evidencePath, JSON.stringify({
      schemaVersion: 1,
      kind: 'windows_lane_evidence_envelope',
      handoffId: 'handoff-3',
      handoffVersion: 1,
      sourceLane: {
        kind: 'windows_codex',
        laneId: 'windows-runner-3',
      },
      submittedAt: '2026-04-24T00:00:00.000Z',
      outcome: 'passed',
      summary: 'Summary evidence',
      evidenceRefs: [
        {
          type: 'note',
          uri: 'file:///tmp/windows-evidence-summary.txt',
        },
      ],
    }, null, 2));

    await runCliAsync(['handoff', 'submit-windows-evidence', '--path', projectPath, '--input-file', evidencePath]);
    const list = await runCliAsync(['handoff', 'list-windows-evidence', '--path', projectPath, '--summary', '--handoff-id', 'handoff-3']);
    expect(list.exitCode).toBe(0);
    expect(list.stdout).toContain('Unity-MCP Windows Evidence Summary');
    expect(list.stdout).toContain('derived summary');
    expect(list.stdout).toContain('handoff-3@1');
    expect(list.stdout).toContain('pending_reconcile');
    expect(list.stdout).toContain('queue:pending');
  });

  it('prints a deterministic no-history message in summary mode', async () => {
    const projectPath = makeProject();

    const list = await runCliAsync(['handoff', 'list-windows-evidence', '--path', projectPath, '--summary', '--handoff-id', 'missing-handoff']);
    expect(list.exitCode).toBe(0);
    expect(list.stdout).toContain('No Windows evidence history found for handoff: missing-handoff');
  });

  it('transitions a leader-owned handoff through the CLI', async () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    writeHandoffRecord(projectPath, writer, createHandoffRecord({
      handoffId: 'handoff-transition-1',
      sourceLane: 'mac-omx-leader',
      targetLane: 'windows-codex',
      requestedAction: 'prepare approval gate',
      createdBy: writer,
    }));

    const result = await runCliAsync([
      'handoff',
      'transition',
      'handoff-transition-1',
      '--path',
      projectPath,
      '--to',
      'awaiting_approval',
      '--leader-actor',
      'mac-omx-leader',
      '--notes',
      'ready for review',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('transitioned to awaiting_approval');
    expect(readHandoffRecord(projectPath, 'handoff-transition-1')).toMatchObject({
      state: 'awaiting_approval',
      recordVersion: 2,
    });
  });

  it('opens a verification_to_cicd approval gate from an existing handoff', async () => {
    const projectPath = makeProject();
    const writer = createLeaderWriter('mac-omx-leader');
    const draft = createHandoffRecord({
      handoffId: 'verification-handoff-1',
      sourceLane: 'windows-codex',
      targetLane: 'mac-omx-leader',
      requestedAction: 'Run Windows validation and reconcile bounded evidence.',
      createdBy: writer,
      evidenceRefs: ['note:file:///tmp/verification-summary.md'],
    });
    const source = transitionHandoffState(transitionHandoffState(draft, writer, 'awaiting_approval'), writer, 'reconcile_needed', {
      notes: 'windows evidence applied',
    });
    writeHandoffRecord(projectPath, writer, source);

    const result = await runCliAsync([
      'handoff',
      'open-approval',
      'verification-gate-1',
      '--path',
      projectPath,
      '--leader-actor',
      'mac-omx-leader',
      '--from-handoff',
      'verification-handoff-1',
      '--dispatch-target',
      'owner/repo',
      '--notes',
      'promote verified work to CI/CD approval',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('opened in awaiting_approval');
    expect(readHandoffRecord(projectPath, 'verification-gate-1')).toMatchObject({
      state: 'awaiting_approval',
      requestedAction: 'verification_to_cicd',
      targetLane: 'github-actions',
      downstreamDispatchTarget: 'owner/repo',
      evidenceRefs: ['note:file:///tmp/verification-summary.md'],
    });
  });
});
