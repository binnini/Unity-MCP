import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(repoRoot, 'commands', 'run-unity-tests.ps1');

describe('run-unity-tests PowerShell helper', () => {
  it('uses a valid TimeSpan format string for compile-mode duration output', () => {
    const script = fs.readFileSync(scriptPath, 'utf-8');

    expect(script).toContain("Duration: $($duration.ToString('mm\\:ss'))");
    expect(script).not.toContain("Duration: $($duration.ToString('mm\\\\:ss'))");
  });

  it('exposes compile mode as a first-class validation path', () => {
    const script = fs.readFileSync(scriptPath, 'utf-8');

    expect(script).toContain("[ValidateSet('compile', 'editmode', 'playmode', 'standalone', 'survival', 'all')]");
    expect(script).toContain('"compile" { @("Compile") }');
    expect(script).toContain('ResultKind   = "compile"');
  });

  it('supports forwarding an optional Unity test filter to focused editmode runs', () => {
    const script = fs.readFileSync(scriptPath, 'utf-8');

    expect(script).toContain('[string]$TestFilter');
    expect(script).toContain('@("-testFilter", "`"$TestFilter`"")');
    expect(script).toContain('-TestFilter $TestFilter');
  });

  it('exposes the survival executeMethod lane for environments where -runTests XML is unreliable', () => {
    const script = fs.readFileSync(scriptPath, 'utf-8');

    expect(script).toContain('"survival" { @("Survival") }');
    expect(script).toContain('Invoke-UnityExecuteMethodCheck');
    expect(script).toContain('com.IvanMurzak.Unity.MCP.Editor.Tests.SkillsGenerateSurvivalBatchRunner.Run');
    expect(script).toContain('ResultKind   = "executeMethod"');
  });
});
