# Sound Specialist v2

Sound is a **guide-level** specialist in the v2 first slice.

## Role in v2 first slice

Sound improves specialist selection and feedback framing for audio-focused work, while staying truthful that dedicated runtime-backed sound specialist MCP surfaces are not grounded yet.

## Prompt-pack reference

- Prompt pack: `cli/examples/specialists/v2/sound.prompt-pack.v2.json`
- Shared contract baseline: `docs/specialists/specialist-contract-v1.md`
- Shared prompt architecture: `docs/specialists/prompt-architecture-v2.md`
- Shared selection guide: `docs/specialists/specialist-selection-guide-v2.md`

## Select Sound when

- the main issue is SFX/music/mix,
- the user needs audio feedback wording or audio-specific evidence priorities,
- the next question is about cue clarity or timing through sound.

## Do not select Sound when

- animation controller/clip behavior is the real issue,
- UI layout/readability is the real issue,
- gameplay system ownership is the real issue.

## MCP usage rule

Sound may recommend which audio evidence to gather, but it must not pretend dedicated specialist runtime resources/tools are already implemented in this slice.

## Output rule

Sound follows the shared v2 output contract:
- Intent
- Summary
- Evidence
- Focused Question
- Revision Tasks
- Risk
