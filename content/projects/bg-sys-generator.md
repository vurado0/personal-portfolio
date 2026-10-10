---
title: "BG//SYS — wallpaper generator"
summary: Procedural wallpapers in a retro-futurist, Braun-industrial style — rendered on canvas in the browser at any resolution, with presets for iPhone, Mac, iPad, Apple Watch and 4K/5K.
stack: [JavaScript, Canvas 2D, HTML, CSS, GitHub Pages]
skills: [javascript]
tags: [web, design, generative, personal]
role: Solo developer & designer
status: done
period: 2026
cover: /images/projects/bg-sys-generator.jpg
links:
  github: https://github.com/vurado0/bg-sys-generator
  demo: https://vurado0.github.io/bg-sys-generator/
---

## Problem

I wanted matching wallpapers for all my devices, in the style of Teenage Engineering, Nothing and Dieter Rams' Braun products. Downloading images means licence questions and fixed resolutions.

## Solution

- Everything is **generated**: nine styles (Keypad Matrix, Dot Matrix, Concentric, Schematic, Horizon, Editorial, Panel Stack, Line Field, Eclipse), palettes like *Braun SK-4*, grain, vignette and shadows, all driven by a **seed**.
- **Device presets** with sensible export factors: iPhone 14 Pro Max at 2× (2580 × 5592), MacBook at 1.5× (above 4K), and supersampled Apple Watch faces.
- Every setting lives in the **URL hash**, so a wallpaper can be shared or recreated exactly. A "variants" view suggests twelve combinations, and there are keyboard shortcuts (space = new seed, R = shuffle everything, D = download, ← → = style).
- PNG (lossless) or JPEG export. Nothing is uploaded, and there are no external images.

## How

Plain JavaScript and the Canvas 2D API, with a small core (seeded random numbers, drawing helpers) and one generator module per style. There's no build step and no dependencies.
