# Agent-Chat Feedback Protocol v2

This document defines the first-slice v2 review-session artifact and the guide-first feedback loop for specialists.

## Scope

V2 first slice operationalizes one grounded review loop for **Animator**. UI and Sound are guide-level only. Gameplay is deferred in this slice despite prompt prior art.

## Review-session artifact

### Canonical URIs and file path
- collection: `review://animation/pending`
- single session: `review://animation/session/{sessionId}`
- persisted artifact: `.omx/state/specialists/review-sessions/animator/{sessionId}.json`

### Ownership and lifecycle rule
- The persisted artifact is **OMX companion-owned**.
- The MCP resource route is a **read-only projection** over that artifact.
- The route is not a queue, dispatcher, mailbox, scheduler, polling loop, or lifecycle owner.
- This protocol does not introduce creation, dispatch, or bus semantics.

### Artifact producer
In the first slice, the artifact is created and updated by the **OMX companion-side review producer**:
- a chat/session integrator,
- an MCP host-side review helper,
- or another companion-owned orchestration surface on the filesystem side.

It is **not** created or updated by:
- the Unity MCP resource route,
- a public CLI command,
- a queue/scheduler/mailbox worker,
- or a Unity-side lifecycle owner.

The Unity plugin remains projection-only: it reads the artifact and returns a bounded resource view.

## Required session shape

```json
{
  "sessionId": "animator-review-001",
  "specialistId": "animator",
  "status": "awaiting-feedback",
  "targetRefs": ["animation://clip/Assets/.../Attack.anim"],
  "intentRestatement": "You want the attack windup to read faster.",
  "summary": "Prepared a draft review context anchored to the current draft clip.",
  "evidence": [
    {
      "category": "state",
      "source": "animation://clip/Assets/.../Attack.anim",
      "summary": "0.42s clip, hit event at 0.31s"
    }
  ],
  "focusedQuestion": "Should the windup feel shorter, heavier, or unchanged?",
  "riskNote": "No confirmation required for draft review.",
  "updatedAt": "2026-04-25T12:00:00Z"
}
```

### Required non-empty fields
- `sessionId`
- `specialistId`
- `status`
- `targetRefs` (non-empty)
- `intentRestatement`
- `summary`
- `evidence` (non-empty)
- `focusedQuestion`
- `riskNote`
- `updatedAt`

### Evidence item requirements
Every evidence item must include non-empty:
- `category` (`visual`, `state`, `validation`, or `debug` in the first slice)
- `source`
- `summary`

### Conditional feedback/revision requirements
If `feedbackCaptured` is present and non-empty, `revisionTasks` must exist and contain at least one task with non-empty:
- `id`
- `targetRef`
- `action`
- `acceptance`

## Status model

Allowed first-slice statuses:
- `draft`
- `awaiting-feedback`
- `revision-ready`
- `validation-ready`
- `blocked-on-confirmation`

Status is artifact-local state, not queue ownership.

## Canonical transition rules

### 1. `draft -> awaiting-feedback`
The companion-side producer may move a session to `awaiting-feedback` once the artifact has:
- bounded `targetRefs`,
- non-empty evidence,
- one focused question,
- and a stable `updatedAt`.

### 2. `awaiting-feedback -> revision-ready`
When human feedback is captured:
- write `feedbackCaptured`,
- derive `revisionTasks`,
- ensure every revision task links to a declared `targetRef` or evidence source,
- update `summary` to reflect the new task-ready state,
- bump `updatedAt`,
- then set `status = revision-ready`.

### 3. `revision-ready -> validation-ready`
After revisions have been applied outside this protocol, the companion-side producer may refresh the artifact with validation evidence and move it to `validation-ready`.

This protocol still does **not** introduce apply/promote tooling; it only records the artifact state after that work happens elsewhere.

### 4. `* -> blocked-on-confirmation`
If the next proposed step would overwrite/delete an approved or canonical asset, the companion-side producer may set `blocked-on-confirmation` and update `riskNote` accordingly.

## feedbackCaptured -> revisionTasks update flow

When feedback arrives, the companion-side producer should:
1. load the current persisted artifact,
2. preserve `sessionId`, `specialistId`, and grounded `targetRefs`,
3. preserve or extend evidence rather than replacing it with unlinked text,
4. write `feedbackCaptured`,
5. derive one or more `revisionTasks`,
6. link each task to a session `targetRef` or evidence `source`,
7. update `summary` and `updatedAt`,
8. persist the file at the same path,
9. expose the new state through the unchanged read-only projection route.

This keeps the artifact path stable while allowing the projection to surface the latest review state.

## Guide-before-persona rule

Guide prompts are the first design driver in v2.

A persona prompt is not considered accepted until:
1. a selection guide exists for the specialist,
2. the selection guide distinguishes adjacent ownership,
3. the output contract is already defined,
4. persona wording does not override selection or evidence semantics.

## Output contract

Every grounded v2 specialist response must preserve this response skeleton:

```markdown
Intent:
<what the specialist believes the user wants>

Summary:
- <proposal or current state>

Evidence:
- <category>: <source> -> <summary>

Focused Question:
<one actionable feedback question>

Revision Tasks:
1. <derived task or pending placeholder>

Risk:
<risk/confirmation status>
```

## Acceptance criteria
1. `review://animation/pending` is a typed collection route, not a placeholder-only story.
2. `review://animation/session/{sessionId}` is defined as a single-session route.
3. the protocol clearly distinguishes companion-owned artifact storage from Unity runtime projection.
4. guide-before-persona is encoded as an explicit rule.
5. no bus execution or public CLI lifecycle semantics are introduced.
