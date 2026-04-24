<!-- markdownlint-disable MD013 -->

# Specialist Architecture Verification Checklist v1

This checklist validates the v1 specialist-agent documentation package for Unity-MCP. It is intended for the docs-first slice that introduces a generic specialist contract, an Animator reference specialist, chat-based feedback, risk/autonomy rules, and a migration roadmap without implementing a collaboration bus or all specialist roles.

## Required artifacts

Before closing an integration branch, verify these docs exist or have equivalent sections:

| Artifact | Required coverage | Pass evidence |
| --- | --- | --- |
| Specialist contract | Identity, discipline, prompt set, resources, tools/tool namespace, profile allowlist, feedback protocol, evidence contract, autonomy/risk policy, and future bus hooks. | Contract doc names every field and distinguishes static contract from runtime profile. |
| Animator reference | Mission, allowed scope, forbidden/confirmation-required scope, asset states, prompts, resources, tools, profile, and chat feedback example. | Animator doc uses the contract template rather than a one-off format. |
| Agent-chat feedback protocol | Intent restatement, plan/change summary, Evidence, one focused question, feedback capture, revision task extraction, and result reporting. | Every example specialist reply includes an `Evidence` section. |
| Risk/autonomy policy | Autonomy-first default; hard confirmation only for delete/destroy or irreversible overwrite/replace of Approved/canonical assets or GameObjects. | Policy explicitly says ordinary draft feedback and revision do not require hard approval. |
| Migration roadmap | Staged docs -> optional schema/validator -> optional MCP profile/tool/resource work. | Roadmap explicitly defers all-specialist rollout and full collaboration bus implementation. |
| Acceptance scenarios | Animator draft feedback, human revision, QA/validation handoff, delete/destroy or irreversible replacement confirmation, and bus deferral. | Scenario table below is checked and signed off. |

## Static documentation tests

Run these as read-through checks after all specialist docs are merged:

1. The package defines four boundaries: **Specialist Contract**, **Specialist Profile**, **Feedback Session**, and **Collaboration Bus Events**.
2. The feedback protocol maps chat evidence to screenshots, console/debug state, tests/validation, object/component state, and future animation resources.
3. The Animator reference defines **Draft**, **Reviewed**, **Approved**, and **Deprecated** asset states.
4. Collaboration Bus Events remain conceptual only; no queue, scheduler, mailbox, dispatcher, polling loop, or lifecycle owner is introduced in v1 docs.
5. Profile/allowlist examples are bounded and describe wildcard expansion before tools are passed to the existing runtime allowlist mechanism.
6. Examples avoid claiming that current AnimationTimeline prompts are complete specialist support; they are prior art only.

## Acceptance scenario validation

| Scenario | Validation steps | Expected result |
| --- | --- | --- |
| Animator draft feedback | Read the Animator chat example and confirm it restates intent, summarizes a draft or proposed change, includes Evidence, asks one focused timing/weight/event question, and extracts revision tasks from human feedback. | No hard approval is required for draft/revision work; evidence includes at least one visual/state/validation/debug category. |
| Human revision loop | Confirm natural-language feedback is converted into structured revision tasks with a result report. | Feedback is chat-centered and does not require a Unity Editor panel or modal approval flow. |
| QA/validation handoff | Confirm the docs describe validation for controller completeness, missing clips/events/transitions, and evidence availability. | Handoff can be expressed through reports or future conceptual events without implementing a bus. |
| Delete/destroy or irreversible replacement | Confirm Approved/canonical asset or GameObject delete/destroy and irreversible overwrite/replace are the only default hard-confirmation class. | Specialist asks for explicit confirmation before those actions and does not broaden approval gates to ordinary drafts. |
| Bus deferral | Search for bus event names such as `SpecialistDraftReady` and `ValidationCompleted`. | Event names are documented as future-compatible concepts only; no runtime queue, scheduler, mailbox, or dispatch command is required. |

## Citation audit

Use these repo-grounding citations when reviewing specialist docs. The cited lines were checked against the current repository state for this slice.

| Claim to ground | Citation | Verification expectation |
| --- | --- | --- |
| Unity-MCP already composes Tool, Prompt, Resource, and Skill discovery through assembly scanning. | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Runtime/UnityMcpPlugin.Build.cs:144-147` | Specialist docs should extend these surfaces rather than propose replacing registration. |
| `UNITY_MCP_TOOLS` is a runtime-only allowlist and is not persisted. | `README.md:572-580` | Profile/allowlist docs should map to this existing restriction point or clearly mark expansion as future work. |
| Animation prompt prior art exists. | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Prompt/AnimationTimeline.cs:18-76` | Animator docs should cite this as prior art, not as complete Animator specialist support. |
| Resource patterns exist with plugin resource attributes and URI routes. | `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs:29-76` | Proposed `animation://...` resources should follow this kind of Resource surface conceptually. |
| MCP client setup resolves agent config inputs and writes selected JSON/TOML config. | `cli/src/commands/setup-mcp.ts:29-152` | Profile docs may reference setup/config direction, but must not imply current specialist profile support already exists. |
| Agent definitions include concrete client config targets such as Claude Code and Codex. | `cli/src/utils/agents.ts:89-109` and `cli/src/utils/agents.ts:407-433` | Specialist profile roadmap can target existing agent config infrastructure in a later phase. |
| Baseline evidence tools include GameObject/component/object state, screenshots, tests, console logs, editor state, and reflection. | `docs/default-mcp-tools.md:53-123` | Feedback protocol Evidence sections should reuse these categories before inventing new evidence primitives. |

## Evidence primitive mapping

| Feedback need | Current/proposed evidence source | Required doc behavior |
| --- | --- | --- |
| Visual preview | `screenshot-game-view`, `screenshot-scene-view`, `screenshot-camera` | Chat examples should identify which visual evidence was captured or why it is pending. |
| Debug/runtime status | `console-get-logs`, `editor-application-get-state` | Reports should include relevant logs/state when behavior is runtime-dependent. |
| Validation result | `tests-run`, future `animator-validate-controller` | Animator validation should be reportable before and after revisions. |
| Object/component state | `object-get-data`, `gameobject-component-get`, `gameobject://currentScene/{path}` resources | State evidence should cite object/controller/clip facts, not just prose. |
| Animation-specific state | Future `animation://controller/{path}` and `animation://clip/{path}` summaries | Future resources should be marked proposed until implemented. |

## Negative boundary checks

Fail the docs review if any v1 doc:

- Requires hard approval for every specialist action instead of only delete/destroy or irreversible overwrite/replace of Approved/canonical assets or GameObjects.
- Grants all default Unity-MCP tools to every specialist by default.
- Treats conceptual bus events as an executable queue, scheduler, mailbox, dispatcher, or lifecycle owner.
- Implies all specialists must be implemented in the first slice.
- Describes agent chat as a mandatory Unity Editor panel rather than a protocol usable by existing MCP clients.
- Claims proposed animation resources/tools already exist unless corresponding code is present.

## Lightweight verification commands

Use these commands from the repo root after docs are merged:

```bash
# Confirm required specialist docs are present.
find docs/specialists -maxdepth 1 -type f | sort

# Confirm repo-grounding citations still resolve around the cited line ranges.
nl -ba Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Runtime/UnityMcpPlugin.Build.cs | sed -n '144,147p'
nl -ba README.md | sed -n '572,580p'
nl -ba Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Prompt/AnimationTimeline.cs | sed -n '18,76p'
nl -ba Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs | sed -n '29,76p'
nl -ba cli/src/commands/setup-mcp.ts | sed -n '29,152p'
nl -ba cli/src/utils/agents.ts | sed -n '89,109p;407,433p'
nl -ba docs/default-mcp-tools.md | sed -n '53,123p'

# Confirm v1 bus wording stays conceptual.
grep -R "queue\|scheduler\|mailbox\|dispatcher\|polling loop\|lifecycle owner" docs/specialists || true
```

## Closeout criteria

The specialist docs slice is complete when:

1. All required artifacts are present or intentionally consolidated into clearly named equivalent docs.
2. Every acceptance scenario above has an explicit passing example or section reference.
3. Citation audit entries still match repository reality.
4. Risk/autonomy wording is feedback-first and does not expand hard approval beyond the stated destructive/irreversible class.
5. The migration roadmap preserves v1 as docs/contracts and leaves runtime validators, profiles, additional specialist roles, and bus execution for later phases.
