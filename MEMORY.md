# MEMORY.md

## Durable context
- Human: Michael John-Anyaehie (Mj), timezone America/New_York.
- Primary active projects include TechMyMoney workflows and Mjcity tracker/site operations.
- Preferred sub-agent naming normalization:
  - `codemj` is the preferred name for the coding/dev sub-agent previously referred to in logs as `CodeMint-Elite`.
  - Keep `ResearchForge-Elite` distinct from `researchmj`; do not merge or alias those names.
- TechMyMoney writing system durable rules:
  - `lumawordpress` and `writemj` must both start with mandatory source-type classification: `short_news` | `review` | `feature_analysis`.
  - Length/style guardrails are mandatory:
    - `short_news`: 180–850 words, with stricter limits for short source material.
    - `review`: 1,000–1,600 words.
    - `feature_analysis`: 2,000–3,800 words.
  - `lumawordpress` requires LUMA workflow enforcement before drafting: Director, Designer, and Marketer pass.
  - Media rights policy is mandatory in-flow:
    - label media as `OWNED` / `LICENSED` / `PRESS-ASSET` / `THIRD-PARTY-UNLICENSED` / `UNKNOWN`.
    - do not auto-reuse Engadget/The Verge images.
  - Newsmag policy is mandatory: required draft fields plus template/media compatibility checks before handoff.
  - WordPress output defaults to draft-only, never auto-publish, and must include required completion report fields.
  - Safety rules are strict: no fabrication, no padding, no auto-publish, and uncertainty callouts when facts are not fully confirmed.
  - `writemj` specific rules:
    - enforce human-style, anti-generic writing.
    - when the user provides a source link and asks for a rewrite/recreation, mirror the source article's effective writing shape and reading tempo while making TechMyMoney's version better and more original.
    - if the source is short, write a short post; if the source is long/review-style/feature-style, match that scale and structure within the allowed source-type band.
    - TechMyMoney short posts should stay tight because tech readers consume many stories quickly; do not bloat short-source rewrites with unnecessary padding.
    - avoid AI-summary voice, generic transitions, and inflated explanatory filler; the piece should read like a real tech publication written by a human editor.
    - claim-point source-linking standard is required, not just footer-only source dumping.
    - WordPress formatting guardrails are mandatory: no literal markdown tokens in final WP draft and no wall-of-text single block; use clean multi-paragraph block structure.
    - media rights + Newsmag policy must be applied during drafting, not as an afterthought.
    - cron-ready output contract is required: return type, word count, post ID/edit URL when applicable, source links, media rights status, and other completion metadata needed for morning review/publish workflow.
  - `lumawordpress` should follow the same source-shape mirroring principle: match short/long/review/feature energy to the source and improve it, rather than flattening everything into one generic house style.
- Mj is preparing to return to work after roughly 3 months recovering from surgery and wants reliable overnight cron-driven TechMyMoney drafting so he can review posts in the morning before publishing.

## Workspace governance decisions
- 2026-02-26: Core always-loaded files were intentionally slimmed to reduce baseline context cost.
- Detailed heartbeat and group-chat behavior moved into dedicated local skills:
  - `skills/heartbeat-ops/SKILL.md`
  - `skills/chat-participation/SKILL.md`
- 2026-03-22: Mj requested an "ULTIMATE MEMORY SYSTEM / ZERO FORGETTING PROTOCOL" operating rule. Practical interpretation:
  - Read `USER.md`, `MEMORY.md`, and recent daily notes at session start.
  - For meaningful multi-step work, write progress/decisions/errors into `memory/YYYY-MM-DD.md` during the task, not only at the end.
  - Store durable project state, decisions, constraints, and resume points in `MEMORY.md` when they matter across sessions.
  - Before answering questions about prior work, decisions, people, preferences, or open loops, check memory first instead of guessing.
  - Treat "write early, write often, protect before compaction" as the default memory discipline.
