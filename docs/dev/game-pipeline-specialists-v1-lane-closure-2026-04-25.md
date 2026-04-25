# Game Pipeline Specialists v1 lane closure (2026-04-25)

This note closes the `codex/game-pipeline-specialists-v1` validation lane after the Unity `6000.3.6f1` baseline promotion and the animator resource registration fix.

## Closed outcomes
- Animator read-only resource registration fix validated locally on Windows.
- Root/default Unity 6000 development baseline aligned to `6000.3.6f1`.
- CLI regression from `run-unity-tests.ps1` path resolution fixed.
- Remaining stale tracked `6000.3.1f1` cosmetic residue removed from unrelated versioned fixture metadata.

## Official CI evidence
- Repository: `binnini/Unity-MCP`
- Branch: `codex/game-pipeline-specialists-v1`
- Commit: `a7c8b7d8a6604b4ea6f359feaafc3ca9623dfc66`
- Official evidence run: `24923766564`

Run `24923766564` completed successfully across the CLI matrix and the Unity validation matrix, including `6000.3.6f1` standalone/editmode on both `base` and `windows-mono`.

## Duplicate run handling
- Duplicate non-blocking run: `24923772188`
- Classification: CI license activation flake noise

The duplicate run should not be used as blocker evidence for this lane. Its notable failure was a Unity license activation problem during `6000.3.6f1` standalone on `base`, not a code regression.

## Lane status
- Lane result: complete
- Final validation phrase: `animation resource registration fix validated on Windows`
- Remaining blocker: none in code for this lane

## Deferred follow-up only
- Unity license activation workflow stability can be improved later in a separate CI/workflow-stability slice.
