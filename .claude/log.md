# Development Log

This file tracks all code modifications, bug fixes, and feature additions.

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
