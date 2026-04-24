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

describe('Animator read-only resources static contract', () => {
  it('registers the six Slice 3 resource routes', () => {
    const source = readResource();

    const routes = [
      'animation://controllers',
      'animation://controller/{path}',
      'animation://clips',
      'animation://clip/{path}',
      'animation://character/{id}',
      'review://animation/pending',
    ];

    for (const route of routes) {
      expect(source).toContain(`Route = "${route}"`);
    }
    expect([...source.matchAll(/Route = "([^"]+)"/g)].map((match) => match[1]).sort()).toEqual(
      [...routes].sort()
    );
    expect(source).toContain('[McpPluginResourceType]');
  });

  it('declares deterministic envelope and route schema fields', () => {
    const source = readResource();

    for (const field of ['items', 'item', 'warnings', 'error', 'sessions']) {
      expect(source).toContain(`JsonPropertyName("${field}")`);
    }

    for (const field of [
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
});
