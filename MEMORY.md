# MEMORY.md

## Durable context
- Human: Michael John-Anyaehie (Mj), timezone America/New_York.
- Primary active projects include TechMyMoney workflows and Mjcity tracker/site operations.
- Preferred sub-agent naming normalization:
  - `codemj` is the preferred name for the coding/dev sub-agent previously referred to in logs as `CodeMint-Elite`.
  - Keep `ResearchForge-Elite` distinct from `researchmj`; do not merge or alias those names.

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
