---
title: "Arabic Alphabet الأبجدية"
summary: A single-page site for learning the Arabic alphabet and 50 starter phrases, with spoken audio for every letter and phrase, all letter forms, IPA, and comparisons with sounds from English, German, Japanese and Russian.
stack: [HTML, CSS, JavaScript, Web Speech API, Vercel]
skills: [javascript]
tags: [web, education, personal]
role: Solo developer
status: done
period: 2026
cover: /images/projects/arabic-alphabet.jpg
featured: true
links:
  github: https://github.com/vurado0/arabic-alphabet
  demo: https://arabic-alphabet-nu.vercel.app
---

## Problem

Starting Arabic means learning a new script, sounds that don't exist in the languages I speak, and letters that change shape depending on where they sit in a word. I wanted one page that shows all of that and lets me hear every letter.

## Solution

- **All 28 letters + hamza** with their start, middle and end forms, name, Latin spelling and IPA. A **Name** and a **Sound** button play each letter with a, i and u.
- **How to say it**: every letter is compared with sounds from English, German, Japanese and Russian. The 10 letters with no real equivalent are tagged *new sound* and come with a tip on how to make them.
- **50 starter phrases** in Modern Standard Arabic with full vowel marks and audio. A note shows where a phrase changes when you talk to a woman.

![The 50 starter phrases with transliteration, meaning and a play button](/images/projects/arabic-alphabet-phrases.jpg)

## How

- **One `index.html`**: plain HTML, CSS and JavaScript, with no build step, no dependencies and no backend.
- Audio uses the browser's **Web Speech API** with the device's Arabic voices, so no audio files ship. A voice picker lists every Arabic voice installed, and a slow mode helps with careful listening.
- **Mobile / PC layouts** (cards vs. a full table), picked from the screen width on the first visit and remembered after that. Light and dark mode follow the system.
