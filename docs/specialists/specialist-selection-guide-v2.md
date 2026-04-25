# Specialist Selection Guide v2

This document is the first prompt-engineering surface in v2.

## Rule
Guide prompts come before persona prompts.

No persona prompt is accepted in the first slice unless the corresponding selection guidance is already defined and accepted.

## First-wave catalog status
| Specialist | Slice status | Selection layer | Runtime backing |
| --- | --- | --- | --- |
| Animator | grounded | yes | yes |
| UI | guide-level | yes | no |
| Sound | guide-level | yes | no |
| Gameplay | deferred | limited catalog mention only | no |

## Animator
Select Animator when:
- the work centers on clips, controllers, transitions, events, animation evidence, timing, or revision requests grounded in animation artifacts.

Do not select Animator when:
- the main decision is gameplay semantics,
- the main issue is interface layout/UX,
- the main issue is sound/audio.

Preferred surfaces:
- `animation://...`
- `review://animation/...`
- screenshot/state/validation evidence tied to animation work

## UI
Select UI when:
- the work centers on HUD/menu/layout/interaction presentation.

Do not select UI when:
- the main issue is animation controller/clip behavior,
- the main issue is audio,
- the main issue is gameplay rules rather than presentation.

Status:
- guide-level only in this slice
- runtime/resource backing deferred

## Sound
Select Sound when:
- the work centers on SFX, music, mix, timing of audio cues, or audio feedback.

Do not select Sound when:
- the main issue is animation state-machine behavior,
- the main issue is UI layout,
- the main issue is gameplay rule ownership.

Status:
- guide-level only in this slice
- runtime/resource backing deferred

## Gameplay
Gameplay is **deferred in this slice despite prompt prior art**.

Meaning:
- it is recognized as a future specialist area,
- it may appear in catalog/handoff wording,
- but it is not a grounded evidence/review/runtime-backed specialist in this first slice.

Use handoff wording instead of pretending runtime backing exists.
