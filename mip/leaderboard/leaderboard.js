/* MIP leaderboard — renders data.json into the SWE-bench-style board.
   Structure mirrors swebench.com (split tabs → description → filter bar →
   sticky-header table → note cards); tokens come from the MIP overview page. */
(function () {
  "use strict";

  const ORG_CLASS = { "Anthropic": "org-anthropic", "OpenAI": "org-openai", "Alibaba": "org-alibaba" };
  const VENDOR_TEXT = { "Anthropic": "v-a", "OpenAI": "v-o", "Alibaba": "v-q" }; // model IDs coloured by vendor (.mid in the page css)
  const OPEN_HARNESS = { "mini-swe-agent": true, "Codex CLI": true, "Claude Agent SDK": false };
  const HARNESS_URL = {
    "mini-swe-agent": "https://github.com/SWE-agent/mini-swe-agent",
    "Codex CLI": "https://github.com/openai/codex",
    "Claude Agent SDK": "https://github.com/anthropics/claude-agent-sdk-python"
  };

  // 2026-10-15 (user: 主表默认只开minimal): every tab opens with only the Minimal interface chip on; "all" turns the rest back on
  // 2026-10-15 (user: mini-swe-agent 也 default 关闭，3.8max 除外): the mini-swe-agent chip starts off, but qwen3.8-max
  // (which only ever ran on mini-swe-agent) stays visible through `keep`; touching any Harness chip drops the exception
  const defaultFilters = () => ({ interface: new Set(["minimal"]), harness: new Set(["Claude Agent SDK", "Codex CLI"]) });
  const defaultKeep = () => new Set(["qwen3.8-max", "qwen3.7-plus", "qwen3.6-plus", "qwen3.5-plus"]); // 2026-10-16: the 3.5–3.7-plus rows too (in the paper's cost appendix)
  const state = { tab: null, sort: { key: "sr", dir: "desc" }, miniOnly: false, filters: defaultFilters(), keep: defaultKeep(), paper: true, saved: null, open: new Set(), unfolded: new Set(),
                  setupOpen: /[?&]setup\b/.test(location.search), // ?setup opens the experiment-setup panel on load (shareable link)
                  // 2026-10-09 (user): the Effort column is retired — every board row is the vendor-default effort, and the
                  // Interface column (minimal / waypoint / hybrid) takes its place. Rows with a pinned effort (max / low /
                  // xhigh / medium) stay in data.json for the record but are never shown; `effort` is no longer a switch.
                  iface: null, // the open tab of the Interfaces section at the bottom (ids from interfaces.json)
                  // 2026-10-09 (user: 给主表多放几个按钮，可以控制开关的，比如 interface、harness、model): the VIEW block is four
                  // chip groups — Interface, Harness (one chip per harness, replacing the 2026-10-06 native / mini pair),
                  // Vendor, Model — every chip is its own on/off switch; `filters[key]` holds the allowed values of a group
                  // (absent = everything on), a tab click resets them, the tab count follows them.
                };
  const VIEW_GROUPS = [
    { key: "interface", label: "Interface", order: ["minimal", "waypoint", "hybrid", "slam", "hybrid-slam"], fmt: v => IFACE_LABEL[v] || v },
    { key: "harness", label: "Harness", order: ["Claude Agent SDK", "Codex CLI", "mini-swe-agent"], fmt: v => v },
    { key: "model_org", label: "Vendor", order: ["Anthropic", "OpenAI", "Alibaba"], fmt: v => v },
    { key: "model", label: "Model", order: [], fmt: v => v, fold: true } // 2026-10-15 (user: model 那一栏折叠掉，太多了晃眼睛): folded until clicked
  ];
  // 2026-10-06 (user): a row may carry `rerun: "<reason>"` — a dev-time flag, the board is not public yet. The row stays
  // ranked but is tinted, its model name wears a RERUN badge whose tooltip is the reason, the reason opens with the
  // details. Remove the key when the replacement row lands.
  let DATA = null, IFACES = null;
  // data files sit next to this script, so the board renders on /mip/ (the project page, 2026-10-15) and here alike
  const BASE = new URL(".", document.currentScript.src);
  const IFACE_LABEL = { minimal: "Minimal", waypoint: "Waypoint", hybrid: "Hybrid", slam: "SLAM", "hybrid-slam": "Hybrid + SLAM" };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const fmt = (v, d) => (v == null ? "—" : (typeof v === "number" ? v.toFixed(d) : String(v)));

  // ---------- URL state ----------
  function readHash() {
    const h = location.hash.replace(/^#/, "");
    if (h && DATA.tabs.some(t => t.id === h)) state.tab = h;
    if (h.startsWith("iface-") && IFACES && IFACES.interfaces.some(i => i.id === h.slice(6))) state.iface = h.slice(6);
  }
  function writeHash() { history.replaceState(null, "", "#" + state.tab); }

  // ---------- tabs ----------
  function renderTabs() {
    const list = $("#lb-tablist"); list.innerHTML = "";
    DATA.tabs.forEach(t => {
      const b = el("button", "tablink" + (t.id === state.tab ? " active" : ""));
      b.dataset.tab = t.id; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", t.id === state.tab);
      b.title = t.title || t.label;
      // label "R2R-CE · minimal" → benchmark name first, qualifier (or the tab's `sub`) on the second line
      const parts = String(t.label).split(" · ");
      b.appendChild(el("span", "bench", parts[0]));
      const n = t.rows.filter(r => !r.ref && passes(r)).length; // the count follows the VIEW switches
      b.appendChild(el("span", "count", String(n)));
      b.appendChild(el("span", "sub", t.sub || parts.slice(1).join(" · ") || ""));
      b.addEventListener("click", () => { state.tab = t.id; state.filters = defaultFilters(); state.keep = defaultKeep(); state.paper = true; state.saved = null; state.open.clear(); state.sort = { key: "sr", dir: "desc" }; writeHash(); renderAll(); });
      list.appendChild(b);
    });
  }

  function tab() { return DATA.tabs.find(t => t.id === state.tab); }

  // ---------- filters: no UI on the page since 2026-10-04; passes() keeps the hook ----------
  function facetValues(rows, key) { return [...new Set(rows.filter(r => !r.ref).map(r => r[key]).filter(Boolean))]; }

  function isPinned(r) { return !r.ref && !!r.effort && r.effort !== "default"; } // an explicitly pinned effort (max / low / xhigh …)
  function effortOK(r) { return !isPinned(r); } // pinned-effort rows are never shown (2026-10-09)
  function viewOK(r) { return effortOK(r); }
  // a row passes every chip group except `skip` (faceted counts: a chip's count is over the rows the OTHER groups let through)
  function filtersOK(r, skip) {
    if (state.paper && !r.paper_main) return false;
    for (const k in state.filters) { if (k === skip) continue; if (!groupOK(r, k)) return false; }
    return true;
  }
  function groupOK(r, k) { return state.filters[k].has(r[k]) || (k === "harness" && state.keep.has(r.model)); }

  function passes(r) {
    if (r.ref) return true;
    if (!viewOK(r)) return false;
    if (state.miniOnly && r.harness !== "mini-swe-agent") return false;
    if (state.paper && !r.paper_main) return false; // 2026-10-15 (user): the paper's main table, on by default
    for (const k in state.filters) {
      if (k.startsWith("prop:")) { if (!rowProp(r, k.slice(5))) return false; }
      else if (!groupOK(r, k)) return false;
    }
    return true;
  }

  // ---------- table ----------
  function sortRows(rows, metrics) {
    const m = metrics.find(x => x.key === state.sort.key);
    const dir = state.sort.dir === "asc" ? 1 : -1;
    const key = state.sort.key;
    return rows.slice().sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") { if (av !== bv) return (av - bv) * dir; }
      else { const c = String(av).localeCompare(String(bv)); if (c) return c * dir; }
      // tie-break: SR desc, then SPL desc
      if (key !== "sr" && a.sr !== b.sr) return (b.sr || 0) - (a.sr || 0);
      return (b.spl || 0) - (a.spl || 0);
    });
  }

  function badge(cls, text, tip) { return `<span class="badge ${cls}" title="${tip}">${text}</span>`; }

  function propsHTML(r) {
    const out = [];
    out.push(r.os_model ? badge("on", "weights", "Open weights: the model checkpoint is publicly released") : badge("off", "weights", "Closed weights: served through a vendor API"));
    out.push(OPEN_HARNESS[r.harness] ? badge("on", "harness", "Open harness: the agent loop is open source") : badge("off", "harness", "The agent loop runs inside a vendor binary (Claude Code CLI); only the SDK wrapper is open"));
    out.push(r.verified ? badge("on", "verified", "Run directory (per-episode logs + summary.json) is in the results workspace") : badge("off", "verified", "Headline number only: run directory not in the results workspace"));
    if (r.reps) out.push(badge("rep", "×" + r.reps, "Mean over " + r.reps + " independent replications"));
    return out.join("");
  }

  function timeHTML(sec) { return sec < 120 ? `${sec}<small class="unit">s</small>` : `${(sec / 60).toFixed(1)}<small class="unit">min</small>`; }

  // 2026-10-15 (user: 加个注释，说明是 API 超时): rows where ≥5 % of episodes ran into the 2400 s wall-clock limit
  const tmoTip = r => `${r.timeouts[0]} of ${r.timeouts[1]} episodes hit the 2400 s wall-clock limit: the DashScope API stalled, so time is inflated and those episodes count as failures`;
  function tmoHTML(r) { return r.timeouts ? `<sup class="tmo" title="${tmoTip(r)}">†</sup>` : ""; }

  function costHTML(r) {
    if (r.cost == null) return "—";
    if (typeof r.cost === "number") return "$" + r.cost.toFixed(2);
    return { sub: "<span class=\"dim\" title=\"Run on a subscription plan; no metered cost\">sub</span>", local: "<span class=\"dim\" title=\"Served locally; no API cost\">local</span>" }[r.cost] || r.cost;
  }

  function metricCell(r, m, maxv) {
    const v = r[m.key];
    if (v == null) return `<td class="num dim${m.bar ? " srcell" : ""}">${m.bar ? '<div class="barcell"><div class="bar"></div>' : ""}<span class="numwrap"><span class="v">—</span><span class="sd"></span></span>${m.bar ? "</div>" : ""}</td>`;
    const sd = r[m.key + "_sd"];
    const digits = (sd != null && m.digits === 0) ? 1 : m.digits; // replicated means keep one decimal
    // fixed-width value + s.d. slots so ×3 rows line up with single runs
    let html = `<span class="numwrap"><span class="v">${fmt(v, digits)}</span><span class="sd">${sd != null ? "±" + fmt(sd, m.digits === 0 ? 1 : m.digits) : ""}</span></span>`;
    if (m.bar) {
      const w = Math.max(0, Math.min(100, (v / (maxv || 100)) * 100));
      html = `<div class="barcell"><div class="bar"><i style="width:${w.toFixed(1)}%"></i></div>${html}</div>`;
    }
    return `<td class="num${m.bar ? " srcell" : ""}">${html}</td>`;
  }

  function renderTable() {
    const t = tab(); const wrap = $("#leaderboard-container"); wrap.innerHTML = "";
    const metrics = t.metrics;
    const visible = t.rows.filter(passes);
    const ranked = sortRows(visible.filter(r => !r.ref), metrics);
    const refs = visible.filter(r => r.ref).sort((a, b) => b.sr - a.sr);
    // rank by SR regardless of current sort
    const bySR = ranked.slice().sort((a, b) => (b.sr - a.sr) || ((b.spl || 0) - (a.spl || 0)));
    const rank = new Map(); bySR.forEach((r, i) => rank.set(r, i + 1));
    const maxBar = metrics.find(m => m.bar) ? 100 : 0;

    const box = el("div", "table-responsive");
    const table = el("table", "table lb");
    const thead = el("thead");
    const hr = el("tr");
    const cols = [
      { key: "rank", label: "#", cls: "col-rank" },
      { key: "model", label: "Model", cls: "col-model", sortable: true },
      { key: "harness", label: "Harness", cls: "col-harness", sortable: true },
      { key: "interface", label: "Interface", cls: "col-iface", sortable: true, tip: "The tool set the model was given — defined in full in the Interfaces section at the bottom of the page" }
    ];
    metrics.forEach(m => cols.push({ key: m.key, label: m.label, cls: "col-metric num", sortable: true, tip: m.tip, arrow: m.dir }));
    // 2026-10-15 (user): Date + Properties out, efficiency in — median wall-clock and median model calls per episode,
    // pooled over the row's replications, every episode counted (failures too); same parsing as the paper's cost figure
    cols.push({ key: "tmed", label: "Time", sub: "median", cls: "col-eff num", sortable: true, tip: "Median wall-clock time per episode (failed episodes included; pooled over replications)", arrow: "asc" });
    cols.push({ key: "calls", label: "Calls", sub: "median", cls: "col-eff num", sortable: true, tip: "Median model calls (LLM turns) per episode (failed episodes included; pooled over replications)", arrow: "asc" });
    cols.push({ key: "cost", label: "Cost", sub: "median", cls: "col-cost num", sortable: true, tip: "Median API-equivalent USD per episode, pooled over the row's runs: the runs used subscriptions, so this is what the same tokens would cost through the vendor API at list price", arrow: "asc" });
    cols.forEach(c => {
      const th = el("th", c.cls + (c.sortable ? " sortable" : "") + (state.sort.key === c.key ? " sorted " + state.sort.dir : ""));
      th.innerHTML = `<span>${c.label}${c.arrow ? `<small class="dirhint">${c.arrow === "asc" ? "↓" : "↑"}</small>` : ""}</span>${c.sub ? `<small class="thsub">${c.sub}</small>` : ""}`; // 2026-10-15 (user): say on the header that Time is the median
      if (c.tip) th.title = c.tip;
      if (c.sortable) th.addEventListener("click", () => {
        const m = metrics.find(x => x.key === c.key);
        if (state.sort.key === c.key) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
        else state.sort = { key: c.key, dir: m ? m.dir : c.arrow || "asc" };
        renderTable();
      });
      hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);

    const tbody = el("tbody");
    const rowHTML = (r, i) => {
      const tr = el("tr", (r.ref ? "ref" : "") + (r.rerun ? " rerun" : "") + (state.open.has(r) ? " open" : ""));
      const orgCls = ORG_CLASS[r.model_org] || "org-other";
      let h = `<td class="col-rank">${r.ref ? "<span class=\"refmark\" title=\"Reference row, not ranked\">ref</span>" : rank.get(r)}</td>`;
      h += `<td class="col-model"><div class="model"><span class="orgdot ${orgCls}"></span><div><div class="mname${VENDOR_TEXT[r.model_org] ? " mid " + VENDOR_TEXT[r.model_org] : ""}">${r.model}${r.rerun ? badge("rerun", "rerun", r.rerun) : ""}</div><div class="morg">${r.model_org || ""}</div></div></div></td>`;
      h += `<td class="col-harness"><div class="hname">${HARNESS_URL[r.harness] ? `<a href="${HARNESS_URL[r.harness]}" target="_blank" rel="noopener">${r.harness}</a>` : r.harness}</div>${r.harness_org ? `<div class="morg">${r.harness_org}</div>` : ""}</td>`;
      h += `<td class="col-iface">${r.interface ? `<a class="pill iface-${r.interface}" href="#iface-${r.interface}" title="Open the ${IFACE_LABEL[r.interface] || r.interface} interface definition below">${IFACE_LABEL[r.interface] || r.interface}</a>` : "—"}</td>`;
      metrics.forEach(m => h += r.ref ? (r[m.key] != null ? `<td class="num${m.bar ? " srcell" : ""}"><span class="numwrap"><span class="v refv">${fmt(r[m.key], m.digits)}</span><span class="sd"></span></span></td>` : `<td class="num dim"><span class="numwrap"><span class="v">—</span><span class="sd"></span></span></td>`) : metricCell(r, m, maxBar));
      h += `<td class="col-eff num">${r.ref || r.tmed == null ? "—" : timeHTML(r.tmed) + tmoHTML(r)}</td>`;
      h += `<td class="col-eff num">${r.ref || r.calls == null ? "—" : r.calls}</td>`;
      h += `<td class="col-cost num">${r.ref ? "—" : costHTML(r)}</td>`;
      tr.innerHTML = h;
      tr.addEventListener("click", e => { if (e.target.closest("a")) return; state.open.has(r) ? state.open.delete(r) : state.open.add(r); renderTable(); });
      tbody.appendChild(tr);
      if (state.open.has(r)) {
        const d = el("tr", "details");
        const bits = [];
        if (r.rerun) bits.push(`<span class="k">rerun</span><span class="rerun-why">${r.rerun}</span>`);
        if (r.cell) bits.push(`<span class="k">cell</span><code>${r.cell}</code>`);
        if (r.date) bits.push(`<span class="k">date</span>${r.date}`); // 2026-10-15 (user): Date column dropped, kept in the details line
        bits.push(`<span class="k">n</span>${r.reps > 1 ? r.reps + " × " : ""}${r.n || 100} episodes`);
        if (r.steps != null) bits.push(`<span class="k">mean steps</span>${r.steps}`);
        if (r.timeouts) bits.push(`<span class="k">† timeouts</span>${tmoTip(r)}`);
        if (r.note) bits.push(`<span class="k">note</span>${r.note}`);
        d.innerHTML = `<td colspan="${cols.length}"><div class="details__in">${bits.map(b => `<div class="dline">${b}</div>`).join("")}</div></td>`;
        tbody.appendChild(d);
      }
    };
    refs.forEach(rowHTML);
    ranked.forEach(rowHTML);
    if (!ranked.length) { const tr = el("tr"); tr.innerHTML = `<td colspan="${cols.length}" class="empty">No runs match the current view — turn a chip back on (or click "all" in a group).</td>`; tbody.appendChild(tr); }
    table.appendChild(tbody); box.appendChild(table); wrap.appendChild(box);
  }

  // ---------- experiment setup (key-value, per benchmark: shared defaults overridden by the tab's own `setup`) ----------
  function renderSetup() {
    const box = $("#lb-setup"), btn = $("#setup-btn");
    box.hidden = !state.setupOpen; btn.setAttribute("aria-expanded", String(state.setupOpen));
    const S = DATA.setup, own = tab().setup || {};
    const strip = h => String(h).replace(/<[^>]+>/g, "");
    $("#setup-hint").textContent = ["Split", "Success", "Turns"].map(k => strip(k in own ? own[k] : S.defaults[k])).filter(Boolean).join("  ·  ");
    if (!state.setupOpen) return;
    box.innerHTML = S.groups.map(g => {
      const rows = g.keys.map(k => [k, k in own ? own[k] : S.defaults[k]]).filter(([, v]) => v != null);
      return `<div class="setup__g"><div class="setup__t">${g.name}</div><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd${v === "not stated" ? ' class="na"' : ""}>${v}</dd>`).join("")}</dl></div>`;
    }).join("");
  }

  // ---------- VIEW block (2026-10-09): four chip groups, every chip an on/off switch ----------
  function renderView() {
    const t = tab(), box = $("#lb-view"); box.innerHTML = "";
    const rows = t.rows.filter(r => !r.ref && viewOK(r));
    const chip = (on, label, count, tip, onclick, cls) => {
      const b = el("button", "vchip" + (on ? " on" : "") + (cls ? " " + cls : "")); b.type = "button"; b.setAttribute("aria-pressed", String(on)); b.title = tip;
      b.innerHTML = `<i></i>${label}${count != null ? `<b>${count}</b>` : ""}`;
      b.addEventListener("click", onclick);
      return b;
    };
    // 2026-10-15 (user: paper 主表按钮，一键显示且默认显示): one switch = exactly the rows of the paper's main table
    // (flag `paper_main`, set by mark_paper_main.py from the paper's own table data); any other chip click switches it off
    // (user, same day: 点其他开关按钮的时候，它自动熄灭); turning it on also resets the
    // chip groups to their defaults, turning it off leaves them and shows every run they let through
    const pline = el("div", "view-row__g");
    pline.appendChild(el("span", "view-row__k", "Preset"));
    const nPaper = t.rows.filter(r => !r.ref && r.paper_main).length;
    pline.appendChild(chip(state.paper, "Paper main table", nPaper, state.paper
        ? "Showing exactly the rows of the paper's main table (Minimal interface, one row per model), plus the R2R-CE Qwen rows of its cost appendix. Click to show every run the chips below let through."
        : "Show exactly the rows of the paper's main table (Minimal interface, one row per model), plus the R2R-CE Qwen rows of its cost appendix", () => {
      // 2026-10-15 (user: 取消熄灭的时候自动回到刚刚的开关状态): switching it on remembers the chips as they were,
      // switching it off by hand puts them back; a chip click (which also switches it off) starts from what is shown
      state.paper = !state.paper;
      if (state.paper) {
        state.saved = { filters: Object.fromEntries(Object.entries(state.filters).map(([k, v]) => [k, new Set(v)])), keep: new Set(state.keep) };
        state.filters = defaultFilters(); state.keep = defaultKeep();
      } else if (state.saved) { state.filters = state.saved.filters; state.keep = state.saved.keep; state.saved = null; }
      renderAll();
    }, "preset"));
    box.appendChild(pline);
    VIEW_GROUPS.forEach(g => {
      const present = facetValues(rows, g.key);
      if (present.length < 2) return; // nothing to switch on this tab
      const values = g.order.filter(v => present.includes(v)).concat(present.filter(v => !g.order.includes(v)).sort((a, b) => String(a).localeCompare(String(b))));
      const allowed = state.filters[g.key]; // undefined = everything on
      const line = el("div", "view-row__g");
      line.appendChild(el("span", "view-row__k", g.label));
      const fold = (open, label) => chip(false, label, null, (open ? "Fold" : "Unfold") + " the " + g.label.toLowerCase() + " chips", () => { open ? state.unfolded.delete(g.key) : state.unfolded.add(g.key); renderAll(); }, "reset fold");
      if (g.fold && !state.unfolded.has(g.key)) { // folded: one toggle that says how many are on, plus "all" when some are off
        const nOn = allowed ? values.filter(v => allowed.has(v)).length : values.length;
        line.appendChild(fold(false, (allowed ? `${nOn} of ${values.length}` : `all ${values.length}`) + " " + g.label.toLowerCase() + "s on · show ▸"));
        if (allowed) line.appendChild(chip(false, "all", null, "Turn every " + g.label.toLowerCase() + " chip back on", () => { state.paper = false; state.saved = null; if (g.key === "harness") state.keep.clear(); delete state.filters[g.key]; renderAll(); }, "reset"));
        box.appendChild(line);
        return;
      }
      values.forEach(v => {
        const on = !allowed || allowed.has(v);
        const cnt = rows.filter(r => r[g.key] === v && filtersOK(r, g.key)).length;
        const vr = g.key === "model" && rows.find(r => r.model === v); // model chips wear their vendor colour
        const kept = !on && g.key === "harness" && state.keep.size ? ` Off by default, except ${[...state.keep].join(", ")}, which only ran on it.` : "";
        line.appendChild(chip(on, g.fmt(v), cnt, `${g.label}: ${g.fmt(v)} — ${cnt} run${cnt === 1 ? "" : "s"} on this tab. Click to ${on ? "hide" : "show"} them.${kept}`, () => {
          state.paper = false; state.saved = null; if (g.key === "harness") state.keep.clear();
          const set = new Set(state.filters[g.key] || values);
          set.has(v) ? set.delete(v) : set.add(v);
          if (set.size === values.length) delete state.filters[g.key]; else state.filters[g.key] = set;
          renderAll();
        }, vr && VENDOR_TEXT[vr.model_org] ? "vc-" + VENDOR_TEXT[vr.model_org].slice(2) : ""));
      });
      // per-group bulk switches (2026-10-12): "none" turns the whole group off (then click single chips back on), "all" turns it back on
      if (!allowed || allowed.size) line.appendChild(chip(false, "none", null, "Turn every " + g.label.toLowerCase() + " chip off — then click the ones you want back on", () => { state.paper = false; state.saved = null; if (g.key === "harness") state.keep.clear(); state.filters[g.key] = new Set(); renderAll(); }, "reset clear"));
      if (allowed) line.appendChild(chip(false, "all", null, "Turn every " + g.label.toLowerCase() + " chip back on", () => { state.paper = false; state.saved = null; if (g.key === "harness") state.keep.clear(); delete state.filters[g.key]; renderAll(); }, "reset"));
      if (g.fold) line.appendChild(fold(true, "hide ▴"));
      box.appendChild(line);
    });
    if (!box.children.length) box.hidden = true; else box.hidden = false;
  }

  function renderAll() { renderTabs(); renderSetup(); renderView(); renderTable(); renderInterfaces(); }

  // ---------- Interfaces section (2026-10-09, user): every interface the repo has, its tools and the briefing verbatim ----------
  function renderInterfaces() {
    const list = $("#iface-tablist"), panel = $("#iface-panel");
    if (!list || !panel || !IFACES) return;
    if (!state.iface) state.iface = IFACES.interfaces[0].id;
    list.innerHTML = "";
    IFACES.interfaces.forEach(i => {
      const b = el("button", "tablink" + (i.id === state.iface ? " active" : ""));
      b.dataset.iface = i.id; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", i.id === state.iface); b.title = i.summary;
      b.appendChild(el("span", "bench", i.label));
      b.appendChild(el("span", "count", i.tools.length + " tools"));
      b.appendChild(el("span", "sub", i.aka || ""));
      b.addEventListener("click", () => { state.iface = i.id; history.replaceState(null, "", "#iface-" + i.id); renderInterfaces(); });
      list.appendChild(b);
    });
    const i = IFACES.interfaces.find(x => x.id === state.iface);
    const tabLabel = id => { const t = DATA.tabs.find(t => t.id === id); return t ? String(t.label).split(" · ")[0] + (t.sub ? " · " + t.sub : "") : id; };
    const onBoard = i.used_on.filter(id => DATA.tabs.some(t => t.id === id)); // interfaces.json may name retired tabs
    const used = onBoard.length
      ? onBoard.map(id => `<a class="chip" href="#${id}" title="${esc(tabLabel(id))}">${esc(tabLabel(id))}</a>`).join("")
      : `<span class="dim">not on the board yet (enhanced tier)</span>`;
    const kv = (k, v) => v == null || v === "" ? "" : `<div class="dline"><span class="k">${k}</span>${v}</div>`;
    const briefs = i.briefings.map((b, n) => {
      const bud = b.budgets; const body = b.body ? Object.entries(b.body).map(([k, v]) => `${k} = ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ") : null;
      return `<details class="brief"${n === 0 ? " open" : ""}>
        <summary><span class="brief__task">${esc(b.task)}</span><code>${esc(b.experiment)}</code><span class="brief__bud">${bud.turns} turns · ${bud.steps} steps · ${bud.timeout_s} s${bud.usd_fuse ? ` · $${bud.usd_fuse} fuse` : ""}${b.rgb ? ` · ${b.rgb} px` : ""}</span></summary>
        <div class="brief__in">
          ${kv("actions", esc(b.actions))}${kv("body", body ? esc(body) + " (overrides on the standard body)" : null)}
          <div class="brief__k">system prompt · sent verbatim, ${esc(IFACES.placeholders)}</div><pre class="brief__txt">${esc(b.system)}</pre>
          <div class="brief__k">first user message</div><pre class="brief__txt">${esc(b.first_message)}</pre>
          <div class="brief__k">tool descriptions in this briefing</div>
          <table class="tools-t"><tbody>${Object.entries(b.tools).map(([k, v]) => `<tr><td class="tools-t__n"><code>${esc(SIG(i, k))}</code></td><td><pre class="brief__txt brief__txt--tool">${esc(v)}</pre></td></tr>`).join("")}</tbody></table>
        </div></details>`;
    }).join("");
    panel.innerHTML = `
      <div class="iface__head"><div class="iface__name">${esc(i.label)}</div><span class="iface__aka">${esc(i.aka || "")}</span><code class="iface__arm">${esc(i.arm)}</code></div>
      <p class="iface__sum">${esc(i.summary)}</p>
      <div class="iface__used"><span class="k">on the board</span>${used}</div>
      <div class="iface__tools"><div class="brief__k">tools (${i.tools.length})</div><div class="toolchips">${i.tools.map(t => `<code class="toolchip" title="${esc(t.desc)}">${esc(t.sig)}</code>`).join("")}</div></div>
      <div class="iface__briefs"><div class="brief__k">briefings, one per task family — click to expand</div>${briefs}</div>
      <div class="iface__src">rendered verbatim from the experiment files in the MIP code · generated ${esc(IFACES.generated)}</div>`;
  }
  function SIG(i, k) { const t = i.tools.find(t => t.name === k); return t ? t.sig : k; }

  // ---------- boot ----------
  Promise.all([fetch(new URL("data.json", BASE)).then(r => r.json()), fetch(new URL("interfaces.json", BASE)).then(r => r.json()).catch(() => null)]).then(([d, ifc]) => {
    DATA = d; IFACES = ifc; state.tab = d.tabs[0].id; readHash();
    $("#lb-updated").textContent = d.updated;
    $("#setup-btn").addEventListener("click", () => { state.setupOpen = !state.setupOpen; renderSetup(); });
    window.addEventListener("hashchange", () => { readHash(); renderAll(); if (location.hash.startsWith("#iface-")) { const s = $("#interfaces"); if (s) s.scrollIntoView({ block: "start" }); } });
    renderAll();
    if (location.hash.startsWith("#iface-")) { const s = $("#interfaces"); if (s) s.scrollIntoView({ block: "start" }); }
  }).catch(err => { $("#leaderboard-container").innerHTML = `<div class="empty">Could not load data.json (${err}).</div>`; });
})();
