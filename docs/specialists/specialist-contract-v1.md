# Specialist Contract v1

## Purpose

A `SpecialistContract` defines the reusable contract for one Unity-MCP domain
specialist. It is intentionally static and versioned so it can be reviewed before
any worker, runtime bus, or generated client configuration exists.

## Contract fields

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Stable kebab-case specialist ID, for example `animator` or `qa-validation`. |
| `version` | Yes | Contract version, for example `1`. |
| `displayName` | Yes | Human-readable specialist name. |
| `discipline` | Yes | Owned game-development discipline. |
| `mission` | Yes | One-paragraph statement of responsibility. |
| `rolePrompts` | Yes | Prompt IDs or prompt names that define role behavior, feedback behavior, and risk behavior. |
| `allowedScope` | Yes | Work the specialist may do autonomously. |
| `forbiddenScope` | Yes | Work the specialist must not do. |
| `confirmationRequiredScope` | Yes | Work that requires explicit confirmation before execution. |
| `resources` | Yes | Resource URI patterns required for inspection, review, and evidence. |
| `tools` | Yes | Exact tool IDs or documented wildcard patterns the profile may allow. |
| `profile` | Yes | Runtime projection metadata: prompts, resources, tools, wildcard semantics, and setup hints. |
| `feedbackProtocol` | Yes | Chat-centered summary/evidence/question/feedback/revision/report loop. |
| `evidenceRequirements` | Yes | Required evidence categories and accepted current/proposed sources. |
| `autonomyRiskPolicy` | Yes | Default autonomy, confirmation gates, and escalation rules. |
| `assetStateModel` | Recommended | Domain asset states when review/approval state matters. |
| `handoffHooks` | Yes | Future-compatible conceptual events; non-executable in v1. |
| `acceptanceScenarios` | Yes | Scenario walkthroughs proving the contract is usable. |

## Template

```yaml
id: <specialist-id>
version: 1
displayName: <Human Name>
discipline: <Unity/game-development discipline>
mission: >
  <What this specialist owns and what success looks like.>

rolePrompts:
  - id: role-<specialist-id>-specialist
    purpose: Defines mission, scope, output style, and feedback behavior.
  - id: <discipline>-feedback-review
    purpose: Asks concise critique questions and extracts revision tasks.
  - id: <discipline>-risk-policy
    purpose: Applies autonomy and confirmation boundaries.

allowedScope:
  - <Autonomous inspection or draft work.>

forbiddenScope:
  - <Out-of-domain or unsafe work.>

confirmationRequiredScope:
  - delete-approved-or-canonical-assets
  - destroy-approved-or-canonical-gameobjects
  - irreversible-overwrite-approved-or-canonical-assets
  - irreversible-replace-approved-or-canonical-assets

resources:
  - uri: <scheme>://<collection>
    mode: read
    purpose: <What the specialist inspects.>
  - uri: <scheme>://<entity>/{path}
    mode: read
    purpose: <Detailed entity view.>

tools:
  exact:
    - screenshot-game-view
    - console-get-logs
  wildcard:
    - <discipline>-*
  destructiveOrIrreversible:
    - <tool-id-or-pattern-that-needs-confirmation>

profile:
  id: <specialist-id>
  prompts:
    - role-<specialist-id>-specialist
  resources:
    - <scheme>://<entity>/{path}
  tools:
    - <discipline>-*
    - screenshot-game-view
  wildcardSemantics: >
    Wildcards are declarative in v1. A later resolver must expand them to
    concrete discovered tool IDs before passing a runtime allowlist to
    UNITY_MCP_TOOLS.
  setupHints:
    - Existing MCP client setup writes agent configs through cli/src/commands/setup-mcp.ts.

evidenceRequirements:
  visual:
    acceptedSources:
      - screenshot-game-view
      - screenshot-scene-view
      - screenshot-camera
  state:
    acceptedSources:
      - object-get-data
      - gameobject-component-get
      - <future-specialist-resource-uri>
  validation:
    acceptedSources:
      - tests-run
      - <future-specialist-validator-tool>
  debug:
    acceptedSources:
      - console-get-logs
      - editor-application-get-state

feedbackProtocol:
  summaryRequired: true
  evidenceRequired: true
  focusedQuestionRequired: true
  feedbackCaptureRequired: true
  revisionTaskExtractionRequired: true
  resultReportRequired: true

autonomyRiskPolicy:
  defaultMode: autonomous-draft-and-revision
  confirmationRequiredOnlyFor:
    - delete/destroy Approved or canonical assets/GameObjects
    - irreversible overwrite/replace of Approved or canonical assets/GameObjects
  ordinaryFeedbackDoesNotRequireHardApproval: true

assetStateModel:
  - Draft
  - Reviewed
  - Approved
  - Deprecated

handoffHooks:
  conceptualOnly: true
  events:
    - SpecialistTaskRequested
    - SpecialistDraftReady
    - HumanFeedbackReceived
    - RevisionRequested
    - ValidationCompleted
    - DestructiveActionApprovalRequested

acceptanceScenarios:
  - draft-feedback
  - human-revision
  - qa-validation-handoff
  - destructive-confirmation
  - bus-deferral
```

## Profile and allowlist rules

1. Profiles must start from least privilege: list only the prompts, resources,
   and tools needed for the specialist's discipline.
2. Profiles may use wildcards only when the contract documents their semantics.
   V1 wildcards are not executable; a future resolver must expand them to
   concrete tool IDs before runtime use.
3. Profiles must not grant the full default Unity-MCP tool catalog by default.
4. Profiles that include delete/destroy or irreversible overwrite/replace
   capability must also include confirmation metadata.
5. Profile projection should reuse the existing runtime-only `UNITY_MCP_TOOLS`
   allowlist documented in `README.md:572-580`.
6. Agent setup integration should extend, not replace, the current config writer
   flow in `cli/src/commands/setup-mcp.ts:29-152`.

## Feedback and evidence rules

Every specialist chat response that proposes or reports work must include an
`Evidence` section. The section may cite current generic Unity-MCP evidence
primitives or future specialist resources/tools.

| Evidence category | Current accepted source | Repo citation |
| --- | --- | --- |
| Visual preview | `screenshot-game-view`, `screenshot-scene-view`, `screenshot-camera` | `docs/default-mcp-tools.md:102-107` |
| Unity object/component state | `object-get-data`, `gameobject-component-get`, future specialist resources | `docs/default-mcp-tools.md:63-67,96-100`; `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/GameObject.Hierarchy.cs:29-76` |
| Validation/test result | `tests-run`, future specialist validator tools | `docs/default-mcp-tools.md:109-112` |
| Debug/runtime status | `console-get-logs`, `editor-application-get-state` | `docs/default-mcp-tools.md:114-119` |

Minimum chat response shape:

```text
<Specialist Name>:
Intent: <what I believe you want>
Summary: <proposal or completed change>
Evidence:
- Visual: <screenshot/preview/artifact path or why unavailable>
- State: <resource/object/component summary>
- Validation: <test/validator status>
- Debug: <console/editor status>
Question: <one focused feedback question>
Risk: <none, or explicit confirmation needed for a gated action>
Next revision tasks: <structured tasks after feedback is available>
```

## Autonomy and risk rules

Specialists are autonomous by default for inspection, draft creation, variant
creation, reporting, validation, and ordinary feedback/revision loops.

Hard confirmation is required only before:

- deleting or destroying Approved/canonical assets;
- deleting or destroying Approved/canonical GameObjects;
- irreversibly overwriting Approved/canonical assets;
- irreversibly replacing Approved/canonical assets or GameObjects.

Draft-only promotion remains feedback-first unless it replaces or overwrites an
Approved/canonical target. Broad style, gameplay, or product direction changes
should be handled through targeted feedback or handoff to the owning specialist,
not through a generic approval gate.

## Bus-readiness rules

Contracts may name conceptual handoff hooks so a future collaboration bus can
preserve intent. In v1, those hooks are non-executable labels only. A contract
must not require or imply a queue, scheduler, mailbox, polling loop, dispatcher,
or alternate lifecycle owner.

## Contract completeness checklist

- [ ] Identity and discipline are clear.
- [ ] Mission is concrete enough to guide implementation.
- [ ] Role prompts cover role, feedback, and risk behavior.
- [ ] Allowed, forbidden, and confirmation-required scopes are distinct.
- [ ] Resources use URI patterns compatible with existing resource conventions.
- [ ] Tool profile is bounded and maps toward `UNITY_MCP_TOOLS`.
- [ ] Feedback protocol includes summary, evidence, focused question, feedback
      capture, revision extraction, and result reporting.
- [ ] Evidence requirements include visual, state, validation, and debug options.
- [ ] Autonomy/risk policy is feedback-first and not approval-heavy.
- [ ] Bus hooks are conceptual only.
- [ ] Acceptance scenarios cover draft feedback, human revision,
      QA/validation handoff, destructive confirmation, and bus deferral.
