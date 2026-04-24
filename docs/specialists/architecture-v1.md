# Specialist Architecture v1

## Goal

Unity-MCP can evolve from a general Unity-control bridge into a foundation for a
specialist game-development pipeline by defining contracts that compose existing
Tool, Prompt, Resource, Skill, and agent-configuration surfaces. V1 is a
contract/design package only: it names the boundaries, defines how a specialist
is represented, and leaves runtime implementation to later phases.

## Current extension points

| Capability | Current repo evidence | How specialists use it |
| --- | --- | --- |
| Tool/Prompt/Resource/Skill discovery | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Runtime/UnityMcpPlugin.Build.cs:144-147` registers assemblies with `WithToolsFromAssembly`, `WithPromptsFromAssembly`, `WithResourcesFromAssembly`, and `WithSkillsFromAssembly`. | Specialist contracts reference prompt/resource/tool names that can later be implemented through the existing assembly-scanned surfaces. |
| Runtime tool restriction | `README.md:572-580` documents `UNITY_MCP_TOOLS` as a runtime-only comma-separated tool allowlist. | Specialist Profiles compile a bounded tool list or documented wildcard expansion into this existing runtime allowlist instead of inventing a new permission system in v1. |
| Agent setup/config generation | `cli/src/commands/setup-mcp.ts:29-152` resolves an agent, project config, transport, auth, and writes JSON/TOML config. | Later profile support can extend setup/config generation with specialist-specific prompt/resource/tool hints. |
| Existing animation prompts | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Prompt/AnimationTimeline.cs:18-76` provides animation/timeline prompt prior art. | Animator becomes a concrete reference specialist without treating the current prompts as complete specialist support. |
| Existing resource pattern | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs:29-76` exposes `gameobject://currentScene/{path}` through `[McpPluginResourceType]`. | Animation resources can follow the same style, for example `animation://controller/{path}`. |
| Baseline evidence tools | `docs/default-mcp-tools.md:53-123` includes GameObject/component/object, screenshot, test, console, and editor-state tool IDs. | Feedback Sessions cite existing screenshot, state, validation, and debug evidence before new specialist-only evidence exists. |

## Canonical boundary model

### 1. Specialist Contract

A Specialist Contract is a static, versioned description of a domain agent. It
answers:

- Who is this specialist and what discipline does it own?
- Which prompts/resources/tools may it use?
- Which scopes are allowed, forbidden, or confirmation-gated?
- What evidence must it report in chat?
- How does it capture human feedback and produce revision tasks?
- Which conceptual handoff hooks should later bus work preserve?

The contract is not a process, queue, scheduler, or worker implementation.

### 2. Specialist Profile

A Specialist Profile is the concrete runtime projection of a contract. It can be
implemented later as JSON, TypeScript, C#, generated MCP client entries, or a
combination of these. V1 only requires the profile shape to be documented.

A profile must be narrower than the full Unity-MCP tool catalog. It may use exact
tool IDs or explicitly documented wildcard patterns. Wildcards are declarative in
v1; a future resolver must expand them to concrete tool IDs before passing them
to `UNITY_MCP_TOOLS`.

Example shape:

```json
{
  "id": "animator",
  "displayName": "Animator Specialist",
  "prompts": ["role-animator-specialist", "animation-feedback-review"],
  "resources": ["animation://controllers", "animation://clip/{path}"],
  "tools": ["animator-*", "animation-*", "screenshot-game-view", "console-get-logs"],
  "requiresConfirmation": [
    "delete",
    "destroy",
    "overwrite-approved",
    "replace-approved"
  ]
}
```

### 3. Feedback Session

A Feedback Session is the chat-centered human iteration record. It is portable:
a future Unity Editor panel, artifact queue, or collaboration bus can render the
same fields, but v1 starts with agent chat.

Minimum fields:

1. `intent` — the specialist's restatement of the user request.
2. `summary` — proposed or completed work.
3. `evidence` — visual, state, validation, and/or debug references.
4. `focusedQuestion` — one actionable question for the human.
5. `feedback` — human critique or direction, when available.
6. `revisionTasks` — structured next changes extracted from feedback.
7. `riskNote` — whether any action needs explicit confirmation.
8. `result` — final report after revision/validation.

A feedback session must not require hard approval for ordinary draft/revision
work. Confirmation is reserved for delete/destroy or irreversible overwrite /
replace of Approved/canonical assets or GameObjects.

### 4. Collaboration Bus Events

V1 reserves future-compatible event names but does not implement executable bus
behavior:

- `SpecialistTaskRequested`
- `SpecialistDraftReady`
- `HumanFeedbackReceived`
- `RevisionRequested`
- `ValidationCompleted`
- `DestructiveActionApprovalRequested`

These names are descriptive placeholders only. In v1 they must not introduce a
runtime queue, scheduler, mailbox, polling loop, dispatch command, or alternate
lifecycle authority.

## Layered architecture

### Layer 1 — Documentation contracts

Phase 1 owns the contract vocabulary and examples under `docs/specialists/`.
This is the only required v1 implementation layer.

### Layer 2 — Optional typed helpers

A later phase may encode the documented shape in CLI TypeScript or Unity C# for
validation and fixture loading. Candidate locations:

- `cli/src/utils/specialist-contract.ts`
- `cli/tests/specialist-contract.test.ts`
- `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Specialist/`

Typed helpers must preserve the documentation contract and must not turn
conceptual bus events into executable runtime dispatch.

### Layer 3 — Profile and allowlist projection

A future profile resolver can expand specialist profile entries into concrete
runtime configuration:

1. Resolve prompt IDs, resource URI patterns, and exact tool IDs.
2. Expand allowed wildcard patterns against the discovered tool catalog.
3. Reject profiles that grant delete/destroy or irreversible overwrite/replace
   behavior without confirmation metadata.
4. Emit a concrete `UNITY_MCP_TOOLS` value or generated MCP client config hints.

### Layer 4 — Specialist resources and draft tools

Animator should be the first vertical reference after docs are accepted. The
first runtime slice should be read-only resources and validation/reporting;
draft/variant write tools can follow after the evidence loop is proven.

### Layer 5 — Future bus and additional specialists

Only after at least two specialists use the contract should Unity-MCP design a
collaboration bus. That bus must remain compatible with the four v1 boundaries
instead of replacing them.

## Architecture acceptance checklist

- [ ] Specialist Contracts include Prompt, Resource, Tool, Profile/allowlist,
      feedback, evidence, autonomy/risk, and bus-readiness fields.
- [ ] Specialist Profiles are bounded and do not grant the full default tool
      catalog by default.
- [ ] Feedback Sessions are chat-centered and carry evidence references.
- [ ] Hard confirmation is limited to delete/destroy or irreversible
      overwrite/replace of Approved/canonical assets or GameObjects.
- [ ] Collaboration Bus Events are explicitly non-executable in v1.
- [ ] All repo-grounded implementation claims cite current files and line ranges.
