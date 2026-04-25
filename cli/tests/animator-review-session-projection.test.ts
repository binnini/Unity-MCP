import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  readAnimatorPendingReviewSessionSummariesFromDirectory,
  readAnimatorReviewSessionProjectionFromDirectory,
} from '../src/utils/animator-review-session-projection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const fixtureDir = path.join(repoRoot, 'cli/examples/specialists/v2/review-sessions/animator');

describe('animator review session file-based projection', () => {
  it('builds pending summaries from valid artifact files and filters malformed files', () => {
    const summaries = readAnimatorPendingReviewSessionSummariesFromDirectory(fixtureDir);

    expect(summaries).toEqual([
      {
        sessionId: 'animator-review-001',
        status: 'awaiting-feedback',
        summary: 'Prepared a draft review context anchored to the current attack clip timing.',
        focusedQuestion: 'Should the windup feel shorter, heavier, or unchanged?',
        updatedAt: '2026-04-25T12:00:00Z',
      },
      {
        sessionId: 'animator-review-002',
        status: 'revision-ready',
        summary: 'Feedback has been captured and converted into bounded controller revision tasks.',
        focusedQuestion: 'Should the stop transition be shortened without changing the clip set?',
        updatedAt: '2026-04-25T12:10:00Z',
      },
    ]);
  });

  it('returns a full session projection for a valid persisted artifact', () => {
    const result = readAnimatorReviewSessionProjectionFromDirectory(fixtureDir, 'animator-review-002');

    expect(result.error).toBeNull();
    expect(result.session).toEqual(
      expect.objectContaining({
        sessionId: 'animator-review-002',
        specialistId: 'animator',
        status: 'revision-ready',
        feedbackCaptured: 'Please tighten the stop transition and keep the same clip set.',
      })
    );
  });

  it('rejects unsafe session ids and malformed session artifacts', () => {
    expect(readAnimatorReviewSessionProjectionFromDirectory(fixtureDir, '../escape')).toEqual({
      session: null,
      error: {
        code: 'INVALID_REVIEW_SESSION_ID',
        message: 'review session id must use only letters, numbers, dot, underscore, or hyphen.',
      },
    });

    const malformed = readAnimatorReviewSessionProjectionFromDirectory(fixtureDir, 'malformed-missing-evidence');
    expect(malformed.session).toBeNull();
    expect(malformed.error).toEqual(
      expect.objectContaining({
        code: 'REVIEW_SESSION_INVALID',
      })
    );
    expect(malformed.error?.validationErrors?.map(error => error.path)).toContain('evidence');
  });
});
