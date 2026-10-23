---
title: "DOUGA どうが — Japanese theme packs for YouTube"
summary: Five hand-made visual redesigns of YouTube in Japanese graphic-design styles — black-and-white kawaii, washi paper, sakura, night-market neon and an 8-bit handheld — switchable with one keystroke, in every major browser.
stack: [CSS, JavaScript, WebExtension, Userscript, Stylus, Python, Pillow, Playwright]
skills: [javascript, python, japanese]
tags: [web, design, browser-extension, japanese, personal]
role: Solo developer and designer
status: done
period: 2026
cover: /images/projects/douga.jpg
featured: true
links:
  github: https://github.com/vurado0/douga-youtube-themes
---

## Problem

YouTube looks the same for everyone. I wanted my own copy to feel like Japanese print design (rounded *maru gothic* type, pixel numbers, sticker outlines, hanko seals), without slowing the player down or touching YouTube's Japanese interface text.

## Solution

![Vol.01 Shirokuro: sticker outlines, hard offset shadows and monochrome thumbnails](/images/projects/douga-shirokuro-home.jpg)

- **Five complete volumes**, each its own art direction rather than a palette swap: 白黒 Shirokuro, 和紙 Washi, 桜 Sakura Pop, 夜市 Neon Yoichi and ゲーム 8-Bit Pocket. Every volume restyles the header, search, chips, thumbnails, player, comments, menus and scrollbars.
- **⌥ ⇧ T** switches volumes right on the page (a small toast shows which one you landed on), **⌥ ⇧ X** turns the skin off, and the choice is remembered per browser.
- Light and dark aware: three volumes follow YouTube's appearance setting, two keep their own night and day.
- **Private by design**: no tracking, no account and only the `storage` permission.

![Vol.02 Washi: hairline borders, Mincho headings and a red hanko seal as the logo](/images/projects/douga-washi-home.jpg)

## How

- **Pure CSS on top of YouTube's own design tokens**: no DOM rewriting and no polling loops, so there's zero lag. A volume is about 30 lines of tokens on top of a shared base stylesheet.
- One **Python build** (`scripts/build.py`) turns `src/` into everything people install: an unpacked WebExtension (Chrome, Arc, Edge, Brave and Firefox, plus Safari via Xcode), a userscript for Safari *Userscripts* and Violentmonkey, and one Stylus UserCSS per volume. Pillow draws the icons.
- The README screenshots are **rendered automatically** with Playwright from an offline demo page using the real built stylesheet, so they never drift from the code.

![Vol.04 Neon Yoichi on a watch page: cyan glow, magenta highlights and CRT scanlines](/images/projects/douga-neon-watch.jpg)
