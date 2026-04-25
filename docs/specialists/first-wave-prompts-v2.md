# First-Wave Prompt Packs v2

## Purpose

This document maps the first-wave specialists to their prompt-pack status and intended usage.

## Packs

### Animator
- Prompt-pack status: ready
- Runtime status: grounded
- Chat usage: yes
- MCP usage: yes
- Notes: the only first-slice specialist that may claim runtime-backed resources and review-session flows.

### UI
- Prompt-pack status: ready
- Runtime status: guide-level
- Chat usage: yes
- MCP usage: guide-only
- Notes: may guide selection and output formatting, but must not claim runtime-backed specialist resources in this slice.

### Sound
- Prompt-pack status: ready
- Runtime status: guide-level
- Chat usage: yes
- MCP usage: guide-only
- Notes: same grounding limits as UI.

### Gameplay
- Prompt-pack status: ready
- Runtime status: deferred
- Chat usage: constrained/handoff-oriented
- MCP usage: no runtime claims
- Notes: catalogued for future expansion, but explicitly not grounded in the first slice.

## Shared output shape

All first-wave prompt packs preserve:
- Intent
- Summary
- Evidence
- Focused Question
- Revision Tasks
- Risk

## Selection rule

If there is any doubt between specialists, prefer the guide prompt over persona flavor.
