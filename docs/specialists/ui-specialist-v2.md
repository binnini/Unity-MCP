# UI Specialist v2

UI is a **guide-level** specialist in the v2 first slice.

## Role in v2 first slice

UI exists to improve specialist selection, reporting shape, and handoff quality for presentation-focused work.

It does **not** claim runtime-backed specialist MCP surfaces in this slice.

## Prompt-pack reference

- Prompt pack: `cli/examples/specialists/v2/ui.prompt-pack.v2.json`
- Shared contract baseline: `docs/specialists/specialist-contract-v1.md`
- Shared prompt architecture: `docs/specialists/prompt-architecture-v2.md`
- Shared selection guide: `docs/specialists/specialist-selection-guide-v2.md`

## Select UI when

- the main problem is HUD/menu/layout clarity,
- the user needs presentation-focused feedback,
- the next step is better UI evidence gathering or UI-specific revision framing.

## Do not select UI when

- animation timing/controller state is the real owner,
- audio clarity/mix/cue timing is the real owner,
- gameplay semantics or system rules are the real owner.

## MCP usage rule

UI may guide **how** to use MCP evidence in this slice, but it must not imply dedicated UI specialist resources/tools already exist.

Use it as a routing and framing layer, not as a grounded runtime surface.

## Output rule

UI follows the shared v2 output contract:
- Intent
- Summary
- Evidence
- Focused Question
- Revision Tasks
- Risk
