---
title: Kanji Trainer
summary: An offline kanji PWA with two separate spaced-repetition tracks — recognising and writing — stroke-order checking on a drawing pad, confusion drills and smart multiple-choice distractors.
stack: [JavaScript, IndexedDB, Service Worker, KanjiVG, Node.js, GitHub Pages]
skills: [javascript, japanese]
tags: [web, pwa, education, japanese, personal]
role: Solo developer
status: in progress
period: 2026
cover: /images/projects/kanji-trainer.jpg
featured: true
links:
  github: https://github.com/vurado0/kanji-trainer
  demo: https://vurado0.github.io/kanji-trainer/
---

## Problem

Reading a kanji and writing it from memory are two different skills, but most apps track them as one. I wanted an app that schedules them **separately** and actually checks my handwriting on the iPad, fully offline.

## Solution

- **Two SRS tracks per character** (recognition and writing) with an SM-2 variant, plus a strict "green" definition: a kanji only counts as learned after several good days.
- **Writing practice** on a pointer-events drawing pad. Strokes are compared with KanjiVG data (matching and stroke-order analysis), with stroke animations as hints.
- **Six practice modes**, a 5-minute warm-up, **confusion pairs** (similar-looking kanji) and multiple-choice distractors chosen on purpose, not at random.
- A dashboard with due counts, streaks, a calendar heatmap and statistics. Progress lives in **IndexedDB**, with export/import and daily rolling backups.
- **PWA**: a service worker caches the app shell and lazy-loaded data chunks, so it can be installed on the iPad and works offline.

## How

- No framework and no build step: ES modules, a hash router and a tiny DOM helper.
- A one-time **Node data pipeline** (`tools/build-data.mjs`) turns KANJIDIC2, JMdict and KanjiVG (CC BY-SA) into compact JSON chunks, simplifying the SVG stroke paths along the way.
- The SRS rules are covered by assertion tests (`node tools/test-srs.mjs`).
