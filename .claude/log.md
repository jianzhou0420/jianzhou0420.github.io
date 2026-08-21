# Development Log

This file tracks all code modifications, bug fixes, and feature additions.

---

## [2026-08-21] Clean-URL restructure: drop /src/ and .html from all public URLs

### Summary
Site-wide URL cleanup. Every page moved out of `src/` to a top-level directory
with an `index.html`, so URLs read `/agentcanvas/paper/` instead of
`/src/works/AgentCanvas/paper.html`. Old `/src/...html` URLs (cited by the arXiv
paper, resume, AgentCanvas README, docs-site) are preserved as redirect stubs
(meta-refresh + JS + canonical). Homepage fragments moved to `partials/`;
og:url/og:image meta updated to the new absolute URLs; cross-page links switched
to root-absolute. `/AgentCanvas/` (capital A, the code repo's docs site) is
untouched and must never be shadowed by a same-named dir here.

### Files Modified
| File | Change Type | Description |
|------|-------------|-------------|
| `src/{intro,projects,papers,blog}.html` | Moved | → `partials/` (fetch targets in index.html updated) |
| `src/assets/page-layout.css` | Moved | → `assets/` |
| `src/blog/<slug>.html` ×10 | Moved | → `blog/<slug>/index.html`; home/style/data links made root-absolute |
| `src/blog/data/` | Moved | → `blog/data/` (`DATA_DIR` in counting-oxe post updated) |
| `src/blog/*.md` | Moved | → `blog/_sources/` (unpublished) |
| `src/works/AgentCanvas/` | Moved | → `agentcanvas/` (`paper.html` → `paper/index.html`; media refs in paper page now `/agentcanvas/...`) |
| `src/works/MIP/` | Moved | → `mip/` |
| `src/works/DecoupledActionExpert/` | Moved | → `decoupled-action-expert/` (page → `index.html`) |
| `src/works/{CountingHallucinations,GuideThemAll}/` | Moved | → `counting-hallucinations/`, `guide-them-all/` (images only) |
| `src/works/template.html` | Moved | → `_templates/work-page.html` |
| `src/**` (18 stubs) + `blog/index.html` | Added | redirect stubs at every old public URL; `/blog/` → `/#blog` |
| `agentcanvas/DESIGN.md`, `mip/DESIGN.md`, `assets/page-layout.css` | Modified | path references in docs/comments updated |

Verified with the :8099 preview: all 19 pages 200, every href/src/poster/fetch
resolves, all stubs redirect to the right new URL.

---

## [2026-03-31 23:13] Show DAE entry on main page without project page link

### Summary
Unhide the Decoupled Action Expert entry in works.html. Show paper and code links but remove the project page link. Teaser image used as cover, linking to arxiv.

### Files Modified
| File | Change Type | Description |
|------|-------------|-------------|
| `src/works.html` | Modified | Uncommented DAE entry, removed project page link, cover links to arxiv |

---

## [2026-03-31 20:48] Refactor DecoupledActionHead to DecoupledActionExpert

### Summary
Full refactor of the DecoupledActionHead project page to reflect the updated paper (now "Decoupled Action Expert"), submitted to IROS 2026. Renamed all files/folders, replaced legacy images with figures from the new codebase, updated content with real abstract and results, and hid the entry from the main page.

### Files Modified
| File | Change Type | Description |
|------|-------------|-------------|
| `src/works/DecoupledActionHead/` | Renamed | Folder renamed to `src/works/DecoupledActionExpert/` |
| `src/works/DecoupledActionExpert/DecoupledActionExpert.html` | Renamed+Modified | Renamed from DecoupledActionHead.html; full rewrite with updated title, authors (added Zerui Li, Gengze Zhou), venue (IROS 2026), real abstract, key findings, two-stage method, results, ablation section, updated citation and links |
| `src/works.html` | Modified | Updated paper entry with new name/authors/venue/links; commented out to hide from main page |
| `src/works/template.html` | Modified | Removed hardcoded old repo URL |
| `src/works/DecoupledActionExpert/teaser.png` | Created | Downloaded from new GitHub repo — motivation figure, also used as thumbnail |
| `src/works/DecoupledActionExpert/method.png` | Created | Downloaded from new GitHub repo — two-stage architecture diagram |
| `src/works/DecoupledActionExpert/cond_ablation.png` | Created | Downloaded from new GitHub repo — conditioning ablation chart |
| `src/works/DecoupledActionHead/DecoupledActionHead.pdf` | Deleted | Old paper PDF |
| `src/works/DecoupledActionHead/DecoupledActionHead.png` | Deleted | Old architecture diagram |
| `src/works/DecoupledActionHead/thumbnail.jpg` | Deleted | Old thumbnail |
| `src/works/DecoupledActionHead/DP_C_vs_DP_MLP_*.png/.pdf` | Deleted | Legacy comparison figures |
| `src/works/DecoupledActionHead/DP_T_vs_DP_T_FILM_*.png/.pdf` | Deleted | Legacy comparison figures |

### Features/Improvements
- Updated paper title: "Decoupled Action Expert: Confining Task Knowledge to the Conditioning Pathway"
- Updated authors: added Zerui Li and Gengze Zhou
- Updated venue from "arXiv preprint" to "Submitted to IROS 2026"
- Updated code link to new repo: github.com/jianzhou0420/DecoupledActionExpert
- Updated paper link to arxiv.org/abs/2511.12101
- Replaced placeholder content with real abstract and key findings
- Added text-driven Results section with key quantitative results
- Added dedicated Conditioning Ablation section
- Added Motivation section with teaser figure
- Hidden paper entry from main page (commented out in works.html)

### Notes
- Project page is still accessible directly via URL, just not linked from main page
- Uncomment the entry in `src/works.html` when ready to show on main page

---
