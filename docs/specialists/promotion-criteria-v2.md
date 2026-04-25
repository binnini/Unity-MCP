# Specialist Promotion Criteria v2

## Purpose

This document defines the evidence required to promote first-wave specialists beyond their current first-slice truthfulness level.

It exists to prevent prompt/catalog/docs work from being mistaken for runtime grounding.

## Current baseline

- **Animator**: grounded
- **UI**: guide-level only
- **Sound**: guide-level only
- **Gameplay**: deferred despite prompt prior art

Promotion means changing what a specialist may truthfully claim about:
- runtime-backed MCP resources/tools,
- review-session support,
- active specialist ownership,
- and injection authority.

## General promotion rule

A specialist may be promoted only when:
1. docs, fixtures, validators, and runtime surfaces agree,
2. the new runtime claim is backed by implementation and tests,
3. review-session semantics are explicit where applicable,
4. the upgrade does not quietly import bus/scheduler/mailbox/lifecycle/public-CLI scope.

Prompt prior art alone is never enough for promotion.

## Promotion tiers

### Guide-level -> grounded
Required:
- at least one real runtime-backed MCP resource or tool
- truthfulness-aligned docs naming the grounded surface
- validator/test coverage for the new grounded claim
- prompt-pack/runtime status update
- explicit usage rules for how the specialist consumes evidence

Optional but recommended:
- specialist-specific review-session semantics if the discipline needs review loops

### Deferred -> guide-level
Required:
- accepted selection guide
- accepted output contract
- bounded persona wording that does not imply runtime backing
- first-wave catalog/docs alignment
- explicit handoff/ownership boundaries

Not required:
- runtime-backed resources/tools
- review-session artifact runtime

### Deferred -> grounded
This is effectively a two-step promotion:
1. deferred -> guide-level
2. guide-level -> grounded

Do not skip the guide-level truthfulness pass.

## UI promotion criteria

UI may move from guide-level to grounded only when all of the following are true:
- a dedicated UI MCP surface exists and is implemented
- the surface is documented as runtime-backed
- tests prove the new surface exists and behaves within first-scope boundaries
- prompt-pack `runtimeStatus` is updated consistently
- MCP usage guidance stays explicit about what UI now owns vs what still belongs to Animator or Gameplay

Examples of acceptable grounding evidence:
- a concrete UI resource route
- a concrete UI-focused inspection tool
- typed/read-only UI review artifact support

Non-evidence:
- prompt wording
- screenshots alone
- catalog mention

## Sound promotion criteria

Sound may move from guide-level to grounded only when all of the following are true:
- a dedicated Sound MCP surface exists and is implemented
- the surface is documented and tested
- prompt-pack/runtime status is updated consistently
- the new grounding is bounded to audio ownership rather than generic feedback phrasing

Examples of acceptable grounding evidence:
- a concrete Sound resource/tool route
- typed audio review support
- tested evidence/reporting behavior tied to audio surfaces

Non-evidence:
- persona richness
- handoff mention
- generic notes/captures without runtime support

## Gameplay promotion criteria

Gameplay may move from deferred to guide-level only when:
- a first-class selection guide is accepted,
- output contract usage is accepted,
- handoff boundaries against Animator/UI/Sound are explicit,
- docs/catalog/prompt-pack status all agree it is still not runtime-backed.

Gameplay may move from guide-level to grounded only when:
- dedicated Gameplay runtime-backed MCP resources/tools exist,
- those surfaces are documented and tested,
- any gameplay review-session/runtime claims are explicit and implemented,
- the runtime claim is no longer carried only by prompt prior art.

## Review-session promotion rule

A specialist must not claim grounded review-session runtime until:
- a persisted artifact path is defined,
- the producer/update rules are defined,
- projection/runtime behavior is implemented,
- malformed artifact handling is tested,
- and the route remains truthful about ownership.

## Deny rules

Promotion must reject:
- using prompt packs alone as promotion evidence
- treating docs-only naming as runtime proof
- treating guide-level evidence recommendations as grounded MCP support
- treating deferred handoff language as proof of active specialist ownership
- introducing public CLI specialist lifecycle commands as a shortcut to grounding

## Practical rule of thumb

Promote a specialist only after the codebase can prove the new claim.

Until then:
- keep UI/Sound guide-level,
- keep Gameplay deferred or guide-level as documented,
- and prefer a narrower truthful claim over a broader but unimplemented one.
