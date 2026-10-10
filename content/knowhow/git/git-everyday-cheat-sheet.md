---
title: Git everyday cheat sheet
category: git
tags: [git, cheat-sheet]
skills: [git]
summary: The handful of Git commands I use every day — branching, fixing mistakes and keeping a clean history.
updated: 2026-09-15
difficulty: beginner
---

> PLACEHOLDER article — replace with your own notes.

## Branching

```bash
git switch -c feature/contact-form
git push -u origin feature/contact-form
```

## Fixing mistakes

```bash
git commit --amend          # change the last commit (before pushing)
git restore --staged file   # unstage
git restore file            # discard local changes
git revert <sha>            # undo a pushed commit safely
```

## Clean history

```bash
git fetch origin
git rebase origin/main
git log --oneline --graph --decorate -20
```

Used daily in [this website](/projects/portfolio-website).
