import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('run-unity-tests PowerShell helper', () => {
  it('uses a valid TimeSpan format string for compile-mode duration output', () => {
    const scriptPath = path.resolve('commands', 'run-unity-tests.ps1');
    const script = fs.readFileSync(scriptPath, 'utf-8');

    expect(script).toContain("Duration: $($duration.ToString('mm\\:ss'))");
    expect(script).not.toContain("Duration: $($duration.ToString('mm\\\\:ss'))");
  });

  it('exposes compile mode as a first-class validation path', () => {
    const scriptPath = path.resolve('commands', 'run-unity-tests.ps1');
    const script = fs.readFileSync(scriptPath, 'utf-8');

    expect(script).toContain("[ValidateSet('compile', 'editmode', 'playmode', 'standalone', 'all')]");
    expect(script).toContain('"compile" { @("Compile") }');
    expect(script).toContain('ResultKind   = "compile"');
  });
});
