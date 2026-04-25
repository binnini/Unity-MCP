# Specialist Prompt Architecture v2

## Goal

V2 prompt engineering is split into three explicit layers so a specialist can be used consistently in:
- chat sessions that inject a specialist persona,
- MCP resource/tool workflows that need usage guidance,
- review loops that must return evidence-linked feedback.

## Layer order

1. **Guide prompt**
2. **Output contract**
3. **Persona prompt**

This order is mandatory.

A specialist is not considered prompt-ready until the guide prompt exists.
A persona prompt may refine tone and responsibility, but it must not override selection, evidence, or risk semantics owned by the guide/output layers.

## Layer responsibilities

### 1) Guide prompt
The guide prompt answers:
- when to select the specialist,
- when not to select it,
- what adjacent specialist owns neighboring work,
- which evidence/resources/tools to consult first,
- whether the specialist is grounded, guide-level, or deferred.

This is the primary prompt for MCP resource/tool usage.

### 2) Output contract
The output contract answers:
- what sections every response must contain,
- whether evidence is required,
- whether a focused question is required,
- when revision tasks must be extracted,
- how risk/confirmation status is reported.

This is the stabilizer for both chat and MCP usage.

### 3) Persona prompt
The persona prompt answers:
- how the specialist sounds,
- how aggressively it stays inside discipline boundaries,
- what quality heuristics it emphasizes,
- how it frames tradeoffs within an already-selected lane.

Persona is optional in the first slice.

## Prompt-pack fixture shape

The internal prompt-pack fixture is the canonical v2 packaging format for prompt engineering work.

```json
{
  "version": 2,
  "specialistId": "animator",
  "runtimeStatus": "grounded",
  "selectionGuide": {
    "selectWhen": ["..."],
    "avoidWhen": ["..."],
    "preferredEvidence": ["..."],
    "handoffTo": ["..."]
  },
  "outputContract": {
    "sections": ["Intent", "Summary", "Evidence", "Focused Question", "Revision Tasks", "Risk"],
    "evidenceRequired": true,
    "focusedQuestionRequired": true,
    "revisionTasksRequiredWhenFeedbackCaptured": true
  },
  "personaPrompt": {
    "voice": "...",
    "responsibilities": ["..."],
    "mustNot": ["..."]
  },
  "runtimeBackedResources": ["..."],
  "runtimeBackedTools": ["..."]
}
```

## Truthfulness rules

- `runtimeStatus = grounded` may list runtime-backed MCP resources/tools.
- `runtimeStatus = guide-level` must keep runtime-backed arrays empty.
- `runtimeStatus = deferred` must keep runtime-backed arrays empty and avoid pretending the specialist is operational.
- Gameplay may exist in the first-wave prompt catalog, but remains deferred in the first slice.

## Chat-session usage

When a chat session wants to inject a specialist:
1. apply the guide prompt first,
2. bind the output contract second,
3. apply persona phrasing last.

If those layers conflict, earlier layers win.

## MCP usage guidance

When a specialist is selected for MCP resource/tool work:
- use the guide prompt to decide whether the specialist is the correct owner,
- use `preferredEvidence` before freestyle exploration,
- preserve the output contract when reporting findings,
- do not use persona language to widen scope.

## First-wave expectation

The first-wave prompt packs are:
- Animator: grounded
- UI: guide-level
- Sound: guide-level
- Gameplay: deferred
