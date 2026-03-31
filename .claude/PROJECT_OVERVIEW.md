# Project Overview: jianzhou0420.github.io

## Description
Jian Zhou's personal academic website, hosted on GitHub Pages. A static HTML site showcasing his bio, publications, and project pages. Design based on Jon Barron's website template.

## Owner
Jian Zhou — MPhil candidate at AIML (University of Adelaide), supervised by Prof. Qi Wu. Research interests: imitation learning, reinforcement learning, VLA models for household robots.

## Directory Structure

```
jianzhou0420.github.io/
├── index.html                  # Main page — loads intro & works dynamically via fetch()
├── Jian Zhou_files/            # Static assets for main page
│   ├── jian_zhou.jpg           # Profile photo
│   ├── style.css               # Main stylesheet (Lato font, link colors, layout)
│   └── css                     # Google Fonts reference
├── src/
│   ├── intro.html              # Bio/introduction content (injected into #intro div)
│   ├── works.html              # Publications list (injected into #works div)
│   └── works/                  # Individual project pages & assets
│       ├── DecoupledActionExpert/
│       │   ├── DecoupledActionExpert.html # Project page for paper
│       │   ├── teaser.png                # Motivation/cover image
│       │   ├── method.png                # Architecture diagram
│       │   └── cond_ablation.png         # Conditioning ablation chart
│       ├── CountingHallucinations/
│       │   └── CH.jpg                    # Cover image
│       └── template.html       # Template for new project pages
└── .claude/                    # Claude Code configuration
    ├── settings.local.json
    ├── PROJECT_OVERVIEW.md     # This file
    ├── cmds.sh                 # Collected commands
    └── commands/               # Slash commands
        ├── collect-commands.md
        ├── understand.md
        └── update-project-overview.md
```

## Key Files

| File | Role |
|------|------|
| `index.html` | Entry point. Uses `fetch()` to dynamically load `src/intro.html` and `src/works.html` |
| `src/intro.html` | Bio paragraph — education, background, research interests |
| `src/works.html` | Publication entries with thumbnails, links. Has a template comment for adding new papers |
| `src/works/template.html` | Full project page template (header, abstract, method, results, citation sections) |
| `src/works/DecoupledActionExpert/DecoupledActionExpert.html` | Project page for DAE paper (hidden from main page, accessible directly) |
| `Jian Zhou_files/style.css` | Minimal CSS — Lato font, link colors (#1772d0 default, #f09228 hover) |

## Tech Stack

- **HTML/CSS/JS** — Vanilla, no build tools or frameworks
- **Google Analytics** — gtag.js with ID `G-17341V1NQ5`
- **Google Fonts** — Lato (via external stylesheet)
- **Hosting** — GitHub Pages (static)

## Publications

1. **Decoupled Action Expert: Confining Task Knowledge to the Conditioning Pathway** — Jian Zhou, Sihao Lin, Shuai Fu, Zerui Li, Gengze Zhou, Qi Wu (submitted to IROS 2026) — has project page + code (hidden from main page)
2. **Counting Hallucinations in Diffusion Models** — Shuai Fu, Jian Zhou, et al. (arXiv:2510.13080, 2025) — external link only

## How to Add a New Publication

1. Add an entry to `src/works.html` following the table template in the comments
2. Create a folder under `src/works/<ProjectName>/` with assets
3. Optionally create a project page using `src/works/template.html` as a starting point

## Available Slash Commands

- `/understand` — Read and present project overview
- `/update-project-overview` — Re-scan repo and refresh this file
- `/collect-commands` — Scan repo for commands and write to `.claude/cmds.sh`
