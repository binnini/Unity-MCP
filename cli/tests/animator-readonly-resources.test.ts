import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const resourcePath = path.join(
  repoRoot,
  'Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/Animation.cs'
);

function readResource(): string {
  return fs.readFileSync(resourcePath, 'utf-8');
}

function readResourceTypeSlices(source: string): Array<{ name: string; body: string }> {
  return source
    .split('[McpPluginResourceType]')
    .slice(1)
    .map((slice) => `[McpPluginResourceType]${slice}`)
    .map((body) => ({
      name: body.match(/public class (Resource_[A-Za-z0-9_]+)/)?.[1] ?? '',
      body,
    }))
    .filter((slice) => slice.name.startsWith('Resource_'));
}

describe('Animator read-only resources static contract', () => {
  it('registers the seven Slice 3/v2-first-slice resource routes', () => {
    const source = readResource();

    const routes = [
      'animation://controllers',
      'animation://controller/{path}',
      'animation://clips',
      'animation://clip/{path}',
      'animation://character/{id}',
      'review://animation/pending',
      'review://animation/session/{sessionId}',
    ];

    for (const route of routes) {
      expect(source).toContain(`Route = "${route}"`);
    }
    expect([...source.matchAll(/Route = "([^"]+)"/g)].map((match) => match[1]).sort()).toEqual(
      [...routes].sort()
    );
    expect(source.match(/\[McpPluginResourceType\]/g)?.length).toBe(7);
  });

  it('keeps one MCP resource entry point per resource type for assembly scanning', () => {
    const source = readResource();
    const typeBodies = readResourceTypeSlices(source);

    expect(typeBodies.map((match) => match.name).sort()).toEqual([
      'Resource_AnimationCharacter',
      'Resource_AnimationClip',
      'Resource_AnimationClips',
      'Resource_AnimationController',
      'Resource_AnimationControllers',
      'Resource_AnimationPendingReviews',
      'Resource_AnimationReviewSession',
    ]);

    for (const match of typeBodies) {
      expect(match.body.match(/\[McpPluginResource\s/g)?.length).toBe(1);
    }
  });

  it('declares ListResources for every MCP resource entry point required by the packaged builder', () => {
    const source = readResource();

    const requiredListMethods = [
      'AnimationControllersRouteAll',
      'AnimationControllersAll',
      'AnimationClipsRouteAll',
      'AnimationClipsAll',
      'AnimationCharactersAll',
      'PendingReviewsAll',
      'AnimationReviewSessionsAll',
    ];

    for (const methodName of requiredListMethods) {
      expect(source).toContain(`ListResources = nameof(${methodName})`);
      expect(source).toContain(`ResponseListResource[] ${methodName}(`);
    }
  });

  it('declares deterministic envelope and route schema fields', () => {
    const source = readResource();

    for (const field of ['items', 'item', 'warnings', 'error', 'sessions']) {
      expect(source).toContain(`JsonPropertyName("${field}")`);
    }

    for (const field of [
      'sessionId',
      'specialistId',
      'status',
      'targetRefs',
      'intentRestatement',
      'summary',
      'evidence',
      'focusedQuestion',
      'riskNote',
      'updatedAt',
      'feedbackCaptured',
      'revisionTasks',
      'category',
      'source',
      'action',
      'acceptance',
      'path',
      'name',
      'layerCount',
      'parameterCount',
      'stateCount',
      'clipCount',
      'layers',
      'parameters',
      'states',
      'linkedClips',
      'length',
      'frameRate',
      'wrapMode',
      'eventCount',
      'legacy',
      'humanMotion',
      'gameObjectPath',
      'animatorPresent',
      'controllerPath',
      'avatarIsValid',
    ]) {
      expect(source).toContain(`JsonPropertyName("${field}")`);
    }
    expect(source).toContain('public ClipListItem[] LinkedClips');
    expect(source).toContain('public ReviewSessionSummaryItem[] Sessions');
    expect(source).toContain('public ReviewSessionRevisionTaskItem[] RevisionTasks');
  });

  it('keeps the implementation out of tool/setup/runtime projection surfaces', () => {
    const source = readResource();

    expect(source).not.toContain('McpPluginTool');
    expect(source).not.toContain('UNITY_MCP_TOOLS');
    expect(source).not.toContain('setup-mcp');
  });

  it('keeps the resource implementation read-only', () => {
    const source = readResource();
    const forbidden = [
      'Create' + 'Asset',
      'Save' + 'Assets',
      'Undo' + '.',
      'Save' + 'Scene',
      'Set' + 'Dirty',
      'PrefabUtility' + '.Save',
    ];

    for (const token of forbidden) {
      expect(source).not.toContain(token);
    }
  });

  it('does not implement bus runtime behavior', () => {
    const source = readResource();
    const forbidden = [
      'queue',
      'scheduler',
      'mailbox',
      'dispatch',
      'polling',
      'lifecycleOwner',
    ];

    for (const token of forbidden) {
      expect(source.toLowerCase()).not.toContain(token.toLowerCase());
    }
  });

  it('bounds review-session file resolution to the animator artifact directory', () => {
    const source = readResource();

    expect(source).toContain('Path.GetInvalidFileNameChars()');
    expect(source).toContain('Path.GetFullPath');
    expect(source).toContain('.omx", "state", "specialists", "review-sessions", "animator"');
    expect(source).toContain("Path.GetFileNameWithoutExtension(filePath)");
    expect(source).toContain('ValidateReviewSessionPayload');
    expect(source).toContain("specialistId 'animator'");
    expect(source).toContain('AllowedReviewEvidenceCategories');
    expect(source).toContain("char.IsLetterOrDigit(ch) || ch == '.' || ch == '_' || ch == '-'");
  });
});
