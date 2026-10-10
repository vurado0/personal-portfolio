# ☕ Kaito Snezhko — Portfolio, Know-how & Blog

🇬🇧 [English](README.md) · 🇩🇪 **Deutsch**

**Live: [www.kaito-tech.site](https://www.kaito-tech.site)**

Meine persönliche Ecke im Netz: wer ich als IT-Student und Entwickler bin, was ich kann, was ich gebaut habe – und nebenbei ein Stück Alltag. Die ganze Seite ist in Kaffeetönen gehalten: eine dunkle *Espresso*-Seite für den beruflichen Teil und eine warme *Latte*-Seite für den persönlichen.

## Was es hier gibt

| | |
| --- | --- |
| **Skills** | Nach Bereichen gruppiert, mit Level von *learning* bis *advanced* – jeder Skill verlinkt auf die Projekte, Artikel und Posts, in denen ich ihn wirklich eingesetzt habe. |
| **Projekte** | Welches Problem ein Projekt löst, wie es funktioniert, der Tech-Stack und was ich dabei gelernt habe. |
| **Know-how** | Mein öffentliches IT-Notizbuch: Linux, Netzwerke, Docker, Git und mehr – durchsuchbar, mit kopierbaren Code-Blöcken. |
| **Über mich / CV** | Ein Lebenslauf im Europass-Stil: Berufserfahrung, Ausbildung, Sprachniveaus (GER), digitale Kompetenzen, Zertifikate – plus PDF-Download. |
| **Blog** | Ein Feed wie auf Social Media (Fotos, kleine Erfolge, Gedanken, die Songs in Dauerschleife) und längere Artikel. |
| **Zertifikate · Hobbies · Kontakt** | Wohin ich mich entwickle, was ich in meiner Freizeit mache und wie man mich erreicht. |

Recruiter und Besucher können alles ohne Konto ansehen – die [Login-Seite](https://www.kaito-tech.site/login) bietet mit einem Klick eine **Gastansicht**.

## Highlights

- **Direkt auf der Seite bearbeiten** – als Owner eingeloggt wird jede Seite editierbar: Hovern für ✎ / ✕, Neues hinzufügen, Menü-Tabs umbenennen oder ausblenden und veröffentlichen. Änderungen werden im Browser geprüft, in dieses Repo committet und sind etwa eine Minute später live.
- **Schnell & SEO-freundlich** – Portfolio-Seiten und Artikel werden vorab als statisches HTML gerendert; der Feed lädt live aus Firestore.
- **Datenschutz zuerst** – kein Tracking, lokal ausgelieferte Schriften, Spotify/SoundCloud-Player laden erst nach einem Klick, und Standortdaten werden vor dem Foto-Upload entfernt.
- **Kostenlos im Betrieb** – Vercel Hobby, Firebase Spark und Cloudinary Free.

## Technik

React 19 · Vite 7 · TypeScript · Tailwind CSS 3 · React Router 7 · Firebase (Auth + Firestore) · Cloudinary · Vercel Serverless Functions (`/api`) · selbst gehostete Schriften über `@fontsource`.

Die Inhalte (Skills, Projekte, Artikel, CV …) liegen als Markdown/JSON in [`content/`](content). Feed-Posts entstehen auf der privaten `/admin`-Seite und werden in Firestore gespeichert.

Installation, Einrichtung (Firebase, Cloudinary, GitHub-Token, Vercel) und alle technischen Details stehen in der [englischen README](README.md#local-development).
