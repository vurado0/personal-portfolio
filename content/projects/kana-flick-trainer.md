---
title: "仮名 Flick Trainer"
summary: A time-attack PWA for practising Japanese flick typing on the iPhone keyboard — installable from Safari, offline, with scores and streaks.
stack: [React, TypeScript, Vite, Tailwind, Workbox, GitHub Actions]
skills: [react, typescript, japanese, ci-cd]
tags: [web, pwa, japanese, personal]
role: Solo developer
status: done
period: 2026
cover: /images/projects/kana-flick-trainer.jpg
links:
  github: https://github.com/vurado0/kana-flick-trainer
  demo: https://vurado0.github.io/kana-flick-trainer/
---

## Problem

Japanese phones use **flick input**: tap a kana and swipe in a direction for the others in its row. It's fast once your thumb knows it, but there was no simple drill for it.

## Solution

- **60-second time attack** (30/120 s optional): a word appears with its reading, and you type it with the iPhone's Japanese Kana keyboard.
- Words filtered by JLPT level, with a live per-character highlight, scores, a best score and a daily streak.
- **Installable PWA** (vite-plugin-pwa / Workbox): add it to the home screen from Safari and it runs full-screen and offline.

## How

- Vite + React + TypeScript + Tailwind, with no backend. State lives in `localStorage`.
- Deployed by a **GitHub Actions** workflow to GitHub Pages; the base path is set at build time, so the PWA works under `/kana-flick-trainer/`.
