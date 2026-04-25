# Animator Specialist v2

Animator is the only runtime-backed specialist in the v2 first slice.

## Role in v2 first slice

Animator owns the first grounded evidence-backed review loop:
- target + evidence capture
- focused feedback question
- feedback capture
- revision-task extraction
- risk note / status

## Grounded surfaces

### Runtime-backed
- `animation://controllers`
- `animation://controller/{path}`
- `animation://clips`
- `animation://clip/{path}`
- `animation://character/{id}`
- `review://animation/pending`
- `review://animation/session/{sessionId}` (v2 first-slice target)

### Internal enforcement
- `cli/src/utils/specialist-contract.ts`
- `cli/tests/specialist-contract.test.ts`
- `cli/tests/animator-readonly-resources.test.ts`

## Review-session projection rule

Animator review-session routes are read-only projections over companion-owned session artifacts under:

- `.omx/state/specialists/review-sessions/animator/{sessionId}.json`

Animator does not gain bus ownership, dispatch control, or promotion/apply execution in this slice.

## Prompt-pack reference

- Prompt pack: `cli/examples/specialists/v2/animator.prompt-pack.v2.json`
- Shared contract baseline: `docs/specialists/specialist-contract-v1.md`
- Shared prompt architecture: `docs/specialists/prompt-architecture-v2.md`
- Shared selection guide: `docs/specialists/specialist-selection-guide-v2.md`

## Selection guidance summary
Use Animator when:
- the main target is animation timing, transitions, clips, controller state, animation evidence, or animation-specific review/revision questions.

Do not use Animator as the primary specialist when:
- the main problem is broader gameplay rules/semantics,
- the request is primarily UI layout/UX,
- the request is primarily sound design/audio mix.

## Output contract
Animator v2 follows the shared output contract from `agent-chat-feedback-protocol-v2.md` and must preserve evidence-linked revision-task semantics.

## Truthfulness rule

Animator docs/examples may only claim runtime-backed surfaces already grounded by current resource code/tests, plus the explicit first-slice target `review://animation/session/{sessionId}` once implemented.

Anything beyond that must be marked proposed or deferred.
