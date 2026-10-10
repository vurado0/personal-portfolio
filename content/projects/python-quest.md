---
title: "Python Quest — 道"
summary: A gamified Python dojo that runs real CPython in the browser via Pyodide — trilingual (EN / DE / 日本語), sumi-e dark theme, no backend at all.
stack: [JavaScript, Pyodide, CodeMirror, HTML, CSS, Vercel]
skills: [python, typescript]
tags: [web, education, game]
role: Solo developer
status: done
period: 2026
links:
  github: https://github.com/vurado0/python-quest
---

## Problem

Most Python tutorials explain variables as boxes. I wanted practice that fits a software-design student: short challenges whose explanations use architecture and data-structure vocabulary. It also had to run anywhere, without installing anything.

## What it does

- Lessons and challenges with **real CPython in the browser** (Pyodide). Your code runs and is checked against tests.
- **Gamified**: XP, ranks and progress per local profile, with synthesised sound effects.
- Fully **trilingual**, English / German / Japanese, in a Japanese sumi-e dark theme.

## How

- A plain static site: classic `<script>` tags instead of ES modules, so it even works from `file://`.
- Pyodide (~10 MB) and CodeMirror load from a CDN once and are then cached, so repeat visits work offline.
- No backend: profiles and progress live in the browser. Deployed on Vercel without a build step.
