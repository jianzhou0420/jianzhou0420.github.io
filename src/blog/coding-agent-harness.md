# Inside the Coding-Agent Harness

The coding agent is the one agent that clearly crossed into autonomous, long-horizon ReAct — and the reason is not the model alone. It is **Base Model × Harness**. This piece dissects the harness half: what today's coding agents actually provide around the model. It is the control case for the companion piece on embodied agents — almost every item below is *free* in code and has to be rebuilt from scratch in the physical world.

> Mostly system-agnostic anatomy; each section names 1–2 real systems as illustration.

## 0. The loop

- ReAct: **think → act → observe**, repeated until done; the model owns the control flow.
- Autonomy = Base Model × Harness; neither half works alone.
- *e.g.* SWE-agent calls this the **Agent-Computer Interface (ACI)** — argues interface design moves benchmark scores as much as the model. (Yang et al., NeurIPS 2024, arXiv:2405.15793)

## 1. Tools

- Core set: read / edit / write files, code search (grep/glob), shell (bash), run tests; lately web + MCP.
- Uniform contract: **text in, text out**; synchronous; cheap; reversible; local.
- *e.g.* Claude Code exposes Read/Edit/Write/Grep/Glob/Bash. Aider edits via **search/replace blocks** so changes apply precisely.

## 2. State / workspace

- The **filesystem + git repo *is* the state** — persistent, symbolic, fully inspectable.
- No separate "state" primitive: state lives behind file tools (`read_file`, `grep`); plus memory files (CLAUDE.md / AGENTS.md / .cursorrules).
- *e.g.* Aider's **repo map** (tree-sitter); Cursor's **codebase index** (embeddings) to fetch relevant files cheaply.

## 3. Verification

- compiler · type-checker · linter · unit/integration tests · CI → **clear pass/fail**, explicit error text the model can read.
- *e.g.* **SWE-bench**: a fix counts only if the repo's own tests flip the right way — FAIL_TO_PASS go red→green, PASS_TO_PASS stay green. (Jimenez et al., ICLR 2024, arXiv:2310.06770)

## 4. Recovery & credit assignment

- Failures arrive as **stack traces / compiler errors / failed assertions** → localize to `file:line`.
- Rollback is near-free: git diff / revert, checkpoints, re-run.
- *e.g.* **Cline** auto-checkpoints after every tool call (shadow git, with file/task restore modes); git diff/revert as undo; Claude Code works on a branch and shows diffs.

## 5. Safety & authority

- Sandboxing (file / network / command scope), **permission prompts + allowlists**, approval gates for risky ops, git as the net.
- *e.g.* OpenAI **Codex CLI** approval modes (suggest / auto-edit / full-auto) + sandbox (workspace-write … danger-full-access); **OpenHands** runs each session in an isolated Docker sandbox. (arXiv:2407.16741, ICLR 2025)

## 6. Context / memory

- Context window is finite → **summarization / compaction**, sub-agents, memory files, retrieval (RAG / index), MCP for external tools.
- *e.g.* Claude Code **sub-agents + CLAUDE.md + MCP**; Aider's **repo map** keeps the working context small.

## Why this is the control case

Every row above is something a coding agent gets *for free* from a 50-year-old, standardized, text-based workspace. The companion piece — *What It Takes to Build a ReAct-Style Embodied Agent* — walks the same six rows and asks what it takes to rebuild each one in a world that has none of them.
