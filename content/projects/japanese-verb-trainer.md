---
title: "動詞活用トレーナー — Japanese verb trainer"
summary: Drill Japanese verb conjugation with Anki-style spaced repetition — romaji→kana input, 13 forms, JLPT filter and example sentences with automatic furigana after every answer.
stack: [JavaScript, HTML, CSS, WanaKana, kuromoji.js, GitHub Pages]
skills: [javascript, japanese]
tags: [web, education, japanese, personal]
role: Solo developer
status: in progress
period: 2026
cover: /images/projects/japanese-verb-trainer.jpg
links:
  github: https://github.com/vurado0/japanese-verb-trainer
  demo: https://vurado0.github.io/japanese-verb-trainer/
---

## Problem

Textbooks give you conjugation tables, but at N3/N2 you need to be fast: see 通う + たら形 and type かよったら without thinking. Flashcard apps can't check conjugations, they only compare strings someone typed in beforehand.

## Solution

- A **rule-based conjugation engine** handles godan, ichidan, irregular and する verbs for 13 forms. New verbs only need dictionary data, and every form is generated.
- **Romaji → hiragana while typing**, like an IME (`taberu → たべる`, `nn → ん`).
- **SM-2 spaced repetition** with the four Anki ratings (keys 1–4). Two modes: dictionary form → conjugation, or meaning → verb.
- After every answer: an explanation and four example sentences (2 basic, 2 advanced) with translations and **automatic furigana** (kuromoji tokenizer).
- Plain HTML/CSS/JS with no build step. Progress stays in `localStorage`.

## Lessons learned

- Japanese conjugation is very regular once you model the verb class and the last kana. The engine is a small table of rules, not a list of exceptions.
- Rendering user-facing text safely matters even in a hobby app: one refactor fixed an XSS hole in the example renderer.
