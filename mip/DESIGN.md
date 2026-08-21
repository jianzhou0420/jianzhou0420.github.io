# MIP promo page — design notes & working state

> Read this first when resuming work on the MIP (Embodied Agents Take Control)
> project page in a new conversation. Companion to `../AgentCanvas/DESIGN.md`,
> which documents the shared conventions (preview server, `?edit=1` inline
> editor, no auto-commit).

Last updated: 2026-08-04 (initial build).

## What this page is

Project page for **"Embodied Agents Take Control: Minimal-Interface Zero-Shot
Agents Rival Industrial-Scale Policies in Vision-and-Language Navigation"**
(arXiv:2607.26148, internally "MIP" = Minimal-Interface Probe). A paper page,
not a platform page — the AgentCanvas analog is `paper.html`, not `index.html`.

`partials/papers.html` card links here; `src/works/TEAPS/` was retired
(`teaser.png` git-mv'd in).

## Design language

Family style shared with the AgentCanvas pages (dark ink bg, Archivo / Hanken
Grotesk / JetBrains Mono, node-style cards, outliner rail, mono eyebrows), but
the motif is **"the page is the agent's session"**, not "the page is a canvas":

- background = faint **scanlines** (not the canvas dot-grid);
- cards are **terminal windows** (`.term`), transcripts use `✱ thinking`
  (italic muted) / `> step([...])` (mono blue) rows;
- dominant accent = **blue `#5b8cff`** (canvas page owns teal, paper page owns
  amber). Chart two-series pairing `#5b8cff` + `#e0703a` passed the dataviz
  palette validator on the `#0a0d14` chart surface; external systems render as
  hollow `#4a5878` bars, human reference as a dashed gray line.

## Sections

00 hero (55/72/78/94 stat strip + hero.mp4) · 01 the shift (taxonomy SVG:
policy / workflow / agentic×zero-shot) · 02 the probe (removed-vs-remaining +
verbatim system prompt) · 03 watch it run (**interactive episode player**) ·
04 results (landscape SVG + harness×model board table) · 05 what moves it
(capability-axes SVG, panels A/B/C) · 06 limits (F1–F4) · 07 cite.

## Data provenance (everything is real, verbatim)

- **Episode player + hero video**: episode 10 of
  `vlnworkspace/outputs/beta-react-harness/std_mini_fable-5_bare_default/`
  (mini-swe-agent × fable-5 — the same episode as the paper's Fig. 2).
  Frames = `live_10/obs_*.png` (20 × 512²) → `ep10/obs01..20.jpg`; thinking
  text + step() args parsed from `episode_10.jsonl` into `player.js` (const
  `EP`). Amber segments 5–8 and 14–15 mirror fig2's amber tokens. Outcome:
  SUCCESS, 2.98 m, SPL 0.70, 111 primitives, 332 s.
- **Numbers**: paper repo `works/MIP/paper/main.tex` (Table 1 landscape,
  Table 2 board, hybrid table) + `results-data.md` §1/§1b (model sweep, wp
  rescues, VLNVerse/HM-EQA transfer). Human 94 = review-mode row.
- **System prompt**: verbatim from `session_inputs` in the episode log.
- **hero.mp4** (1600×900, 50.6 s, h264 +faststart): offline-composed replay —
  left typewriter transcript, right obs frames. Generator:
  session scratchpad `make_hero.py` (uses JetBrains Mono TTFs + the run dir
  above; PIL + ffmpeg, no live run needed). `hero_poster.jpg` = t≈14.5 s frame.

## Paper-alignment audit (2026-08-04, vs AAAI main.tex)

Full pass against the AAAI manuscript; the page now mirrors it: §01 avoids the
"third paradigm" framing (uses the paper's "the model itself holds the loop");
taxonomy figure — MapGPT (not AgenticNav) in the workflow exemplars, AgenticNav
acknowledged as agentic×zero-shot with tools; landscape — zero-shot rows are
SmartWay + AgenticNav + ours; axes fig B uses the paper's Fig 3B values
(Claude SDK arms = replication means; gpt-5.6 = 56|60); axes fig C carries the
shrinking-gain gradient (+37/38 → ~+9 → +0.7–1.3) and VLNVerse reversal;
limits F1–F6 restate §4.6 (silent + route-level failure, self-diagnosis
without self-correction), the RxR-CE 70→26 ceiling, the 33k/169k context +
206 s barrier, effort ±, and the Go2 "reasoning transfers, embodiment does
not". mini-swe-agent is "a few hundred lines" (appendix), not "~100 lines".

Later same day: §05's hand-drawn axes SVG was replaced by the paper's actual
Fig 3 (`capability_axes.png`, 300-dpi render of paper `fig/capability_axes_v2.pdf`,
light paper bg kept inside the dark card); the landscape was redrawn bigger
(860×700, 11.5px labels) with BOTH Table-1 axes encoded uniformly — group =
control authority, per-row T/ZS badge = capability source (paper Fig-1
notation), visual input in every label. Grays lifted for contrast
(muted #8b94ab→#9da8c0, faint #586079→#6e7994, board data → body ink);
hero.mp4 still bakes the old grays. §01's hand-drawn taxonomy SVG was also
replaced by the paper's real Fig 1 (`fig1_teaser.png` ← `fig/fig1_teaser_wide.pdf`,
white margins trimmed — NOT `fig1_taxonomy.pdf`, a retired alternate asset),
caption rewritten from the paper's Fig-1 caption.

## Gotchas

- `player.js` must never call `scrollIntoView` on tape chips — it vertically
  scrolls the whole page on load. Horizontal `tape.scrollTo` only.
- Headless render checks need `--virtual-time-budget` ≥ 6000 or the
  `.reveal` animations are caught mid-rise.

## Pending / TODO

- Consider a second clip (SDK/Claude-Code-branded session, or a waypoint
  hybrid episode) for §05.
- OG image is currently `teaser.png` (the paper teaser); a dedicated
  1200×630 social card could replace it.
- Real-robot (Go2) appendix material is not surfaced anywhere on the page.
