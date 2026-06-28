# Positioning — *Automating the Design of Embodied Agent Architectures* (KDLoop)

> Working positioning doc for the CoRL 2026 paper page (`paper.html`) and the paper's
> own intro / related-work framing. **Primary framing = embodied-first** (CoRL audience).
> An alternate **AAS-first** framing (for an agents/LLM venue) is kept at the end.
> Last updated: 2026-06-22.

---

## Thesis (embodied-first)

> Every embodied agent — for vision-language navigation, embodied QA, or manipulation — is a
> **hand-designed architecture**: perception → memory → planning → action, wired by intuition for
> one benchmark and then **frozen**. Our north star is **automated research on embodied agent
> design** — a system that autonomously invents embodied agents and **searches and assembles their
> modules from the ground up**. This paper takes the first, deliberately **method-seeded** step
> toward it: a *coding agent* searches graph edits to a **real, published executor**, scored by
> **simulator rollouts**, and improves agents across all three task families. Seeding from known
> methods keeps the search basin-local *by design* — so alongside the gains we **name the forces
> that bound it**, the map the unobstructed, from-scratch automated research to come will need.

承重在 **embodied + rollout**;coding-agent 是这个 regime 所**要求**的搜索器形态(机制层);
method-seeded 是**临时台阶**,终点是**自动科研**。

---

## Vision & trajectory (北极星 + 现在站在哪)

**North star — automating the *science* of embodied agent design.**
The goal is not one better agent but a system that does the *research*: autonomously
hypothesizing, building, and evaluating embodied agent architectures — down to
**automatically searching and assembling the individual modules** (perception, memory,
planning, action), not just editing a human's design.

**Where this paper sits — the first, *method-seeded* step.**
Today we **seed** the search with published executors and edit their typed graphs. This is a
deliberate scaffold, not the destination: it bounds the search to a **basin** around the seed —
which is exactly why we can isolate and name the regime's obstacles cleanly.

**What it buys the future.**
The four bounding forces are stated as concrete guidance for the **unobstructed, from-scratch**
automated research that follows, so the next step (open-ended design, module-level synthesis)
inherits a map instead of rediscovering the obstacles.

> So the paper's mixed/negative results are not failure — they are **the terrain charted on the
> way to automated research**.

---

## The landscape (three families; we sit in the gap none reach)

**A. Automated agent/architecture design — but on text.** ADAS (arXiv:2408.08435),
AFlow (arXiv:2410.10762), MaAS. A search process designs a target agent for a task — but the
optimizer is a **meta-LLM emitting a self-contained program in one context window**, and a fitness
call is **one cheap deterministic pass on a text benchmark**. By AFlow's own account these
operators *"hinder generalization to … embodied tasks."*

**B. Self-evolving / self-improving coding agents.** SICA (arXiv:2504.15228),
AgentFactory (arXiv:2603.18000), recursive self-improvement. A coding agent edits **itself**
(optimizer = artifact), lifelong/recursive, on coding/general tasks graded cheaply. **This is not
architecture search of a target** — no separate target architecture searched for task fitness.

**C. Embodied agent evaluation.** EmbodiedBench, EmbodiedEval, … Benchmarks that **evaluate**
embodied agents in simulation — they do not **search** their architectures.

**The empty quadrant:** nobody searches an embodied agent's architecture where one fitness
evaluation is an expensive, noisy, stateful **simulator rollout**.

---

## Positioning (embodied angle, four moves)

1. **The problem (embodied's own pain).** Embodied agents are hand-built and frozen; the
   foundation-model era exploded the per-layer design space (which VLM, which memory, which
   planner, how to wire them) far beyond what hand-design can search. There is no automated way to
   design an embodied agent's architecture for a target task.
2. **Why it hasn't been done.** Automated architecture design lived **entirely in the text world**
   (ADAS, AFlow). Embodied evaluation is a **multi-episode simulator rollout** — expensive, noisy,
   stateful — which breaks every assumption text-world search relies on (cheap, deterministic,
   stateless, parallel fitness).
3. **What we deliver to embodied AI.**
   - **Automated, measurable gains** on *published* embodied agents across **navigation, EQA,
     manipulation** — each gain a graph edit a coding agent proposed, ran, and **rerun-verified**.
   - **AgentCanvas (released)** — a typed dataflow-graph runtime that makes rollout-based search
     **affordable** (per-module-aware batch parallelism; kills the straggler tax) and
     **attributable** (per-module logs).
   - **A diagnosis** — the **four bounding forces** of embodied architecture search.
4. **What's new (headline first).**
   > **The first to bring automated architecture design to embodied agents** — searching a real
   > executor's graph under simulator-rollout fitness — and the first to name what that regime
   > does to search.

---

## Contribution stack (none requires KDLoop to win)

1. **Regime + the forced search-time upgrade.** First to formulate embodied architecture design
   and to show it **forces** the optimizer from an in-context meta-LLM to a **codebase-navigating
   coding agent** (a real embodied executor cannot be searched by in-context program emission).
2. **Diagnosis — the four bounding forces.** *evaluation noise · per-iteration cost · basin-local
   convergence under method-seeded search · credit assignment under scalar fitness.* Stated as
   forward guidance for the automated research to come.
3. **Controlled study.** one harness, a **3×4 Optimizer×Executor** matrix, **rerun-confirmed**
   deltas, honest **negative results** ("no graph-level lever beats baseline"), **leak detection**.
4. **Substrate (released) — AgentCanvas.** the typed-graph runtime that makes a coding-agent
   searcher possible at all (affordable rollouts + attributable per-module logs).
5. **KDLoop — our search variant.** evidence-driven four-phase loop
   (*hypothesise → experiment → distill → reflect*) + typed working memory; leaves basins,
   **self-terminates**, **reports null results honestly**. Valued for **diagnosis / interpretability**,
   not leaderboard rank.

---

## What we explicitly do NOT claim

- We do **not** claim KDLoop outperforms ADAS/AFlow. The contribution is **opening, mapping, and
  equipping** the regime; the controlled, honest study **is itself the contribution** — it is what
  lets the field trust any number reported here.
- **method-seeded is a deliberate scope, not the destination.** We do not claim open-ended,
  from-scratch design yet — that is the automated-research goal this paper is the first step toward.

## Boundaries to defend in related work

1. **Architecture search vs self-evolution.** The 2025–26 self-evolving-agents surveys
   (arXiv:2508.07407 / 2507.21046) subsume ADAS-style design under "self-evolution." Our line:
   **optimizer ≠ artifact + design-time search of a target for task fitness.** State it; don't
   assume it.
2. **AgentFactory is the nearest neighbor** (a meta-agent refining executable subagent code).
   Differentiate: **lifelong skill accumulation on general tasks ≠ design-time architecture search
   of a target embodied executor under rollout fitness.**

---

## Alternate framing — AAS-first (for an agents / LLM venue, not CoRL)

Same work, different entry point: lead with **Agent Architecture Search** as the protagonist and
present **two parallel pillars**.

- **Pillar 1 — AAS into the embodied regime.** First architecture search under simulator-rollout
  fitness; the four bounding forces. (*Past:* ADAS/AFlow are text-bound.)
- **Pillar 2 — AAS into the coding-agent era.** Upgrade the optimizer from an in-context meta-LLM
  to a **coding agent over a real, multi-file codebase** (KDLoop). (*Armor:* AAS ≠ self-evolution;
  the upgrade is justified because a real executor codebase can't be searched by in-context
  emission.)
- **Coupling (defensive fallback):** the embodied regime *forces* the coding-agent upgrade — use
  this if a reviewer attacks Pillar 2 as "just a better tool."

Use embodied-first for CoRL; swap to AAS-first only if the venue audience is agents/LLM.

---

## Literature anchors

- ADAS — Automated Design of Agentic Systems — arXiv:2408.08435
- AFlow — Automating Agentic Workflow Generation — arXiv:2410.10762
- SICA — A Self-Improving Coding Agent — arXiv:2504.15228
- AgentFactory — Self-Evolving via Executable Subagent Accumulation — arXiv:2603.18000
- Self-Evolving Agents surveys — arXiv:2508.07407 / arXiv:2507.21046
- EmbodiedBench — arXiv:2502.09560
