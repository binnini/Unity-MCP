import { Command } from 'commander';
import * as ui from '../../utils/ui.js';
import {
  HANDOFF_STATES,
  type HandoffState,
  createLeaderWriter,
  readHandoffRecord,
  transitionHandoffState,
  writeHandoffRecord,
} from '../../utils/handoff-ledger.js';
import { loadHandoffBridgeConfig } from '../../utils/discord-approval.js';
import { resolveHandoffProjectPath } from './helpers.js';

interface HandoffTransitionOptions {
  path?: string;
  envFile?: string;
  leaderActor?: string;
  to: HandoffState;
  notes?: string;
}

export function createHandoffTransitionCommand(): Command {
  return new Command('transition')
    .description('Transition a leader-owned handoff record to another allowed lifecycle state')
    .argument('<handoff-id>', 'Leader-owned handoff id to transition')
    .argument('[project-path]', 'Unity project path (defaults to cwd)')
    .option('--path <path>', 'Unity project path when handoff id is passed as the first positional argument')
    .requiredOption('--to <state>', `Next handoff state (${HANDOFF_STATES.join('|')})`)
    .option('--leader-actor <actor>', 'Override UNITY_MCP_HANDOFF_LEADER_ACTOR for this transition')
    .option('--notes <notes>', 'Optional audit notes for the transition')
    .option('--env-file <path>', 'Optional env file containing UNITY_MCP_HANDOFF_* settings')
    .action((handoffId: string, positionalPath: string | undefined, options: HandoffTransitionOptions) => {
      try {
        const projectPath = resolveHandoffProjectPath(positionalPath, options);
        if (!HANDOFF_STATES.includes(options.to)) {
          throw new Error(`Unsupported handoff state: ${String(options.to)}`);
        }

        const bridgeConfig = loadHandoffBridgeConfig({ envFilePath: options.envFile });
        const writer = createLeaderWriter(options.leaderActor ?? bridgeConfig.handoffLeaderActor);
        const record = readHandoffRecord(projectPath, handoffId);
        const nextRecord = transitionHandoffState(record, writer, options.to, {
          notes: options.notes,
        });
        writeHandoffRecord(projectPath, writer, nextRecord);

        ui.heading('Unity-MCP Handoff Transition');
        ui.label('Project', projectPath);
        ui.label('Handoff', nextRecord.handoffId);
        ui.label('From', record.state);
        ui.label('To', nextRecord.state);
        ui.label('Record version', String(nextRecord.recordVersion));
        ui.label('Leader actor', writer.actor);
        if (options.notes) {
          ui.label('Notes', options.notes);
        }
        ui.divider();
        ui.success(`Handoff ${nextRecord.handoffId} transitioned to ${nextRecord.state}.`);
      } catch (err) {
        ui.error((err as Error).message || String(err));
        process.exit(1);
      }
    });
}
