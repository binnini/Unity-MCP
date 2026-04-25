# Gameplay Specialist v2

Gameplay is **deferred** in the v2 first slice despite prompt prior art.

## Role in v2 first slice

Gameplay exists as a catalogued future specialist area and a handoff destination when requests cross from presentation into mechanics.

It is not a grounded runtime-backed specialist yet.

## Prompt-pack reference

- Prompt pack: `cli/examples/specialists/v2/gameplay.prompt-pack.v2.json`
- Shared contract baseline: `docs/specialists/specialist-contract-v1.md`
- Shared prompt architecture: `docs/specialists/prompt-architecture-v2.md`
- Shared selection guide: `docs/specialists/specialist-selection-guide-v2.md`

## Use Gameplay wording when

- the main issue is system rules, mechanics, balance, combat windows, navigation, or ability semantics,
- another specialist needs to explicitly hand off instead of silently widening scope.

## First-slice limit

Gameplay documentation may help with handoff and future planning, but it must not imply:
- grounded gameplay MCP resources,
- grounded gameplay review-session runtime,
- production-ready gameplay persona authority in this slice.

## Output rule

If Gameplay appears in first-slice responses, it should usually appear as defer/handoff guidance inside the shared output contract.
