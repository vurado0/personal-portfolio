---
title: Portfolio & blog website
summary: This site — a coffee-themed portfolio, know-how base and personal feed with a phone-friendly admin.
stack: [React, TypeScript, Vite, Tailwind, Firebase, Cloudinary, Vercel]
skills: [typescript, firebase, ci-cd, git, claude-code]
tags: [web, personal]
role: Solo developer & designer
status: in progress
period: 2026
links:
  github: https://github.com/vurado0/personal-portfolio
featured: true
---

## Problem

I wanted one place for my CV, my IT notes and a personal feed — without paying for hosting or giving visitors' data to trackers.

## Solution

- Portfolio content lives as Markdown in the repo and is **prerendered** at build time.
- Feed posts are written on a private `/admin` page from my phone and stored in Firestore.
- Photos go to Cloudinary through **signed uploads** that only my Firebase login can request; EXIF/GPS data is removed in the browser first.
- Spotify/SoundCloud players load only after a click (GDPR).

## Lessons learned

PLACEHOLDER — write what you learned, e.g. about prerendering, Firestore rules and image pipelines.

See the [skills page](/skills/firebase) for how everything connects.
