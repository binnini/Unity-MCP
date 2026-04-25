import { Command } from 'commander';
import * as ui from '../../utils/ui.js';
import {
  loadHandoffBridgeConfig,
  sendDiscordMonitoringNotification,
  updateDiscordMonitoringNotification,
} from '../../utils/discord-approval.js';
import { readHandoffRecord } from '../../utils/handoff-ledger.js';
import {
  createDiscordNotificationSpoolRecord,
  findActiveDiscordMonitoringRecord,
  writeDiscordNotificationSpoolRecord,
} from '../../utils/handoff-spool.js';
import { deriveWindowsEvidenceSummaryForHandoff } from '../../utils/windows-evidence-summary.js';
import { resolveHandoffProjectPath } from './helpers.js';

interface HandoffPublishDiscordStatusOptions {
  path?: string;
  envFile?: string;
  scope: 'windows_validation_status';
  refreshMode?: 'existing' | 'upsert';
}

export function createHandoffPublishDiscordStatusCommand(): Command {
  return new Command('publish-discord-status')
    .description('Publish or refresh a leader-owned read-only Discord monitoring card for a known handoff')
    .argument('<handoff-id>', 'Leader-owned handoff id to render')
    .argument('[project-path]', 'Unity project path (defaults to cwd)')
    .option('--path <path>', 'Unity project path when handoff id is passed as the first positional argument')
    .requiredOption('--scope <scope>', 'Monitoring scope to render (windows_validation_status)', 'windows_validation_status')
    .option('--refresh-mode <mode>', 'Update an existing matching card or create one when missing (existing|upsert)', 'existing')
    .option('--env-file <path>', 'Optional env file containing UNITY_MCP_HANDOFF_* secrets')
    .action(async (handoffId: string, positionalPath: string | undefined, options: HandoffPublishDiscordStatusOptions) => {
      try {
        if (options.scope !== 'windows_validation_status') {
          throw new Error(`Unsupported monitoring scope: ${options.scope}`);
        }
        if (options.refreshMode !== 'existing' && options.refreshMode !== 'upsert') {
          throw new Error(`Unsupported refresh mode: ${String(options.refreshMode)}`);
        }

        const projectPath = resolveHandoffProjectPath(positionalPath, options);
        const record = readHandoffRecord(projectPath, handoffId);
        const summary = deriveWindowsEvidenceSummaryForHandoff(projectPath, handoffId);
        const config = loadHandoffBridgeConfig({ envFilePath: options.envFile });
        const subjectLabel = `${record.requestedAction} (${record.sourceLane} -> ${record.targetLane})`;
        const existing = findActiveDiscordMonitoringRecord(projectPath, {
          handoffId: record.handoffId,
          recordVersion: record.recordVersion,
          visibilityScope: options.scope,
        });

        const sentAt = new Date().toISOString();
        let messageId: string;
        let channelId: string;
        let spoolAction: 'published' | 'refreshed';

        if (existing) {
          const updated = await updateDiscordMonitoringNotification(config, {
            channelId: existing.channelId,
            messageId: existing.messageId,
            record,
            subjectLabel,
            scope: options.scope,
            summary,
          });
          messageId = updated.messageId;
          channelId = updated.channelId;
          spoolAction = 'refreshed';
        } else {
          if (options.refreshMode !== 'upsert') {
            throw new Error(`No active Discord monitoring card found for ${record.handoffId}@${record.recordVersion} (${options.scope}). Re-run with --refresh-mode upsert to create one.`);
          }
          const created = await sendDiscordMonitoringNotification(config, {
            record,
            subjectLabel,
            scope: options.scope,
            summary,
          });
          messageId = created.messageId;
          channelId = created.channelId;
          spoolAction = 'published';
        }

        const spoolFilePath = writeDiscordNotificationSpoolRecord(projectPath, createDiscordNotificationSpoolRecord({
          messageId,
          channelId,
          handoffId: record.handoffId,
          recordVersion: record.recordVersion,
          requestedAction: record.requestedAction,
          sourceLane: record.sourceLane,
          targetLane: record.targetLane,
          recordKind: 'monitoring_card',
          visibilityScope: options.scope,
          subjectLabel,
          renderedFrom: summary ? 'mixed' : 'ledger',
          sentAt,
        }));

        ui.heading('Unity-MCP Discord Monitoring Card');
        ui.label('Project', projectPath);
        ui.label('Handoff', record.handoffId);
        ui.label('Record version', String(record.recordVersion));
        ui.label('Scope', options.scope);
        ui.label('Refresh mode', options.refreshMode);
        ui.label('Discord message', messageId);
        ui.label('Spool file', spoolFilePath);
        ui.divider();
        ui.success(`Discord monitoring card ${spoolAction} for handoff ${record.handoffId}.`);
      } catch (err) {
        ui.error((err as Error).message || String(err));
        process.exit(1);
      }
    });
}
