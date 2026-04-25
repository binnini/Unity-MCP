import { Command } from 'commander';
import * as ui from '../../utils/ui.js';
import { listQueuedWindowsEvidenceSpoolRecords } from '../../utils/windows-evidence-spool.js';
import {
  deriveWindowsEvidenceSummaries,
  deriveWindowsEvidenceSummaryForHandoff,
} from '../../utils/windows-evidence-summary.js';
import { resolveHandoffProjectPath } from './helpers.js';

interface HandoffListWindowsEvidenceOptions {
  path?: string;
  handoffId?: string;
  summary?: boolean;
}

export function createHandoffListWindowsEvidenceCommand(): Command {
  return new Command('list-windows-evidence')
    .description('List queued Windows evidence spool records and their reconcile status')
    .argument('[project-path]', 'Unity project path (defaults to cwd)')
    .option('--path <path>', 'Unity project path when not passed positionally')
    .option('--handoff-id <handoffId>', 'Only show records for one handoff id')
    .option('--summary', 'Show a derived read-only operator summary from Windows evidence spool history')
    .action((positionalPath: string | undefined, options: HandoffListWindowsEvidenceOptions) => {
      try {
        const projectPath = resolveHandoffProjectPath(positionalPath, options);

        if (options.summary) {
          const summaries = options.handoffId
            ? [deriveWindowsEvidenceSummaryForHandoff(projectPath, options.handoffId)].filter(summary => summary !== null)
            : deriveWindowsEvidenceSummaries(projectPath);

          ui.heading('Unity-MCP Windows Evidence Summary');
          ui.label('Project', projectPath);
          ui.label('Records', String(summaries.length));
          ui.label('Mode', 'derived summary (read-only, spool-history scoped)');
          if (options.handoffId) {
            ui.label('Handoff filter', options.handoffId);
          }
          ui.divider();

          if (summaries.length === 0) {
            if (options.handoffId) {
              ui.info(`No Windows evidence history found for handoff: ${options.handoffId}`);
            } else {
              ui.info('No Windows evidence history found.');
            }
            return;
          }

          for (const summary of summaries) {
            ui.info(
              `${summary.handoffId}@${summary.handoffVersion} — ${summary.latestSourceLane} — `
              + `${summary.representativeStatus} — queue:${summary.queueState} — submitted:${summary.lastSubmittedAt}`,
            );
            if (summary.notes.length > 0) {
              for (const note of summary.notes) {
                ui.label('Note', note);
              }
            }
          }
          return;
        }

        const records = listQueuedWindowsEvidenceSpoolRecords(projectPath)
          .filter(record => !options.handoffId || record.handoffId === options.handoffId);

        ui.heading('Unity-MCP Windows Evidence Queue');
        ui.label('Project', projectPath);
        ui.label('Records', String(records.length));
        if (options.handoffId) {
          ui.label('Handoff filter', options.handoffId);
        }
        ui.divider();

        if (records.length === 0) {
          ui.info('No queued Windows evidence records found.');
          return;
        }

        for (const record of records) {
          const status = record.consumedAt
            ? `applied@${record.appliedRecordVersion ?? '?'}`
            : record.lastError
              ? `pending-error:${record.lastError}`
              : 'pending';
          ui.info(`${record.handoffId}@${record.handoffVersion} — ${record.sourceLaneId} — ${record.outcome} — ${status}`);
        }
      } catch (err) {
        ui.error((err as Error).message || String(err));
        process.exit(1);
      }
    });
}
