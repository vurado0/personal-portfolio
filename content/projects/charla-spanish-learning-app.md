---
title: "Charla — conversation-first Spanish"
summary: A Spanish learning web app built around real conversations, with Latin American and Spain Spanish side by side, spaced-repetition vocabulary and offline sync.
stack: [React, TypeScript, Vite, Tailwind, Firebase, Vercel]
skills: [typescript, react, firebase, spanish]
tags: [web, education, personal]
role: Solo developer
status: in progress
period: 2026
links:
  github: https://github.com/vurado0/spanish-learn-application
  demo: https://spanish-learn-application.vercel.app
featured: true
---

## Problem

I'm on Erasmus in Alcalá de Henares and wanted an app that teaches the Spanish I actually hear, not word lists. It also had to show **both variants**: Latin American Spanish first, and the Spain version right next to it.

## What it does

- **Course A1 → B1**: a placement check, then lessons built around a dialogue with audio, 8–12 new words, a short grammar point and 5–8 exercises.
- **548 words** in 10 topics with pictures, gender-coloured articles and examples. A daily **spaced-repetition** review and six practice modes (picture → word, listening, typing, flashcards, memory…).
- **One variant setting** 🌎 / 🇪🇸 drives words, dialogues and voices. Answers in the other variant are accepted and explained.
- Progress saves after every exercise and syncs between phone and laptop, even after working **offline**.

## How

- React + Vite + TypeScript + Tailwind, mobile-first.
- Firebase free plan: Authentication plus Firestore with offline persistence. Security rules are tested with the emulators.
- Audio via the browser's **Web Speech API**. No paid APIs, no AI at runtime.
- A vocabulary validator runs before every build, so broken data never ships.
