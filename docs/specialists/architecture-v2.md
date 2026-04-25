# Specialist Architecture v2

## Goal

Specialists v2 turns the v1 docs/contracts baseline into a contract-first, proof-oriented slice that stays truthful about current runtime support while making one evidence-backed review loop operational.

V2 does **not** replace v1 in place. V1 remains the accepted historical/reference contract. V2 lands as a parallel planning and implementation surface.

## First-slice decision

This slice is intentionally narrow:

- **Animator** is the only runtime-backed specialist.
- **UI** and **Sound** are guide-level first-wave specialists only.
- **Gameplay** is explicitly deferred in this slice despite prompt prior art.
- No bus/scheduler/mailbox/lifecycle owner is introduced.
- No new public CLI command surface is introduced.

## Ownership model

| Surface | Owner of truth | Notes |
| --- | --- | --- |
| v1 contract/history | `docs/specialists/*-v1.md` | Frozen reference/docs baseline. |
| v2 contract semantics | `docs/specialists/*-v2.md` | Canonical planning/docs source for new specialist work. |
| Internal validation | `cli/src/utils/specialist-contract.ts` + `cli/tests/*` | Internal-only utility/test enforcement. |
| Animator runtime resource projection | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/Animation.cs` | Canonical read-only Animator resource behavior. |
| Review-session artifact persistence | `.omx/state/specialists/review-sessions/animator/{sessionId}.json` | OMX companion-owned artifact, not Unity lifecycle authority. |
| Review-session artifact producer | OMX companion-side review producer | Host/chat-side creator/updater of the artifact; not Unity, not bus-owned, not public CLI surface. |
| Review-session resource route | `review://animation/session/{sessionId}` | Read-only projection over existing companion artifact only. |

## Parallel-docs migration rule

V2 uses **parallel docs**, not in-place renaming of v1:

- `architecture-v1.md` stays untouched as accepted v1 architecture.
- `agent-chat-feedback-protocol-v1.md` stays untouched as accepted v1 feedback baseline.
- New v2 docs define the new contract boundaries and first-slice proof requirements.

Shared code/test/runtime surfaces may be updated in place only where they represent canonical enforcement or canonical Animator runtime behavior.

## V2 boundary model

### 1. Contract
The specialist contract still owns identity, scope, risk, resources, evidence expectations, and handoff boundaries.

### 2. Review Session
V2 promotes the review-session object from documentation-only concept to a canonical first-slice artifact for Animator.

### 3. Guide Prompt
A guide prompt answers when to select a specialist, when not to select it, what neighboring specialist owns adjacent work, and which MCP evidence/resource/tool surfaces it should prefer first.

### 4. Output Contract
An output contract defines the stable reporting shape:
- Intent
- Summary
- Evidence
- Focused Question
- Revision Tasks
- Risk

### 5. Persona Prompt
Persona is optional in the first slice and may reinforce specialist voice/responsibility, but it must not redefine the guide/output semantics.

## Precedence / conflict rules

Conflict resolution must follow this ladder:

1. Safety and truthfulness constraints
2. Contract scope and confirmation rules
3. Review-session artifact requirements
4. Output contract requirements
5. Guide prompt instructions
6. Persona prompt instructions
7. Prompt-only shadow examples

Additional rules:

- `forbiddenScope` and confirmation boundaries override guide/persona style.
- Grounded Animator resources and tests override generic cross-specialist examples.
- Prompt-only UI/Sound examples must never be interpreted as runtime-backed implementation.
- Gameplay text must not imply live runtime support or artifact generation in this slice.
- Bus/event names remain conceptual only and cannot become executable behavior through prompt fields.

## First-slice proof target

The first slice is complete only when **one real Animator review-session artifact path** exists and is validated.

That proof must include:

- collection route: `review://animation/pending`
- single-session route: `review://animation/session/{sessionId}`
- persisted artifact path: `.omx/state/specialists/review-sessions/animator/{sessionId}.json`
- typed, non-placeholder session fields
- evidence-linked revision-task semantics

## Non-goals

- rewriting v1 docs to masquerade as v2
- full docs/runtime 1:1 parity beyond evidence-contract integrity
- multi-specialist runtime grounding in the first slice
- public CLI review-session management commands
- executable bus/orchestration runtime
- apply/promote execution tooling
