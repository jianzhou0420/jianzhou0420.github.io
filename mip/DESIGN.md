# MIP promo page — design notes & working state

> Read this first when resuming work on the MIP (Embodied Agents Take Control)
> project page in a new conversation. Companion to `../AgentCanvas/DESIGN.md`,
> which documents the shared conventions (preview server, `?edit=1` inline
> editor, no auto-commit).

Last updated: 2026-09-17 (leaderboard tab added).

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

## Site structure: two tabs (2026-09-17)

The MIP site is **two tabs of one site**, SWE-bench style:

| Tab | File / URL | Role |
|---|---|---|
| Overview | `mip/index.html` → `/mip/` | the promo page above |
| Leaderboard | `mip/leaderboard/index.html` → `/mip/leaderboard/` | the probe's official board |

Both pages carry the same `.sitenav` pill (Overview · Leaderboard) in the
topbar; the overview also links out via a hero button, a `.board-more` line
under the §04 board table, and the footer. The leaderboard links back in the
header copy, the submit card and the footer.

**Leaderboard = SWE-bench structure, MIP tokens.** Decided 2026-09-17: copy
swebench.com's *structure* (split tabs → per-split description → filter bar
with a filter dropdown, a "mini-swe-agent only" preset (their "Bash Only"),
filter chips → sticky-header table in a scroll box → note cards → submit
card), but keep the dark MIP palette/fonts so the two tabs read as one site.
No sidebar, no outliner, no light theme. The page overrides
`page-layout.css` to a single 1180 px centered column (`--rail:0`).

- **Data**: `mip/leaderboard/data.json` — one `tabs[]` entry per board
  (`r2rce` minimal · `r2rce-wp` waypoint & hybrid · `vlnverse` · `hmeqa`),
  each with its own `metrics[]` (column key/label/unit/sort direction/digits)
  and `rows[]`. 2026-10-04: the split tabs are drawn as benchmark cards (big
  benchmark name = the label's first ` · ` segment, count pill, one mono
  `sub` line per tab under a "Benchmark" kicker; 4 → 2 → 1 columns at
  900 / 480 px) because the underline tabs made the benchmarks hard to see.
  Same day the board grew to six tabs, Minimal only (the instrumented slam02
  tier stays off the board): `r2rce` · `rxrce` · `hm3d-objnav` · `hmeqa` ·
  `vlnverse` · `r2rce-wp`; the grid takes its column count from the tab count
  (≤ 4 one row, 5–6 three per row). `rxrce` lists only runs on the std body
  (15° / 0.25 m, prompt and simulator agree) — the paper's RxR cells (26 / 39)
  ran on the upstream RxR body with a 15° prompt and are deliberately absent.
  `hm3d-objnav` ranks by SR@1.0 m (`sr`) and prints `sr025` and the official
  `sr01` beside it, `spl` = SoftSPL; values recomputed from each episode's
  `distance_to_goal` + STOP. New-stack rows (EmbodiedScore-envs, habitat-sim
  0.3.3, Claude Code CLI 2.1.289) say so in their `note`. `leaderboard.js` renders everything; adding a run = append a
  row, never touch HTML. Row fields: model / model_org / harness /
  harness_org / effort / interface / n / reps / sr(+_sd) / spl / ne / osr /
  ndtw / cr / tmed / steps / cost (number = USD per episode, or `sub` /
  `local`) / date / cell / verified / os_model / note; `ref: true` rows
  (human tester, self-reported external systems) render struck and unranked.
- **Header (2026-10-04, user's call)**: the title is "Minimal-Interface Probe"
  (not "Zero-shot embodied leaderboard"), no eyebrow line, and the tagline
  "one monocular camera, four primitive actions" is drawn instead of written:
  a `.tools` strip of two cards — `observe()` with a real frame
  (`ep10/obs05.jpg`, viewfinder corners, "512 × 512 RGB") and `step(actions)`
  with four keycaps carrying the verbatim codes (1 forward 0.25 m · 2 left 15°
  · 3 right 15° · 0 stop, amber). Later the same evening the strip was shrunk
  to one ~72 px row (56 px frame, 58 px keycaps), the sentence under it was
  deleted as useless, and the top-left brand on this page became "MIP" (the
  overview page still says "take control").
- **Tabs live on the table (2026-10-04 late, user: tabs looked like a section
  of their own with no link to the table)**: `.board` is one card — the tab
  strip is its top edge (flex, each tab ≥ 178 px, scrolls sideways when
  narrow; active tab shares the card's background under a blue top bar), then
  title + description + filter bar, then the table. No "Benchmark" kicker.
  Tab `sub` lines are short ("minimal", "object goal · by radius", …).
  A few minutes later the user had everything between the strip and the table
  removed: no per-tab title / description, no filter dropdown, no
  "mini-swe-agent only" toggle, no chips, no run count. `leaderboard.js` lost
  that UI code (`passes()` and `state.filters` stay as an unused hook); each
  tab's `title` / `desc` are still in `data.json` but nothing renders them.
- **Experiment setup panel (2026-10-05)**: a full-width disclosure row
  "EXPERIMENT SETUP" sits inside the board between the tab strip and the
  table header (the user did not want a button in the page header). Closed, the
  row shows a one-line hint built from the tab's Split · Success · Turns;
  clicking it expands the key-value panel under it (hidden by default; `?setup`
  in the URL opens it on load). Three groups — Task (Split, Goal, Interface,
  Success, Scenes) · Body (Camera, Body, Simulator) · Budget & agent (Turns,
  Actions, Time, Prompt, Observation). `data.json` top-level `setup` holds the
  group/key order and the shared defaults; each tab's `setup` overrides by key
  (a key absent from both is not drawn; the value "not stated" renders dim).
  Values were read from run configs, not from memory: the five Qwen R2R-CE
  rows ran with 100 turns, waypoint rows with 80–150, ObjNav and HM-EQA with
  150; HM-EQA has its own body (640 × 480, 30° turns, camera tilt, `answer()`
  instead of stop); VLNVerse body is "not stated" (collaborator run).
- **Rank** is by SR, ties by SPL, over the rows currently visible; sorting a
  column never changes rank. Clicking a row opens a details line (cell id, n,
  mean steps, note).
- **口径**: Claude SDK default-effort cells carry the paper's three-run means
  ± s.d. (nDTW/steps/cost omitted for them — not pooled); everything else is
  the canonical single run from `results-data.md` §1/§1b. Two rows follow
  `main.tex` over the ledger: `sdk·opus-4.8·max` SR **56** (ledger 55) and
  the two `gpt-5.6 xhigh` rows (paper effort table only, marked unverified).
  `verified` = run dir in the results workspace (VLNVerse rows and the two
  SDK wp rows fable/opus-5 are headline-only → unverified).
- **Badges**: `weights` (open checkpoint: only local Qwen), `harness`
  (mini-swe-agent and Codex CLI open; Claude Agent SDK counted closed because
  the loop lives in the Claude Code binary), `verified`, `×3`.
- Org dots: Anthropic blue · OpenAI teal · Alibaba violet.
- Headless render gotcha: pass `--force-prefers-reduced-motion` (kills the
  `.reveal` rise) and `--user-data-dir=<tmp>` (else it attaches to the
  running desktop Chrome and hangs); `--virtual-time-budget` hangs on the
  blocked Google-Fonts/gtag fetches — use `--timeout=15000` instead.

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
- Leaderboard: no "compare" chart yet (SWE-bench has one); no per-episode
  matrix; `date` blank for the replicated SDK cells and the paper-only rows.

## 2026-10-06 — VIEW row: "all efforts" · "native harness" · "mini-swe-agent" switches

User first asked to drop every non-default-effort row, then (same night) to keep them behind a switch instead. The board now shows one effort per model — the vendor default — and a VIEW row (between the Experiment-setup row and the table; the switch first sat in the Effort header for an hour, then the user asked for a dedicated row so switches can be combined) holds three chips: `○ ALL EFFORTS +N` reveals the N pinned max / low / xhigh runs (`● ALL EFFORTS` when on; `?efforts=all`), and the harness pair `● NATIVE HARNESS n` (Claude Agent SDK, Codex CLI — the vendor's own loop) / `● MINI-SWE-AGENT n` (one third-party loop over every API), both on by default, turning one off hides that group (`?harness=mini` / `?harness=native`). Chip counts respect the other switches, the tab count badges follow the view, a chip with nothing to show is disabled, rank is always over the rows shown. Data rule in `data.json`: a row whose cell is the vendor-default seat (`…_bare_default`) carries `effort: "default"` and `effort_vendor: "<the vendor's word>"` (gpt-5.5 / 5.6 medium, Codex gpt-5.6 low) — the pill's tooltip and the note say so; pinned runs keep their own word and are the ones the switch hides. Same night: the three Qwen plus rows became `reps: 3` mean ± s.d. rows over 200-turn replications (chain 8), replacing the July 100-turn numbers; the Turns setup line now names only the two local Qwen rows as 100-turn.

## 2026-10-06 — RERUN flag (dev-time, the board is not public yet)

User: "昨天跑的 qwen 的，都是用的 6 actions 的，实验设置和我们 MIP 不一样 … 包括当时跑的 Fable 5.1 和 Opus 5.5，都需要重跑。你先帮我把它们从 Leaderboard 上面摘掉，或者在 Leaderboard 上面标注一下，做个显眼的标注。" Chosen: annotate, not remove. A row may carry `rerun: "<reason>"` in `data.json`; the row stays ranked, but it is amber-tinted with a bar on its left, the model name wears a filled `RERUN` badge whose tooltip is the reason, the reason is the first line of the opened row, and the legend has a `rerun` entry. Remove the key when the replacement row lands (or replace the row).

First use — nine rows, every new-stack run of 2026-10-04 → 10-06 that briefed SIX actions (camera tilt 4/5, the bareES arm's default since 2026-09-08) where the paper's Minimal interface has FOUR (verified in each run's `episode_0.jsonl`): `r2rce` fable-5.1 and opus-5.5 (10-04) and the three Qwen plus ×3 rows (10-05); `rxrce` fable-5.1, opus-5.5 (10-04), fable-5, opus-5 (10-05, the bridge cell). Not flagged: the August old-stack rows (opus-5 08-23, qwen3.8 08-27 — four actions, no tilt in their briefings), the July rows, and the `hm3d-objnav` 10-04 rows (no paper counterpart to match). Re-runs go through the `std_mip_*` experiment files (`n_actions: 4`) in coding-agents.

## 2026-10-07 — first RERUN replacements: R2R-CE fable-5.1 and opus-5.5

User (2026-10-07 00:2x): "Leaderboard 的换行，旧的不留作对照。当然，只针对 Opus 5.5 和 Fable 5.1，其他的还留在 Leaderboard 上面。" The two flagged 2026-10-04 six-action `r2rce` rows (fable-5.1 87, opus-5.5 81) are gone; in their place one ×3 row each from three replications on the paper protocol (`std_mip_r2r_bare_es`, four actions) through the cc adapter with the CLI's own prompt injections switched off (`CLI_QUIET_ENV`, coding-agents 2026-10-06): fable-5.1 83.0 ± 1.7 / SPL 71.3, opus-5.5 82.3 ± 3.5 / SPL 71.3 (cells `std_mip_r2r_cc_<model>_default_bare_es_clean{,_rep2,_rep3}`). Both rows carry `effort_vendor` — the CLI sends its per-model default explicitly: `high` for fable-5.1, `medium` for opus-5.5 (the user chose to keep medium and disclose it). Not touched: the two models' `rxrce` rows (still flagged, not re-run) and the three Qwen rows. Old boards are not kept as comparison rows; they stay on disk and in the paper's disclosure section.

## 2026-10-07 — Codex CLI 0.160.0 rows: gpt-6-astra, gpt-6.1-sol, gpt-5.6 (×3 each)

User (04:3x): "把结果都上板吧". Three ×3 rows on `r2rce` from chains 15/15b (coding-agents outputs/logs/chain_gpt6_codex/): gpt-6-astra 75.7 ± 4.7 / SPL 66.0, gpt-6.1-sol 75.0 ± 1.0 / SPL 62.3, gpt-5.6 (slug gpt-5.6-sol) 56.7 ± 2.5 / SPL 41.8 — the last replicates the paper's 2026-07-17 Codex cell (56 / 41.57), which stays as the paper's number. Codex 0.160.0 as shipped (code mode, its own ~14k-token prompt stack ahead of the briefing); `effort_vendor` = what was sent: low for the two sol slugs (product default, as in July), medium for gpt-6-astra (the product default as served by OpenAI's model list at run time; the list bundled in the 0.160.0 binary says low, and a custom-provider codex falls back to that bundled list — resolved from the Codex source, rust-v0.160.0, models-manager/models.json + core/src/client.rs build_reasoning). `cost: "sub"` as for the other Codex rows.
