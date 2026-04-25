import {
  validateAnimatorReviewSessionArtifact,
  type AnimatorReviewSessionValidationError,
} from './specialist-contract.js';
import * as fs from 'fs';
import * as path from 'path';

export interface AnimatorReviewSessionSummary {
  sessionId: string;
  status: string;
  summary: string;
  focusedQuestion: string;
  updatedAt: string;
}

export interface AnimatorReviewSessionProjectionResult {
  session: Record<string, unknown> | null;
  error:
    | {
        code: 'INVALID_REVIEW_SESSION_ID' | 'REVIEW_SESSION_NOT_FOUND' | 'REVIEW_SESSION_INVALID';
        message: string;
        validationErrors?: AnimatorReviewSessionValidationError[];
      }
    | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeReviewSessionId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && !value.includes('..');
}

function readJsonObject(filePath: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readAnimatorPendingReviewSessionSummariesFromDirectory(
  rootDirectory: string
): AnimatorReviewSessionSummary[] {
  if (!fs.existsSync(rootDirectory) || !fs.statSync(rootDirectory).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(rootDirectory)
    .filter(entry => entry.endsWith('.json'))
    .map(entry => ({
      entry,
      sessionId: path.basename(entry, '.json'),
    }))
    .filter(item => isSafeReviewSessionId(item.sessionId))
    .map(item => {
      const payload = readJsonObject(path.join(rootDirectory, item.entry));
      if (!payload) return null;

      const validation = validateAnimatorReviewSessionArtifact(payload);
      if (!validation.valid) return null;

      return {
        sessionId: item.sessionId,
        status: String(payload.status),
        summary: String(payload.summary),
        focusedQuestion: String(payload.focusedQuestion),
        updatedAt: String(payload.updatedAt),
      } satisfies AnimatorReviewSessionSummary;
    })
    .filter((item): item is AnimatorReviewSessionSummary => item !== null)
    .sort((left, right) => {
      const byTime = left.updatedAt.localeCompare(right.updatedAt);
      if (byTime !== 0) return byTime;
      return left.sessionId.localeCompare(right.sessionId);
    });
}

export function readAnimatorReviewSessionProjectionFromDirectory(
  rootDirectory: string,
  sessionId: string
): AnimatorReviewSessionProjectionResult {
  if (!isSafeReviewSessionId(sessionId)) {
    return {
      session: null,
      error: {
        code: 'INVALID_REVIEW_SESSION_ID',
        message: 'review session id must use only letters, numbers, dot, underscore, or hyphen.',
      },
    };
  }

  const filePath = path.join(rootDirectory, `${sessionId}.json`);
  if (!fs.existsSync(filePath)) {
    return {
      session: null,
      error: {
        code: 'REVIEW_SESSION_NOT_FOUND',
        message: `Animator review session '${sessionId}' was not found under the provided artifact directory.`,
      },
    };
  }

  const payload = readJsonObject(filePath);
  if (!payload) {
    return {
      session: null,
      error: {
        code: 'REVIEW_SESSION_INVALID',
        message: `Animator review session '${sessionId}' could not be parsed.`,
      },
    };
  }

  const validation = validateAnimatorReviewSessionArtifact(payload);
  if (!validation.valid) {
    return {
      session: null,
      error: {
        code: 'REVIEW_SESSION_INVALID',
        message: `Animator review session '${sessionId}' is invalid.`,
        validationErrors: validation.errors,
      },
    };
  }

  return {
    session: payload,
    error: null,
  };
}
