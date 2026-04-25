# Game Pipeline Specialists

This directory defines the v1 specialist-agent architecture for Unity-MCP.
Specialists are **contracts before workers**: a specialist contract describes the
role, scope, tool/resource profile, feedback behavior, evidence expectations, and
risk boundaries that a future runtime can project into prompts, resources, tools,
and MCP client configuration.

## v1 package

| Document | Purpose |
| --- | --- |
| [`architecture-v1.md`](architecture-v1.md) | Boundary model for Specialist Contracts, Specialist Profiles, Feedback Sessions, and deferred Collaboration Bus Events. |
| [`specialist-contract-v1.md`](specialist-contract-v1.md) | Reusable contract template and profile/allowlist rules for all future specialists. |
| [`migration-roadmap-v1.md`](migration-roadmap-v1.md) | Staged migration from docs/contracts to optional fixtures, Animator resources, draft tools, and future bus work. |

## v2 first-slice planning package

| Document | Purpose |
| --- | --- |
| [`architecture-v2.md`](architecture-v2.md) | Parallel v2 boundary model, ownership rules, and first-slice proof target. |
| [`agent-chat-feedback-protocol-v2.md`](agent-chat-feedback-protocol-v2.md) | Typed review-session artifact and guide-first feedback contract for v2. |
| [`animator-specialist-v2.md`](animator-specialist-v2.md) | Animator as the only runtime-backed v2 first-slice specialist. |
| [`specialist-selection-guide-v2.md`](specialist-selection-guide-v2.md) | Selection/routing rules for the first-wave specialist roster. |
| [`first-wave-catalog-v2.md`](first-wave-catalog-v2.md) | Truthful first-wave roster status: grounded vs guide-level vs deferred. |
| [`prompt-architecture-v2.md`](prompt-architecture-v2.md) | Guide/output/persona layering and prompt-pack fixture rules for chat + MCP usage. |
| [`specialist-injection-policy-v2.md`](specialist-injection-policy-v2.md) | Canonical v2 policy for when/how specialist layers may be injected across chat, MCP, and review follow-up flows. |
| [`mcp-usage-guide-execution-rules-v2.md`](mcp-usage-guide-execution-rules-v2.md) | Canonical v2 rules for how grounded vs guide-level vs deferred specialists may execute MCP evidence gathering. |
| [`promotion-criteria-v2.md`](promotion-criteria-v2.md) | Truthfulness-safe criteria for promoting UI/Sound/Gameplay beyond their current first-slice status. |
| [`first-wave-prompts-v2.md`](first-wave-prompts-v2.md) | Prompt-pack rollout status for Animator, UI, Sound, and Gameplay. |
| `cli/examples/specialists/v2/first-wave-prompt-registry.v2.json` | Internal registry linking first-wave prompt packs to specialist docs/runtime status. |
| [`ui-specialist-v2.md`](ui-specialist-v2.md) | Guide-level UI specialist definition and prompt-pack linkage. |
| [`sound-specialist-v2.md`](sound-specialist-v2.md) | Guide-level Sound specialist definition and prompt-pack linkage. |
| [`gameplay-specialist-v2.md`](gameplay-specialist-v2.md) | Deferred Gameplay specialist definition and prompt-pack linkage. |

## v1 boundaries

1. **Specialist Contract** — static role/scope/evidence/risk description.
2. **Specialist Profile** — runtime projection into prompts, resources, tool
   allowlists, and client setup hints.
3. **Feedback Session** — chat-reviewable iteration record with summary,
   evidence, one focused question, feedback capture, revision tasks, and risk
   notes.
4. **Collaboration Bus Events** — future-compatible event names only; no queue,
   scheduler, mailbox, dispatcher, or lifecycle owner is introduced in v1.

## Repo grounding

The architecture intentionally reuses current Unity-MCP extension points:

- Unity plugin registration already assembly-scans Tools, Prompts, Resources,
  and Skills in
  `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Runtime/UnityMcpPlugin.Build.cs:144-147`.
- Runtime tool restriction already exists through `UNITY_MCP_TOOLS`, documented
  as a runtime-only allowlist in `README.md:572-580`.
- Existing default tool categories provide baseline evidence primitives in
  `docs/default-mcp-tools.md:53-123`.
- MCP client setup already resolves and writes selected agent configs in
  `cli/src/commands/setup-mcp.ts:29-152`.

## Non-goals for this package

- Do not implement all specialists in v1.
- Do not implement a collaboration bus in v1.
- Do not rewrite MCP transport, registration, or client configuration.
- Do not make every specialist action approval-gated; the default interaction is
  feedback-first, with hard confirmation reserved for delete/destroy or
  irreversible overwrite/replace of Approved/canonical assets or GameObjects.
