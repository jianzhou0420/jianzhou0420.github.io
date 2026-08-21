# Project Overview: jianzhou0420.github.io

## Description
Jian Zhou's personal academic website, hosted on GitHub Pages. A static HTML site showcasing his bio, publications, blog, and project pages. Design based on Jon Barron's website template.

## Owner
Jian Zhou — PhD student at AIML (University of Adelaide), supervised by Prof. Qi Wu. Research interests: imitation learning, reinforcement learning, VLA models for household robots.

## URL scheme (clean URLs, since 2026-08-21)

Public URLs carry no `src/` prefix and no `.html` suffix — every page is a
`<dir>/index.html` served as `/<dir>/`:

| URL | Source file |
|---|---|
| `/` | `index.html` (SPA: Home + Blog tabs; fetches `partials/*.html`) |
| `/agentcanvas/` | `agentcanvas/index.html` (AgentCanvas platform page) |
| `/agentcanvas/paper/` | `agentcanvas/paper/index.html` (CoRL paper page) |
| `/mip/` | `mip/index.html` |
| `/decoupled-action-expert/` | `decoupled-action-expert/index.html` |
| `/blog/<slug>/` | `blog/<slug>/index.html` |
| `/blog/` | redirect page → `/#blog` |

Old `/src/...html` URLs (cited by the arXiv paper, resume, AgentCanvas README,
docs-site) are **redirect stubs** — meta-refresh + JS + canonical pointing at the
new URL. Never delete `src/`; it exists only as a redirect layer.

Cross-page links inside pages are root-absolute (`/agentcanvas/`, `/assets/...`,
`/#works`); same-directory asset refs stay relative. This works because the site
is a user site served at the domain root (and the local preview serves the repo
root the same way).

Note: `/AgentCanvas/` (capital A) is a DIFFERENT site — the AgentCanvas code
repo's own GitHub Pages (developer docs). Do not create a top-level `AgentCanvas/`
directory here; it would shadow that docs site.

## Directory Structure

```
jianzhou0420.github.io/
├── index.html                  # SPA homepage — tabs Home/#blog; fetches partials/*.html
├── partials/                   # HTML fragments injected into index.html (not standalone pages)
│   ├── intro.html              # Bio paragraphs → #intro
│   ├── projects.html           # Open Source cards → #projects
│   ├── papers.html             # Publication cards → #papers
│   └── blog.html               # Blog post list → #blog (data-draft rows hidden on public site)
├── assets/
│   └── page-layout.css         # Shared project-page shell CSS
├── agentcanvas/                # AgentCanvas platform page + media (+ paper/ subpage, _capture/ pipeline, DESIGN.md)
├── mip/                        # MIP paper page + media (player.js, ep10/, DESIGN.md)
├── decoupled-action-expert/    # DAE paper page + figures
├── counting-hallucinations/    # cover image only (no page)
├── guide-them-all/             # cover image only (no page)
├── blog/
│   ├── index.html              # redirect → /#blog
│   ├── <slug>/index.html       # one dir per post
│   ├── data/                   # data fetched by posts (oxe-instructions/)
│   └── _sources/               # md sources of posts (unpublished: underscore dir)
├── _templates/work-page.html   # template for new project pages (unpublished)
├── src/                        # REDIRECT STUBS ONLY — old URLs → new URLs; do not delete
├── Jian Zhou_files/            # homepage stylesheet + profile photo
├── _edit/                      # inline-edit tooling (unpublished; /save API via preview server)
├── _preview_server.py, run.sh  # local preview w/ Range support + live-reload (port 8099 via /host home)
└── .claude/                    # Claude Code configuration (this file, log.md)
```

No `.nojekyll`: GitHub Pages' default Jekyll build publishes everything EXCEPT
underscore-prefixed paths (`_edit/`, `_templates/`, `blog/_sources/`,
`agentcanvas/_capture/`) — that exclusion is relied upon.

## Tech Stack

- **HTML/CSS/JS** — Vanilla, no build tools or frameworks
- **Google Analytics** — gtag.js with ID `G-17341V1NQ5`
- **Google Fonts** — Lato (homepage) / Archivo + Hanken Grotesk + JetBrains Mono (project pages)
- **Hosting** — GitHub Pages (static, default Jekyll build)

## How to Add a New Publication

1. Add a card to `partials/papers.html` (root-absolute URLs: `/<project>/...`)
2. Create `<project>/` at repo root with assets
3. Optionally create `<project>/index.html` using `_templates/work-page.html` as a start

## How to Add a New Blog Post

1. Create `blog/<slug>/index.html` (see feedback_blog_path memory / existing posts)
2. Add an `<a class="post" href="/blog/<slug>/">` entry in `partials/blog.html`
   (add `data-draft` to keep it off the public site while drafting)

## Available Slash Commands

- `/understand` — Read and present project overview
- `/update-project-overview` — Re-scan repo and refresh this file
- `/collect-commands` — Scan repo for commands and write to `.claude/cmds.sh`
