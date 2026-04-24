# Specialist Migration Roadmap v1

## Roadmap principles

1. **Contracts first.** Define specialist boundaries before adding workers or
   broad execution behavior.
2. **Extend existing Unity-MCP surfaces.** Use current Tool, Prompt, Resource,
   Skill, and setup/config mechanisms before adding new runtime concepts.
3. **Feedback-first UX.** Agent chat is the first human interface; hard approval
   is reserved for delete/destroy or irreversible overwrite/replace of
   Approved/canonical assets or GameObjects.
4. **Animator proves the pattern.** Animator is the first reference specialist;
   other domains should not be implemented until the contract has been validated.
5. **Bus deferred.** V1 reserves event names but does not implement a
   collaboration bus, queue, scheduler, mailbox, or dispatcher.

## Phase 1 — Documentation/contract package

**Status:** this package.

Deliverables:

- `docs/specialists/README.md`
- `docs/specialists/architecture-v1.md`
- `docs/specialists/specialist-contract-v1.md`
- `docs/specialists/migration-roadmap-v1.md`
- Companion reference docs for Animator, chat feedback, evidence mapping, and
  risk/autonomy policy may be added as separate Phase 1 slices.

Acceptance checks:

- Specialist Contract, Specialist Profile, Feedback Session, and Collaboration
  Bus Events are defined as separate boundaries.
- Contract template covers Prompt, Resource, Tool, Profile/allowlist, feedback,
  evidence, autonomy/risk, and bus-readiness fields.
- Roadmap clearly defers full collaboration bus and all-specialist
  implementation.
- Repo citations tie the plan to existing Unity-MCP extension points.

## Phase 2 — Contract fixtures and validation

Goal: turn the documentation contract into lightweight examples and validation
without changing runtime behavior.

Potential deliverables:

- JSON/YAML fixtures for `animator` and one intentionally invalid profile.
- Optional TypeScript helper in `cli/src/utils/specialist-contract.ts`.
- Optional tests in `cli/tests/specialist-contract.test.ts`.

Validation expectations:

- Accept a bounded profile with exact tool IDs or documented wildcard semantics.
- Reject a profile missing feedback protocol or evidence requirements.
- Reject delete/destroy or irreversible overwrite/replace capability when
  confirmation metadata is absent.
- Reject bus fields that imply runtime dispatch, scheduler ownership, mailbox,
  queue, or polling behavior in v1.

Exit criteria:

- Fixtures match the docs.
- Validator, if included, is documentation-shaped and does not become a runtime
  permission system.

## Phase 3 — Animator read-only resources

Goal: implement the first concrete specialist inspection layer while keeping all
write behavior deferred.

Potential resources:

- `animation://controllers`
- `animation://controller/{path}`
- `animation://clips`
- `animation://clip/{path}`
- `animation://character/{id}`
- `review://animation/pending`

Implementation guidance:

- Follow the existing resource pattern shown by
  `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs:29-76`.
- Keep resources read-only and chat-report friendly.
- Include missing-reference summaries, controller state summaries, clip metadata,
  and evidence-ready output.

Exit criteria:

- Animator can inspect controller/clip state without creating or modifying
  assets.
- Feedback Sessions can cite animation-specific resources alongside current
  generic evidence primitives.

## Phase 4 — Animator draft tools and feedback loop

Goal: add safe draft/variant creation and validation after read/report behavior
is proven.

Potential tools:

- `animator-controller-get`
- `animation-clip-get`
- `animator-validate-controller`
- `animation-preview-report`
- `animation-feedback-apply`
- `animation-draft-promote`

Implementation guidance:

- Draft creation and revision can be autonomous by default.
- `animation-draft-promote` requires hard confirmation only when it irreversibly
  overwrites or replaces an Approved/canonical asset or GameObject.
- Validation/reporting tools should return chat-friendly evidence summaries.
- Existing evidence tools remain useful: screenshots, console logs, tests,
  object/component state, and editor state are listed in
  `docs/default-mcp-tools.md:53-123`.

Exit criteria:

- Animator can produce a draft report with evidence, ask one focused feedback
  question, apply feedback to structured revision tasks, and report the result.
- Delete/destroy and irreversible overwrite/replace gates are enforced by policy
  and, if implemented, by validator/runtime checks.

## Phase 5 — Additional specialists and bus design

Goal: prove the contract beyond Animator before introducing orchestration.

Candidate next specialists:

- QA/Validation
- Sound
- UI
- VFX
- Gameplay
- Build/Release

Before bus design starts:

- At least two specialists should use the same contract template.
- Profile allowlists should be validated against concrete tool IDs.
- Feedback Session artifacts should be reusable across agent chat and any future
  UI surface.
- Risk policies should remain domain-specific while preserving the default hard
  confirmation class.

Future bus design may use conceptual event names from the contract, but it must
be specified in a separate PRD. It must not be smuggled into v1 docs or fixtures
as an executable queue, scheduler, mailbox, dispatcher, or lifecycle authority.

## Acceptance scenario checklist

### Scenario 1 — Animator draft feedback

1. Animator inspects a controller/clip through proposed read-only resources.
2. Animator presents a draft plan and evidence summary in chat.
3. Animator asks one focused timing, weight, pose, or event-placement question.
4. Human gives natural-language feedback.
5. Animator converts feedback into structured revision tasks.

Expected: no hard approval is required because the work is draft/revision
oriented and does not delete/destroy or irreversibly overwrite/replace an
Approved/canonical target.

### Scenario 2 — Human revision loop

1. Human requests a shorter, heavier, or differently timed animation feel.
2. Specialist restates the intent and identifies concrete changes.
3. Specialist reports updated evidence and risk status.

Expected: ordinary critique and revision remain chat-centered and feedback-first.

### Scenario 3 — QA/validation handoff

1. Animator produces a draft report.
2. QA/validation checks controller completeness, missing clips/events, and
   evidence availability.
3. Failed criteria return to Animator as revision tasks.

Expected: the handoff is expressible through evidence and conceptual hooks
without implementing a full collaboration bus.

### Scenario 4 — Delete or irreversible replacement confirmation

1. Specialist proposes deleting/destroying an Approved clip/controller/GameObject
   or irreversibly overwriting/replacing an Approved canonical asset.
2. Risk policy classifies the action as confirmation-required.
3. Specialist requests explicit confirmation before proceeding.

Expected: this is the default hard-confirmation class; ordinary draft-only work
is not approval-gated.

### Scenario 5 — Bus remains deferred

1. Docs mention conceptual events such as `SpecialistDraftReady`.
2. No runtime queue, scheduler, mailbox, polling loop, dispatch command, or
   lifecycle owner is introduced.

Expected: bus compatibility is documented, but bus implementation remains out of
scope for v1.

## Regression guardrails

- Do not replace existing MCP Tool/Prompt/Resource/Skill registration.
- Do not ignore `UNITY_MCP_TOOLS` when proposing profile allowlists.
- Do not grant every default tool to every specialist.
- Do not turn chat feedback into broad mandatory approval.
- Do not make Animator-specific assumptions mandatory for all specialists.
- Do not implement all specialists or a collaboration bus in the first milestone.
