import * as fs from 'fs';
import { Command } from 'commander';
import * as ui from '../../utils/ui.js';
import {
  createHandoffRecord,
  createLeaderWriter,
  getHandoffRecordFilePath,
  readHandoffRecord,
  transitionHandoffState,
  writeHandoffRecord,
} from '../../utils/handoff-ledger.js';
import { loadHandoffBridgeConfig } from '../../utils/discord-approval.js';
import { resolveHandoffProjectPath } from './helpers.js';

interface HandoffOpenApprovalOptions {
  path?: string;
  envFile?: string;
  leaderActor?: string;
  fromHandoff?: string;
  requestedAction?: string;
  sourceLane?: string;
  targetLane?: string;
  dispatchTarget?: string;
  evidenceRef?: string[];
  notes?: string;
}

export function createHandoffOpenApprovalCommand(): Command {
  return new Command('open-approval')
    .description('Create a new leader-owned approval gate handoff and open it in awaiting_approval')
    .argument('<handoff-id>', 'New leader-owned handoff id to create')
    .argument('[project-path]', 'Unity project path (defaults to cwd)')
    .option('--path <path>', 'Unity project path when handoff id is passed as the first positional argument')
    .option('--leader-actor <actor>', 'Override UNITY_MCP_HANDOFF_LEADER_ACTOR for this handoff')
    .option('--from-handoff <handoff-id>', 'Existing leader-owned handoff id to copy evidence refs from')
    .option('--requested-action <action>', 'Approval gate action label (default: verification_to_cicd)', 'verification_to_cicd')
    .option('--source-lane <lane>', 'Source lane label for the new approval gate')
    .option('--target-lane <lane>', 'Target lane label for the new approval gate', 'github-actions')
    .option('--dispatch-target <target>', 'Optional downstream dispatch target metadata')
    .option('--evidence-ref <ref>', 'Additional evidence ref to attach to the new approval gate', collectStrings, [])
    .option('--notes <notes>', 'Optional audit notes for the draft -> awaiting_approval transition')
    .option('--env-file <path>', 'Optional env file containing UNITY_MCP_HANDOFF_* settings')
    .action((handoffId: string, positionalPath: string | undefined, options: HandoffOpenApprovalOptions) => {
      try {
        const projectPath = resolveHandoffProjectPath(positionalPath, options);
        const recordFilePath = getHandoffRecordFilePath(projectPath, handoffId);
        if (fs.existsSync(recordFilePath)) {
          throw new Error(`A handoff record already exists for: ${handoffId}`);
        }

        const bridgeConfig = loadHandoffBridgeConfig({ envFilePath: options.envFile });
        const writer = createLeaderWriter(options.leaderActor ?? bridgeConfig.handoffLeaderActor);
        const sourceRecord = options.fromHandoff
          ? readHandoffRecord(projectPath, options.fromHandoff)
          : null;
        const evidenceRefs = [
          ...(sourceRecord?.evidenceRefs ?? []),
          ...(options.evidenceRef ?? []),
        ];
        const requestedAction = options.requestedAction ?? 'verification_to_cicd';
        const sourceLane = options.sourceLane ?? writer.actor;
        const transitionNotes = options.notes
          ?? (sourceRecord
            ? `opened approval gate from ${sourceRecord.handoffId}@${sourceRecord.recordVersion}`
            : 'opened approval gate');

        const draft = createHandoffRecord({
          handoffId,
          sourceLane,
          targetLane: options.targetLane ?? 'github-actions',
          requestedAction,
          createdBy: writer,
          evidenceRefs,
          downstreamDispatchTarget: options.dispatchTarget ?? null,
        });
        const awaitingApproval = transitionHandoffState(draft, writer, 'awaiting_approval', {
          notes: transitionNotes,
        });
        writeHandoffRecord(projectPath, writer, awaitingApproval);

        ui.heading('Unity-MCP Handoff Approval Gate');
        ui.label('Project', projectPath);
        ui.label('Handoff', awaitingApproval.handoffId);
        ui.label('State', awaitingApproval.state);
        ui.label('Requested action', awaitingApproval.requestedAction);
        ui.label('Route', `${awaitingApproval.sourceLane} -> ${awaitingApproval.targetLane}`);
        ui.label('Record version', String(awaitingApproval.recordVersion));
        ui.label('Evidence refs', String(awaitingApproval.evidenceRefs.length));
        ui.label('Leader actor', writer.actor);
        if (sourceRecord) {
          ui.label('Seeded from', `${sourceRecord.handoffId}@${sourceRecord.recordVersion}`);
        }
        if (awaitingApproval.downstreamDispatchTarget) {
          ui.label('Dispatch target', awaitingApproval.downstreamDispatchTarget);
        }
        ui.divider();
        ui.success(`Approval gate ${awaitingApproval.handoffId} opened in awaiting_approval.`);
      } catch (err) {
        ui.error((err as Error).message || String(err));
        process.exit(1);
      }
    });
}

function collectStrings(value: string, previous: string[]): string[] {
  return [...previous, value];
}
