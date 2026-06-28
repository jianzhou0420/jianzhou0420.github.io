# AgentCanvas web pages — design notes & working state

> Read this first when resuming work on the AgentCanvas / paper web pages in any new
> conversation. It captures the design rationale, the structure, what's done, what's
> pending, and the gotchas (especially the editor screen-recording pipeline).

Last updated: 2026-06-18 (Part B in-graph Panorama Viewer shipped).

---

## 0. What these pages are (the split)

Two **project pages** + one external **documentary**, deliberately separated:

| Property | File / URL | Purpose | Accent |
|---|---|---|---|
| **Paper project page** | `src/works/AgentCanvas/paper.html` | The CoRL paper *"Automating the Design of Embodied Agent Architectures."* AgentCanvas appears here only as a **brief intro** with a CTA out to the canvas page. | amber |
| **AgentCanvas project page** | `src/works/AgentCanvas/index.html` | The platform itself, showcased in depth. A **project page, not documentation.** | teal |
| **Documentary (docs)** | `https://jianzhou0420.github.io/AgentCanvas/` (separate repo) | Developer docs (capabilities, tutorials, NodeSets, 113+ pages). | — |

**Link topology (a rule from the user):**
- paper page ↔ canvas page — **mutual** links.
- both project pages → documentary — **one-way**.
- documentary → anything — **none**. It must be a *link sink* (no outbound links).
  ⚠️ The live docs site currently still has outbound links (sibling projects / academic
  landing) — needs cleaning into a link-sink. Separate repo; not done here.

The repo is its own git project (`github.com/jianzhou0420/jianzhou0420.github.io`,
GitHub Pages). `src/works.html` lists both the paper and AgentCanvas as separate cards.

---

## 1. Design language (shared by both pages)

**Core concept: "the page *is* a canvas."** AgentCanvas is a node-and-wire graph editor,
so the page is styled as an extension of the product — authentic, not generic AI-slop.

- **Dark node-editor canvas**: near-black ink bg (`#090c13`), faint **dot-grid**
  (`radial-gradient` dots, 26px), corner **glow** gradients, subtle vignette mask.
- **Palette pulled from the paper's figure node-colors**: amber-rust `#ff6a3d`
  (search / edit / "signal" — the paper page's dominant accent), teal `#34e0bf`
  (substrate / env — the canvas page's dominant accent), blue `#5b8cff` (orchestrator),
  violet `#a98bff` (neural policy). Dominant ink + one sharp accent, not evenly spread.
- **Type**: `Archivo` (engineered display) · `Hanken Grotesk` (body) · `JetBrains Mono`
  (ports / labels / code). Deliberately **not** Inter / Space Grotesk.
- **Recurring components**: content framed inside **node cards** (typed header bar with
  coloured port-dots + a mono title); section **eyebrows** with a coloured port dot;
  a sticky left **outliner rail** (editor-style scrollspy nav); reveal-on-load stagger;
  `prefers-reduced-motion` honoured.
- **Growth hooks built in**: OpenGraph / Twitter `summary_large_image` meta on both
  pages (the cheap, high-ROI sharing fix); `gtag` analytics carried over.

---

## 2. Paper page (`paper.html`) — content model

Modeled on the **NVIDIA GEAR ENPIRE** page (`research.nvidia.com/labs/gear/enpire/`),
which the user likes. ENPIRE's lesson: it's a *coding-agent-does-research* paper too, so
its best devices are **process visualizations**, not robot videos. We copied those.

Section order (each is an `<section>` with a mono eyebrow):
00 **Hero** — title, "missing abstraction" tagline, authors (placeholder, under review),
   "Submitted to CoRL 2026", links, and the **teaser video** framed as a node.
01 **Gains** — lead with results: 4 executor gain cards (rerun-confirmed Δ).
02 **Search tree** — *the interactive centerpiece* (ENPIRE "idea tree" analog). Pick
   executor × optimizer → an SVG tree of iterations; height = search-time Δ; best node
   ringed; reverts/probes/leak distinguished; click a node → inspector shows the edit.
   **Built from real data** (`exp/lineage.md` + `trajectory.csv`), all 12 cells embedded
   as a `CELLS` JS object.
03 **Substrate (in brief)** — AgentCanvas basics + **CTA to the canvas page + docs**.
04 **The loop** — proposer→implementer→evaluator + a "representative proposer brief"
   card (prompt-as-communication; the "don't wire in the evaluator GT = leak" guard).
05 **Three proposers** — ADAS / AFlow / KDLoop cards; only the proposer differs.
06 **Results** — interactive **3×4 ΔSR matrix** (hover/tap cell → inspector).
07 **Executors** — 4 executors × 3 task families (coverage / not-a-one-trick).
08 **Limits** — the three honest constraints (eval noise, local basins, partial credit).
09 **Cite** — anonymous BibTeX placeholder.

**The ↻ "port" mark (important, user-requested):** ADAS and AFlow are **our
reimplementations** — ported from their native *LLM-core iteration* (a meta-agent editing
prompt/workflow *text*) into *coding-agent sessions* (editing real code + the typed graph
in our shared harness). KDLoop is native/ours. Every appearance of ADAS/AFlow carries a
`↻` mark (`.pm` span / `optMark()` in JS for dynamic spots: tree title, matrix inspector),
with a callout in §05 explaining it. KDLoop never carries the mark.

**Honesty framing (a real correction baked in):** the search tree shows **search-time Δ**
(single-pass, peaks higher); the matrix shows **rerun-confirmed Δ** (3-pass). The gap *is*
the evaluation-noise story. (Earlier we caught that a paper sentence — "ADAS re-discovers
SR=0.4769 across six iters → revisits a neighborhood" — is contradicted by the data:
those six iters are *different* axes that merely collide on the same scalar. The web copy
was softened to avoid repeating that misread; the paper itself still has it — see
`works/AgentCanvas/.../exp` discussion. Camera-ready fix pending.)

---

## 3. AgentCanvas page (`index.html`) — content model

Content sourced from the paper's **Appendix A** (the AgentCanvas substrate appendix).
Sections: 00 hero (wordmark + tagline "Visual agent design platform… node graphs that
execute in real time" + Docs/Paper/Code links + **editor hero video**) · 01 why (two
interface gaps) · 02 editable typed graph · 03 typed ports + pre-rollout validation ·
04 autonomous batch-optimized evaluate (elastic FM batching) · 05 episode-level evidence
(+ honest limit) · 06 capabilities (7 placeholder cards) · 07 get started.

Marked **`AWAITING ASSET`** placeholder slots are scattered through (NodeSet gallery,
type-check demo, throughput chart, build-a-graph clip, capability details). These are the
TODO list — fill as the user supplies material.

---

## 4. Videos & the editor screen-recording pipeline

**Teaser (paper page hero):** `demo.mp4` = a copy of
`/data/ws_vln/_outputs_archive/conversations/video/composite/composite_sync_22s.mp4`
(the replay segment of the CoRL submission video). This is settled.

**Executor env clips (paper page §08 "executors"):** one short looping clip per
executor card, autoplay/muted/loop, 640×400 (16:10), h264 `+faststart`, served
from `exec/`. **3 of 4 shipped (2026-06-27/28)** — egocentric "what the agent
sees" rollouts; the VoxPoser card stays on the `.eclip-ph` "▶ ENV CLIP"
placeholder (see holdout note below). Each was rendered from a real AgentCanvas
eval in `/data/ws_vln/vlnworkspace`:

| clip | env | how it was made |
|---|---|---|
| `mapgpt.mp4` (9s) | MP3D / MatterSim | reused cached per-step panoramas (`outputs/runs/mapgpt_ep12_6440_0/assets/*panorama.jpg`); cropped the `Front(0°)` cell of the 4×3 heading grid per viewpoint, crossfaded into a discrete-nav walkthrough. Zero new compute. |
| `exploreeqa.mp4` (15s @20fps) | HM3D | **smooth navmesh flythrough re-render.** The cached 48 egocentric frames were one-per-step *teleports* (frontier exploration) → unwatchably jumpy. Fix: pulled the 48 world teleport poses (`observe_egocentric out.pose.position`) from the run log; for each consecutive pair, asked the renderer sim's **navmesh pathfinder** (`habitat_sim.ShortestPath`) for the geodesic walkable path (winds AROUND walls — a straight-line interp clips through them), concatenated + arc-length-resampled to ~300 points for uniform speed, faced the camera along travel direction (yaw=`atan2(-dx,-dz)`, moving-avg smoothed), and re-rendered each via `env_hmeqa/hmeqa_renderer.py` (`HMEQARendererServer._render`, hmeqa env + `LD_PRELOAD=…/nvidia_egl_workaround.so`). Scene `00004-VqCaAuuoeWk`. Script: scratchpad `render_eqa_flythrough2.py`. (HM3D mesh holes are inherent to the reconstruction.) |
| `smartway.mp4` (6s) | VLN-CE / Habitat | fresh `smoke_smartway_ce` run (3 ep, 2/3 succeeded); per-low-level-step forward RGB captured via a guarded tap in `env_habitat.step_hightolow`. |
| `voxposer.mp4` | LIBERO / Franka | **PLACEHOLDER (no clip shipped).** The card shows `.eclip-ph` until a real success is recorded. See note below. |

**VoxPoser holdout (2026-06-28):** the decomposed VoxPoser path
(`voxposer_libero_decomposed`) never succeeds (9/9 historical runs SR=0) due to
the documented gripper-seed trap — so there is no successful grasp to film. A
deep dive fixed the **gripper-continuity** half of it (in
`workspace/nodesets/method/voxposer/_runtime.py`, vlnworkspace): cross-subtask
carry of the commanded gripper + lift/`reset_to_default_pose` inheriting the
in-subtask gripper + truncating a grasp subtask's trailing release waypoints.
Verified via `expand_for_settle` grip_seq: a grasp now ends `…CCCC` (holds the
object) instead of `…CCCoOOO` (drops it). But SR is still 0 across both
`libero_spatial` and `libero_object` because the *execution* layer regressed in
the v4→decomposed decoupling: v4 drove the grasp **closed-loop** (dynamics
controller), decomposed replays planned waypoints **open-loop** and never
achieves a clean physical grasp (descends but doesn't capture / barely engages).
Recording a real VoxPoser clip needs the follow loop reworked to closed-loop —
tracked as a separate task, NOT done here. The archived v4 successes
(`/data/ws_vln/_outputs_archive/outputs/eval_runs/2026052*`) are SR=1 but saved
only ~1 frame/episode (logger node-firing dumps), so they're not filmable and
their env-side nodes were deleted in the refactor.

Re-recording: the two sim taps live in `env_habitat.py` / `env_libero/__init__.py`
behind `outputs/_record/ENABLE` (touch it, run an eval, encode the PNGs under
`outputs/_record/<env>/ep_*/`). SmartWay's server path also needed a real bug fix —
`serialization.unpack_body` now passes `strict_map_key=False` (the predictor returns
int-keyed candidate maps that `pack_body` emits but strict unpack rejected).
Encoding scripts: scratchpad `make_cached_clips.py` (mapgpt/eqa) + `make_run_clips.py`
(smartway/voxposer). A `poster="exec/<name>.png"` can be added per `<video>` later.

**Editor hero (canvas page):** `editor.mp4` — recorded live from the running editor.
Now a **3-act** clip (~37s total, 0.4s crossfades, 1600×900 h264, `+faststart`):

1. **Overview (~9.5s)** — the canvas flythrough (was "Part A"), **sped up 2×**
   (`ffmpeg setpts=PTS/2.0`). Source clip `/tmp/acrec/agentcanvas-editor.mp4`
   (built by `_capture/capture.mjs`); sped clip `_capture/seg_overall_2x.mp4`.
2. **Run it live (~15s)** — the in-graph full-episode run (was "Part B"; details below).
   Clip `_capture/partB_panorama.mp4`, built by `_capture/capture_partB3.mjs`.
3. **Inspect / Logs Detail (~13s)** — go to top-nav **Logs** → pick an execution → the
   **Detail** tab (tabs top-right: Errors / Overall / **Detail** / Canvas) → smooth slow
   **scroll top→bottom** through every node firing (OUTPUTS / NODE LOG / INPUTS, incl. real
   panorama + annotated-marker images, base64 blobs, points). Built by
   `_capture/capture_logs.mjs`; clip `_capture/segC.mp4`.
   - **Logs gotchas:** the Detail scroll container is `div.flex-1.overflow-y-auto`
     (x≈256 — note it starts left of 270, so an `x>270` filter misses it; use `x>240`).
     Content is **lazy-rendered**: `scrollHeight` starts ~14.5k and grows past ~58k as you
     scroll, so "the bottom" is a moving target — the script scrolls a fixed readable
     `CAP=20000`px window through the rich first portion rather than chasing the true end.
     The Executions list is **live** (a backend eval batch keeps appending runs), so a fixed
     list position drifts — the capture script **selects the execution by content** (finds
     the one whose body contains `4332_0` + the lobby instruction), not by position.
   - **Log-system fix (product repo, not this repo):** the Logs Detail view didn't render
     `LIST[IMAGE]` (the 36-view panorama) — it showed a `{count:36}` marker, because the
     backend serialized lists as a count and the frontend had no `LIST[IMAGE]` renderer.
     Fixed in **`/data/ws_vln/vlnworkspace/agentcanvas`** (its own git, **uncommitted**):
     `backend/app/logging/logger.py` (`log_serialize_with_assets` now saves each tile of a
     `LIST[IMAGE]`/`LIST[DEPTH]` as an asset → `{__type:"image_list", items:[...]}`, cap 64);
     `frontend/src/logs/renderers/ImageListRenderer.tsx` (new, tiled thumbnail grid) +
     `registry.ts` (maps `LIST[IMAGE]`/`LIST[DEPTH]`/`image_list`). Backend auto-reloads
     (`uvicorn --reload`); old logs still show the count badge (no per-tile assets stored).
     **Act 3 re-recorded after the fix** so the panorama + candidate tiles render inline.
   - **Act 3 IS aligned to act 2's lobby episode** (`4332_0`, "Walk to the other end of the
     lobby…", scene `8194nk5LbLH`). Canvas Play runs do **not** write to top-nav Logs — only
     **Evaluate** runs do. So to get the lobby log: Evaluate → graph `MapGPT-MP3D` (its
     config exposes Dataset `R2R` / Split `val_unseen` / **Episodes** / **Start from episode 0**)
     → Start → episode 0 (= `4332_0` = lobby) gets logged as an execution → record its Detail.
     `_capture/run_eval_lobby.mjs` runs the eval; `_capture/capture_logs_lobby.mjs` finds +
     scrolls the lobby execution. Note: MP3D eval **cold-start is slow** (~2–3 min to load the
     scene mesh before episode 0 appears); budget-limited so episode 0 logged ~4 steps / 69
     firings — plenty to scroll.

Old 2-act assembly (Overview + Run) retired in favour of the 3-act cut.
- **Part B (~15s)** — ✅ **DONE: full-episode in-graph live run, with graph context.**
  Frame **wide** so the upstream graph reads as context — the bbox spans the **map node**
  (`MapGPT: Update Map`), the **planner** (`MapGPT: Planner LLM`), the pipeline row + wires,
  AND the viewer cluster (**Thinking Log + Action Log + Panorama Viewer**). Press canvas
  **Play** → Panorama Viewer floods with the **36-view panorama** (`media=36`); press the
  **episode-bar Play** → the episode auto-runs **end-to-end (8 steps captured)**, panorama +
  logs + State table updating each viewpoint. A lower-third banner labels the **episode**
  (`8194nk5LbLH (4332_0)`, R2R val_unseen) and the **instruction** ("Walk to the other end
  of the lobby…"). Built by **`_capture/capture_partB3.mjs`** (standalone clip
  `_capture/partB_panorama.mp4`). Pacing: reveal @12fps + 8-step timelapse @30fps.
  - **Why wide, not tight (user feedback):** don't let the viewer fill the whole frame —
    the reader must see a bit of the *map* and the *GPT/planner* nodes + wires so it reads
    as "watch it run **while it runs**." `capture_partB2.mjs` (3-viewer tight) and
    `capture_partB.mjs` (single-node tight) are the earlier, too-tight versions.
  - **Framing trick:** the Panorama Viewer grows a **fixed factor** when data arrives
    (**w ×6.3, h ×9.5**, anchored top-left), so the script pre-sizes the camera to the
    *simulated grown* bbox while everything is still idle (`grownBox()` in the scripts),
    then centre-fits it (`fit()` — pan to centre, zoom via the `.react-flow__controls-*`
    buttons since wheel doesn't zoom). The flood then lands inside the frame. Validate
    framing cheaply with `frame_fit3.mjs` (no live run) before paying for a full episode.
  - **Episode length:** this R2R episode is **long (8+ steps)**; the script caps the live
    run at ~200s. Old Replay-panel Part B retired — script `capture2.mjs`, backup hero
    `/tmp/acrec/editor_prev_replayB.mp4`.

### The capture pipeline (`_capture/`)
- The editor is a live Vite app at **`http://localhost:5173`**
  (`/data/ws_vln/vlnworkspace/agentcanvas/frontend`), backed by a "Connected" server.
- **CRITICAL GOTCHA:** this host **signal-kills any Chrome that opens a remote-debugging
  *port*** (exit 144). One-shot `--screenshot` works; a debug *daemon* does not. So we
  drive Chrome via **`--remote-debugging-pipe`** (CDP over file descriptors, no socket).
  `cdp.mjs` is the pipe client (`launch()` / `send()` / `on()`). Node 22 (has global
  `WebSocket`/`fetch`). Don't use `--remote-debugging-port`.
- Pattern: spawn Chrome as a child of the Node script (it dies with the script),
  `Target.attachToTarget {flatten:true}` → drive via `sessionId`, capture via
  `Page.startScreencast` **or** a timed `Page.captureScreenshot` loop → `ffmpeg` assemble.
- Editor controls (by `title`): **TWO separate Play controls** —
  (a) **toolbar Play** `title=Play` top-left `(26,66)` = run the graph for the *current*
  step (this is what floods the Panorama Viewer; step number does **not** advance);
  (b) **episode-bar Play** `title=Play` in the episode row `(641,98)` = advance the
  *episode* to the next viewpoint (step 0→1→…, ~17s/step). Both have matching Pause/Stop;
  the toolbar row also has **Step** `(90,66)`, and toggles "Toggle viewer nodes" `(535,66)`
  / "Toggle state edges" `(467,66)`. Load a graph = **double-click** its tree row
  (e.g. `MapGPT-MP3D`); **Auto Layout** button top-right.
- **Zoom gotcha:** mouse-wheel does **not** zoom (this React Flow uses pan-on-scroll). To
  zoom headlessly, click the `.react-flow__controls-zoomin` / `-zoomout` buttons (they zoom
  about the viewport centre — so pan the target node to centre first). See `frame_only.mjs`.
- **Framing the Panorama Viewer:** idle node is tiny (~73×38) at the graph's right edge;
  centre it via a pan-drag that **starts on a verified-empty canvas point** (`elementFromPoint`
  with no `.react-flow__node`) — dragging *on* a node moves the node, not the camera. When
  data arrives the node **explodes to ~1137×899** (a 36-tile grid), overflowing a tight
  frame; this is fine — capture at 1600×900 and the right-side grid + Action Log + State
  reads well. `capture_partB.mjs` re-clicks Play once if the viewer hasn't filled by ~10s
  (the first click is sometimes swallowed right after a zoom).

### In-graph Panorama Viewer — ✅ RESOLVED (2026-06-18)
- The MapGPT graph has a **`Panorama Viewer`** node (+ `MP3D: Observe (panorama)`), idle
  **"Waiting…"** until the graph runs.
- **toolbar Play (26,66) drives it live** → ~6s later `media=36`, node fills with the
  36-view panorama grid; **episode-bar Play (641,98)** advances steps (~17s/step). Verified
  repeatedly. The **Replay panel does NOT drive canvas nodes** (separate view) — confirmed.
- Headless framing **solved** via `frame_only.mjs` (cheap, no live run) + `capture_partB.mjs`
  (live). See the framing/zoom/self-heal notes above. Part B now ships from this pipeline.

---

## 5. Status

**Done:** both pages built & styled; interactive search tree (real 12-cell data);
interactive 3×4 matrix; ↻ port marks everywhere; teaser video; Part-A editor flythrough;
**Part-B in-graph Panorama Viewer live run** (editor.mp4, ~28s); og/twitter meta;
`works.html` updated; interlinks wired; docs link = the real docs URL.

**Pending / TODO:**
- ~~Part B → in-graph Panorama Viewer live-run clip~~ ✅ done 2026-06-18 (§4).
- Fill `AWAITING ASSET` slots on the canvas page (NodeSet gallery, capability details,
  type-check & throughput demos, build-a-graph clip).
- Real **authors**, **arXiv** link, **BibTeX** (currently placeholders — under review).
- Add **arXiv IDs** for ADAS (believed `2408.08435`) / AFlow (`2410.10762`) — verify first.
- Confirm the canonical **"seven core features"** for the capabilities grid.
- Clean the **documentary** into a link-sink (separate repo).
- Paper camera-ready: fix the SR=0.4769 "revisits a neighborhood" sentence (§2 note).

---

## 6. Conventions / constraints
- **No auto-commit** — the user commits manually (this repo has its own git remote).
- Double-blind review: real per-iteration data *is* on the page; the user has been OK
  with it so far (flag before adding anything more identifying).
- Local preview: a static server runs at **`http://localhost:8090`** (repo root) →
  `http://localhost:8090/src/works/AgentCanvas/index.html` (and `paper.html`). Serving via
  http (not `file://`) lets the videos autoplay. Restart with
  `python3 <repo-root>/_preview_server.py 8090`. **Use this, not `python3 -m http.server`** —
  stdlib `http.server` ignores HTTP `Range`, so the hero `<video>` can't be **scrubbed**
  (dragging the progress bar fails). `_preview_server.py` adds 206/partial-content support.
  (GitHub Pages honours Range, so the deployed site is seekable regardless.)
- Editor at `:5173` is the **user's** dev server — never kill it; only kill our own
  `--remote-debugging-pipe` Chrome instances.

## 7. In-place text editing (author convenience)

Edit the page copy **in the browser** and save back to the HTML source — no hand-editing HTML.
- Open any page with **`?edit=1`** (e.g. `http://localhost:8090/src/works/AgentCanvas/index.html?edit=1`).
  A floating toolbar appears; every `[data-eid]` element gets a dashed outline and is editable.
- Edit text (inline `<strong>`/`<em>`/links are preserved; paste is forced to plain text;
  Enter commits). **Save** → `POST /save` → `_preview_server.py` rewrites only those elements'
  inner HTML in the `.html` file (minimal diffs, matched by `data-eid`). No save API (e.g. on
  GitHub Pages) → falls back to **downloading** a patched copy of the HTML.
- Public visitors never see it: the script (`/_edit/inline-edit.js`, included before `</body>`)
  no-ops unless `?edit` is present.
- **Editable set** = elements tagged `data-eid` (currently index.html: hero brand/title/tldr/wip
  + 7 section `<h2>` + 7 lead `<p>`). To make more editable, add `data-eid="…"` to the element.
  To enable on `paper.html`, add the same `<script>` line + `data-eid`s.
- Requires the **`_preview_server.py`** preview (not `python -m http.server`) for the write-back.
