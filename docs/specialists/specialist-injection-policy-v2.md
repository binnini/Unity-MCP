# Specialist Injection Policy v2

## Purpose

This document defines **when** a specialist prompt pack may be injected, **which layers** may be injected on each surface, and **which truthfulness limits** must stay in force during the v2 first slice.

It is the canonical policy companion to:
- `prompt-architecture-v2.md`
- `specialist-selection-guide-v2.md`
- `first-wave-catalog-v2.md`

## First-slice truthfulness baseline

- **Animator** is the only grounded/runtime-backed specialist.
- **UI** and **Sound** are guide-level only.
- **Gameplay** is deferred despite prompt prior art.
- No injection policy may widen those runtime claims.

## Injection surfaces

### 1. Chat-session injection
Used when a session wants specialist framing for interpretation, reporting, and bounded feedback.

### 2. MCP resource/tool guidance injection
Used when a session is already gathering evidence through MCP resources/tools and needs specialist-specific usage guidance.

### 3. Review-session follow-up injection
Used when an existing review artifact or evidence-linked feedback loop needs specialist-consistent reporting.

## Canonical layer order

When a specialist is injected, the layers must be applied in this order:
1. **Guide prompt**
2. **Output contract**
3. **Persona prompt**

Earlier layers always win.

## Injection policy by specialist status

### Grounded specialist (`Animator`)
Allowed:
- guide prompt injection
- output contract injection
- persona injection
- runtime-backed resource guidance consistent with grounded Animator surfaces

Not allowed:
- claims beyond currently grounded Animator resources/routes
- bus, scheduler, mailbox, lifecycle-owner, or public CLI semantics through prompt wording

### Guide-level specialist (`UI`, `Sound`)
Allowed:
- guide prompt injection
- output contract injection
- persona injection only after guide/output semantics are already in force
- evidence-priority guidance
- handoff guidance to adjacent specialists

Not allowed:
- claims of dedicated runtime-backed specialist resources/tools
- claims of grounded review-session artifact ownership
- persona-driven widening into runtime authority

### Deferred specialist (`Gameplay`)
Allowed:
- limited guide/handoff wording
- defer/routing language inside the shared output contract

Not allowed:
- full specialist injection that implies grounded operational ownership
- runtime-backed resource/tool claims
- review-session runtime claims
- production-ready persona authority

## Selection gate before injection

Before injecting any specialist:
1. check the specialist selection guide,
2. confirm the request matches `selectWhen`,
3. confirm it does not primarily match an `avoidWhen` condition,
4. prefer handoff if adjacent ownership is clearer,
5. inject only the minimum truthful layer set for the chosen specialist status.

If the request is ambiguous, prefer:
- the guide prompt over persona flavor,
- a truthful handoff over a wider specialist claim,
- grounded evidence surfaces over speculative specialist ownership.

## Minimum truthful layer set

### Chat session
- grounded specialist: guide + output + persona
- guide-level specialist: guide + output, then persona only as bounded framing
- deferred specialist: guide/handoff wording only

### MCP usage guidance
- grounded specialist: guide + output, plus runtime-backed preferred evidence ordering
- guide-level specialist: guide + output, but only as evidence-priority/routing guidance
- deferred specialist: handoff/defer wording only

### Review-session follow-up
- Animator may be injected as the active specialist for the current grounded review-session path.
- UI/Sound may appear only as framing or adjacent-owner guidance.
- Gameplay may appear only as deferred handoff language.

## preferredEvidence policy

When `preferredEvidence` exists:
- consume grounded runtime-backed resources/tools first,
- keep non-runtime evidence as fallback guidance,
- do not invent missing specialist runtime surfaces,
- if the needed evidence is outside the selected specialist's truthful lane, hand off instead.

## handoffTo policy

`handoffTo` is the explicit adjacent-owner list.

Use it when:
- the request primarily matches `avoidWhen`,
- the evidence needed sits outside the active specialist lane,
- the current specialist is only guide-level or deferred for the requested next step,
- or persona wording would otherwise tempt scope widening.

## Persona gate

Persona may refine:
- tone,
- discipline emphasis,
- tradeoff framing.

Persona may **not** redefine:
- specialist ownership,
- runtime status,
- evidence requirements,
- risk/confirmation rules,
- or handoff boundaries.

If persona conflicts with guide/output semantics, persona loses.

## First-slice deny rules

The injection policy must reject:
- treating UI or Sound as runtime-backed
- treating Gameplay as grounded
- using persona-only injection without an accepted guide layer
- injecting bus/scheduler/mailbox/lifecycle semantics through prompts
- claiming public CLI specialist management commands exist in this slice

## Practical rule of thumb

Inject the **smallest truthful specialist surface** that helps the user:
- choose the right owner,
- gather the right evidence,
- report in the shared output shape,
- and hand off cleanly when the current specialist is not the right one.
