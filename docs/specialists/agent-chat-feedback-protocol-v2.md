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
