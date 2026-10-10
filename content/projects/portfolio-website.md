---
title: Portfolio & blog website
summary: This site — a coffee-themed portfolio, know-how base and personal feed with a phone-friendly admin.
stack: [ React, TypeScript, Vite, Tailwind, Firebase, Cloudinary, Vercel ]
skills: [ typescript, react, firebase, ci-cd, git, claude-code ]
tags: [ web, personal ]
role: Solo developer & designer
status: in progress
period: "2026"
links:
  github: https://github.com/vurado0/personal-portfolio
  demo: https://www.kaito-tech.site
cover: /images/projects/portfolio-website.jpg
featured: true
---

## Problem

I wanted one place for my CV, my IT notes and a personal feed — without paying for hosting or giving visitors' data to trackers.

## Solution

![The know-how base: categories, tag filters and full-text search](/images/projects/portfolio-knowhow.jpg)


- Portfolio content lives as Markdown in the repo and is **prerendered** at build time.
- Feed posts are written on a private `/admin` page from my phone and stored in Firestore.
- Photos go to Cloudinary through **signed uploads** that only my Firebase login can request; EXIF/GPS data is removed in the browser first.
- Spotify/SoundCloud players load only after a click (GDPR).
- **Edit in place**: after signing in, every section gets ✎ / ✕ / + controls. Changes are validated in the browser and published as one Git commit, which Vercel deploys.

![The Europass-style CV page, editable section by section](/images/projects/portfolio-cv.jpg)

![The personal side: a blog feed with photos, thoughts, achievements and music](/images/projects/portfolio-blog.jpg)

## Lessons learned

TBE
