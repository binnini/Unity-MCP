# Agent-Chat Feedback Protocol v1

This document defines the chat-centered feedback loop that specialist agents use to ask for human critique, capture revisions, and report evidence. It is intentionally passive documentation for v1: it does **not** introduce a Unity Editor panel, queue, scheduler, mailbox, polling loop, dispatch command, or lifecycle owner.

## Repo grounding

- Unity-MCP already composes tools, prompts, resources, and skills through assembly scanning in `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Runtime/UnityMcpPlugin.Build.cs:144-147`.
- `UNITY_MCP_TOOLS` is documented as a runtime-only allowlist that enables only listed tool IDs and is never persisted, which makes it a suitable future projection target for specialist profiles (`README.md:572-580`).
- Baseline evidence primitives already exist for object state, screenshots, tests, console logs, and editor state (`docs/default-mcp-tools.md:96-122`).
- GameObject resources demonstrate the resource shape specialists can follow through `[McpPluginResourceType]` and `gameobject://currentScene/{path}` (`Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs:29-76`).

## Goals

1. Keep human intervention conversational and actionable.
2. Require every specialist response to cite evidence in chat, even when evidence is a textual summary in the first docs-only slice.
3. Convert natural-language feedback into explicit revision tasks.
4. Reserve hard confirmation for delete/destroy or irreversible overwrite/replace of Approved/canonical assets or GameObjects.
5. Stay bus-ready without implementing the collaboration bus in v1.

## Feedback session boundary

A **Feedback Session** is a human-readable chat record containing:

| Field | Required | Purpose |
|---|---:|---|
| `sessionId` | yes | Stable label for the chat iteration, e.g. `animator-feedback-attack-windup-001`. |
| `specialistId` | yes | Contract/profile ID such as `animator`. |
| `targetRefs` | yes | Assets, GameObjects, clips, controllers, screenshots, or reports under discussion. |
| `intentRestatement` | yes | One-paragraph statement of what the specialist believes the user wants. |
| `summary` | yes | Proposed or completed changes. |
| `evidence` | yes | One or more evidence categories from the mapping below. |
| `focusedQuestion` | yes | One narrow critique question that the human can answer in chat. |
| `feedbackCaptured` | after reply | Verbatim or summarized user feedback. |
| `revisionTasks` | after reply | Structured tasks derived from feedback. |
| `riskNote` | yes | Whether any requested action needs confirmation. |
| `status` | yes | `draft`, `awaiting-feedback`, `revision-ready`, `validation-ready`, or `blocked-on-confirmation`. |

## Protocol states

1. **Summarize** — restate the requested outcome and current target.
2. **Preview / evidence** — cite visual, state, validation, debug, or animation-specific evidence.
3. **Ask one focused question** — ask for timing, weight, event placement, readability, or another single decision.
4. **Capture feedback** — summarize the user's chat reply and preserve important wording.
5. **Extract revision tasks** — convert feedback into ordered, testable tasks.
6. **Revise or report** — apply safe draft changes, request confirmation for gated actions, or hand off validation.

## Evidence primitive mapping

Specialist chat responses must use the current Unity-MCP primitives first and add proposed domain-specific resources only where the current surface is missing animation detail.

| Feedback need | Evidence category | Current or proposed primitive | Repo grounding | Required citation shape |
|---|---|---|---|---|
| Visual preview | `visual` | `screenshot-game-view`, `screenshot-scene-view`, `screenshot-camera` | `docs/default-mcp-tools.md:102-107` | Screenshot path, tool ID, camera/view, and timestamp if available. |
| Runtime/debug status | `debug` | `console-get-logs`, `editor-application-get-state` | `docs/default-mcp-tools.md:114-122` | Log query/filter, play/edit state, warnings/errors summary. |
| Test/validation result | `validation` | `tests-run`; future `animator-validate-controller` | `docs/default-mcp-tools.md:109-112` | Test filter, pass/fail count, controller/clip validation summary. |
| Unity object/component state | `state` | `object-get-data`, `object-modify` for proposed safe draft edits, future resource-backed summaries | `docs/default-mcp-tools.md:96-100` | Object path, component/property names, before/after summary for draft changes. |
| Scene hierarchy context | `state` | `gameobject://currentScene/{path}` resource pattern | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs:29-76` | GameObject path and serialized component/resource summary. |
| Animation-specific state | `animation` | proposed `animation://controller/{path}`, `animation://clip/{path}`, `animation://character/{id}` | Proposed Animator contract | Controller layers/states/transitions, clip length/events/curves, avatar/rig target. |
| Pending human review | `review` | proposed `review://animation/pending` | Proposed Animator contract | Current feedback session ID and outstanding focused question. |

### Evidence block requirements

Every specialist response must include an `Evidence` section with at least one category. Animator responses should prefer at least two categories when possible:

```markdown
Evidence:
- visual: `screenshot-game-view` -> `artifacts/animation/attack-windup-game-view.png` (Game View, frame 42).
- animation: `animation://clip/Assets/Characters/Hero/Attack_Windup.anim` -> 0.42s clip, hit event at 0.31s, root motion disabled.
- validation: `animator-validate-controller` (proposed) -> no missing clips; one transition exit time warning.
```

If a primitive is not implemented yet, mark it as proposed and provide a textual summary instead of fabricating a tool result.

## Response template

```markdown
Intent:
I understand you want <specific animation/player-facing outcome>.

Summary:
- <proposal or safe draft change>
- <known constraint>

Evidence:
- <category>: <tool/resource/proposed source> -> <concise finding or artifact path>

Focused question:
Should <one concrete aspect> be <option A>, <option B>, or unchanged?

Revision tasks:
1. <task derived from current request or prior feedback>
2. <validation/evidence task>

Risk note:
<No confirmation needed for draft/revision work | Confirmation required before delete/destroy or irreversible overwrite/replace of Approved/canonical assets or GameObjects.>
```

## Feedback capture and revision extraction

When a human replies in natural language, the specialist records:

```json
{
  "feedbackCaptured": "Make the anticipation shorter and the impact heavier; keep the foot plant event.",
  "revisionTasks": [
    {
      "id": "rev-1",
      "action": "shorten_attack_anticipation",
      "target": "animation://clip/Assets/Characters/Hero/Attack_Windup.anim",
      "acceptance": "Windup reads faster while preserving pose clarity in Game View evidence."
    },
    {
      "id": "rev-2",
      "action": "preserve_foot_plant_event",
      "target": "animation://clip/Assets/Characters/Hero/Attack_Windup.anim#events/footPlant",
      "acceptance": "Validation report shows the footPlant event still exists at the intended contact frame."
    }
  ],
  "riskNote": "No hard confirmation required because this is draft revision work."
}
```

## Confirmation boundary

The feedback protocol is feedback-first, not approval-heavy. The specialist asks for explicit confirmation only before:

- deleting/destroying an Approved/canonical animation asset or GameObject;
- irreversibly overwriting/replacing an Approved/canonical clip, controller, avatar mask, prefab, or GameObject;
- performing an equivalent destructive operation where rollback is not represented as a draft/variant.

Draft creation, variant creation, review comments, validation, screenshots, textual reports, and revision task extraction do not require hard confirmation by default.

## Bus-ready conceptual events

These names are reserved for later integration only. They are **not executable in v1** and must not imply a runtime queue, scheduler, mailbox, polling loop, dispatch command, or lifecycle owner.

| Conceptual event | V1 status |
|---|---|
| `SpecialistTaskRequested` | Conceptual only |
| `SpecialistDraftReady` | Conceptual only |
| `HumanFeedbackReceived` | Conceptual only |
| `RevisionRequested` | Conceptual only |
| `ValidationCompleted` | Conceptual only |
| `DestructiveActionApprovalRequested` | Conceptual only |

## Acceptance checklist

- [x] Protocol is centered on ordinary agent chat.
- [x] Response template includes `Intent`, `Summary`, `Evidence`, `Focused question`, `Revision tasks`, and `Risk note`.
- [x] Evidence maps to screenshots, console/editor status, tests/validation, object/component state, scene resources, proposed animation resources, and review state.
- [x] Human feedback becomes structured revision tasks.
- [x] Hard confirmation is limited to delete/destroy or irreversible overwrite/replace of Approved/canonical assets or GameObjects.
- [x] Collaboration bus terms are conceptual and non-executable in v1.
