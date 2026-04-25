# MCP Usage Guide Execution Rules v2

## Purpose

This document defines how first-wave specialists should execute MCP evidence gathering in the v2 first slice without overstating runtime support.

It turns guide-level prompt advice into concrete execution rules for:
- grounded specialist usage,
- guide-level specialist usage,
- deferred specialist handling,
- and evidence-first reporting.

## First-slice truthfulness baseline

- **Animator** is the only grounded/runtime-backed specialist.
- **UI** and **Sound** may guide MCP usage, but they do not own dedicated specialist runtime surfaces in this slice.
- **Gameplay** is deferred and may only appear through handoff/defer wording.

## Core execution rule

When MCP usage is involved:
1. select the specialist through the guide prompt,
2. consume `preferredEvidence` before freestyle exploration,
3. use only truthful runtime-backed surfaces,
4. preserve the shared output contract while reporting findings,
5. hand off instead of widening scope when the evidence path leaves the active specialist lane.

## Surface classes

### Runtime-backed specialist surfaces
These are grounded MCP resources/tools already supported by the current implementation.

In the first slice, this means:
- Animator resources such as `animation://...`
- Animator review-session resources such as `review://animation/...`

### Guide-only evidence surfaces
These are evidence hints or evidence priorities that may be recommended without implying specialist runtime ownership.

Examples:
- `screenshot-game-view`
- `tests-run`
- UI screenshots
- audio notes
- interaction notes

### Forbidden imagined surfaces
These are specialist-specific runtime claims that do not exist in the first slice.

Examples:
- dedicated UI specialist MCP resources
- dedicated Sound specialist MCP resources
- grounded Gameplay specialist review-session routes
- specialist execution queues/schedulers/mailboxes

## Execution rules by specialist status

### Animator (grounded)
Animator may:
- prioritize grounded Animator resources first,
- use review-session projections when the task is evidence-linked review work,
- use screenshots/tests/logs as supporting evidence,
- report findings using the shared output contract.

Animator must not:
- claim bus/lifecycle ownership,
- invent non-existent Animator tools,
- absorb clearly UI/Sound/Gameplay-owned work without handoff.

### UI and Sound (guide-level)
UI and Sound may:
- recommend which evidence to gather first,
- use existing generic MCP evidence surfaces as supporting inputs,
- shape reporting and focused questions,
- hand off to Animator or Gameplay when ownership is clearer.

UI and Sound must not:
- claim dedicated specialist runtime-backed MCP resources/tools,
- imply that a UI/Sound review-session artifact runtime already exists,
- use persona language to pretend operational authority.

### Gameplay (deferred)
Gameplay may:
- appear as defer/handoff guidance,
- help explain that the request has crossed from presentation into mechanics.

Gameplay must not:
- drive MCP execution as if it were grounded,
- claim runtime-backed resources/tools,
- claim a grounded review-session flow.

## preferredEvidence execution rules

If `preferredEvidence` contains grounded runtime-backed entries:
- use those first,
- keep the order stable unless a request-specific constraint requires a narrower subset.

If `preferredEvidence` contains only guide-only evidence:
- treat it as evidence-priority guidance,
- not as proof of specialist runtime support.

If `preferredEvidence` mixes grounded and guide-only evidence:
- grounded entries come first,
- guide-only evidence remains fallback/supporting context.

If the preferred evidence required is unavailable or outside the current lane:
- do not fabricate substitute specialist runtime surfaces,
- either use truthful fallback evidence,
- or hand off using `handoffTo`.

## Generic MCP evidence allowed across lanes

The following kinds of evidence may support multiple specialists without making them grounded:
- screenshots
- tests/validation runs
- console/debug state
- editor state
- notes/captures provided by the user

These remain supporting evidence primitives, not specialist runtime proof.

## Reporting rule

Even during MCP usage, responses should preserve:
- Intent
- Summary
- Evidence
- Focused Question
- Revision Tasks
- Risk

If the specialist is guide-level or deferred, the report must stay explicit that:
- the reasoning is guide-only or handoff-oriented,
- and the current slice does not provide dedicated runtime backing for that specialist.

## Hard stop / handoff conditions

Handoff is required when:
- `avoidWhen` is the better match,
- the next evidence step needs a different specialist owner,
- the current specialist would need to invent runtime support,
- or the request crosses from presentation into gameplay semantics.

## Deny rules

Execution guidance must reject:
- claiming UI/Sound runtime-backed specialist MCP surfaces
- claiming Gameplay MCP runtime backing
- inventing public CLI commands for specialist MCP management
- treating guide-level evidence hints as proof of grounded runtime status
- using prompt persona to overrule evidence boundaries

## Practical rule of thumb

Use MCP to gather the **best truthful evidence available now**.

If a specialist is grounded, use its grounded surfaces first.
If it is only guide-level or deferred, use MCP only as supporting evidence guidance and hand off before making stronger runtime claims.
