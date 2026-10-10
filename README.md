# ☕ Kaito Snezhko — Portfolio, Know-how & Blog

🇬🇧 **English** · 🇩🇪 [Deutsch](README.de.md)

**Live: [personal-portfolio-eta-ten-37.vercel.app](https://personal-portfolio-eta-ten-37.vercel.app)**

My personal corner of the web: who I am as an IT student and developer, what I can do, what I've built — and a bit of everyday life on the side. The whole site is brewed in coffee tones: a dark *espresso* side for the professional part and a warm *latte* side for the personal one.

## What you'll find

| | |
| --- | --- |
| **Skills** | Grouped by area with a level from *learning* to *advanced* — every skill links to the projects, articles and posts where I actually used it. |
| **Projects** | What each project solves, how it works, its stack and the lessons learned. |
| **Know-how** | My public IT notebook: Linux, networking, Docker, Git and more — searchable, with copy-ready code blocks. |
| **About / CV** | A Europass-style CV: experience, education, language levels (CEFR), digital skills, certifications — plus a PDF download. |
| **Blog** | A social-style feed (photos, daily wins, thoughts, the songs on repeat) and longer articles. |
| **Certificates · Hobbies · Contact** | Where I'm heading, what I do off the clock, and how to reach me. |

Recruiters and visitors can browse everything without an account — the [login page](https://personal-portfolio-eta-ten-37.vercel.app/login) has a one-click **guest view**.

## Highlights

- **Edit in place** — signed in as the owner, every page becomes editable: hover for ✎ / ✕, add new items, rename or hide menu tabs, and publish. Changes are validated in the browser, committed to this repo and live about a minute later.
- **Fast & SEO-friendly** — portfolio pages and articles are prerendered to static HTML; the feed loads live from Firestore.
- **Privacy first** — no tracking, self-hosted fonts, Spotify/SoundCloud players only load after a click, and photo location data is stripped before upload.
- **Free to run** — Vercel Hobby, Firebase Spark and Cloudinary Free.

## How it works

- **Portfolio** (dark "espresso", monospace): Home, Skills, Know-how, Projects, About/CV, Certificates, Contact
- **Personal** (light "latte", grotesk): Blog with a social-style **Feed** (photos, achievements, thoughts, music) and longer **Articles**, plus Hobbies

Portfolio content is Markdown/JSON in [`content/`](content) and is **prerendered** at build time. Feed posts are written from the phone on a private `/admin` page and stored in **Firestore**; photos go to **Cloudinary** through signed uploads.

The full requirements are in [`docs/requirements.md`](docs/requirements.md).

## Stack

React 19 · Vite 7 · TypeScript · Tailwind CSS 3 · React Router 7 · Firebase (Auth + Firestore) · Cloudinary · Vercel serverless functions (`/api`) · self-hosted fonts via `@fontsource`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (see below); optional for portfolio pages
npm run dev                  # http://localhost:5173 — portfolio pages work without any env vars
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (no `/api` functions) |
| `vercel dev` | Dev server **with** `/api` functions — needed for photo uploads and music info in `/admin` |
| `npm run validate:content` | Checks front matter, slugs, dates, tags, skill ids and internal links |
| `npm run build` | validate → typecheck → client build → SSR build → prerender (`dist/`) |
| `npm run preview` | Serves `dist/` (note: `/blog/p/:id` and `/admin` rely on Vercel's `spa.html` rewrite) |
| `npm run images:backgrounds` | Re-creates the WebP backgrounds from `docs/design-references/` |
| `npm run emulators` | Firebase Auth + Firestore emulators (needs Java) |
| `npm run seed:feed` | Writes 4 sample feed posts (one per type) |

### Testing the feed with the Firebase emulators

```bash
npm run emulators
```

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-portfolio npm run seed:feed
```

Then create `.env.development.local` (git-ignored) with `VITE_FIREBASE_API_KEY=demo`, `VITE_FIREBASE_PROJECT_ID=demo-portfolio`, `VITE_FIREBASE_AUTH_DOMAIN=demo-portfolio.firebaseapp.com`, `VITE_FIREBASE_APP_ID=demo`, `VITE_USE_EMULATORS=true` and run `npm run dev`. Delete the file afterwards.

## Adding content

| What | Where |
| --- | --- |
| Skill | `content/skills.json` — stable `id`, `name`, `group`, `level` 1–5, `context` |
| Know-how article | `content/knowhow/<category>/<slug>.md` — `title, category, tags, skills, summary, updated, difficulty` |
| Project | `content/projects/<slug>.md` — `title, summary, stack, skills, role, status, period, links, cover, featured` |
| Blog article | `content/blog/<yyyy-mm-dd>-<slug>.md` — `title, date, tags, skills, summary, cover, draft` |
| Hobbies / CV / certificates | `content/hobbies.json`, `content/cv.json`, `content/certificates.json` |
| Name, role, socials | `content/profile.json` |
| Menu labels, order, visibility | `content/navigation.json` (paths/icons/sides in `src/config/navigation.ts`) |
| Feed post | `/admin` on the live site — no deploy needed |

Everything in `content/` can also be edited in the browser — directly on the pages in edit mode, or under **`/admin` → Content** (see below).

Projects, articles, know-how, certificates and feed posts reference skills via `skills: [...]`; each skill page lists everything that links to it. `npm run validate:content` (also part of `npm run build`) fails on unknown skill ids and broken internal links. `draft: true` articles show in `npm run dev` only.

## Firebase setup (once)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (Spark plan).
2. Add a **Web app** (`</>`) — no Firebase Hosting — and copy its config into the `VITE_FIREBASE_*` variables.
3. **Authentication → Sign-in method** → enable **Google**.
4. **Firestore → Create database** → location `europe-west3` (Frankfurt), **production mode**.
5. Publish the rules and the feed index, either in the console (**Firestore → Rules**: paste [`firestore.rules`](firestore.rules); **Indexes**: composite index on `posts` with `published ↑, createdAt ↓`) or with the CLI:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes --project <project-id>
   ```
6. Open `/admin` on the site and sign in once. The page shows your **UID**. Create the document **`admins/<uid>`** with field `role: "admin"` (Firestore → Data), and set the same UID as `ADMIN_UID` in Vercel.

## Login, edit mode & content editor

- **`/login`** has two ways in: **Continue as guest** (visitors/recruiters, read-only, no account) and **Sign in to edit** (owner, Google). The header shows "login" for visitors and "admin" for you.
- **Edit mode:** once you're signed in as the owner, every page becomes editable in place: hover an element for ~0.3 s to get **✎ edit / ✕ delete** (and ↑↓ where order matters) in its top-right corner; dashed **+ Add …** tiles create new skills, projects, know-how, articles, certificates, hobbies and CV entries/sections. **✎ menu** renames, reorders and shows/hides pages; **profile** edits name, role and links. Changes show up immediately on the page and collect in the floating bar; **Publish** validates them (same rules as the build) and commits them to `main` through `/api/content` — Vercel redeploys in ~1 min and the bar shows the deploy status. **preview** shows the published site as visitors see it. The editor code is only downloaded for the owner.
- **`/admin`** keeps the feed (posts, photos, music), contact messages and a **Content** tab with the same editors as lists.
- Deleting a skill also removes it from every project/article/certificate that references it. IDs and slugs cannot be changed after creation (they are URLs). Feed posts are deleted immediately (they live in Firestore, not in the repo).
- **CV** (`content/cv.json`) follows the Europass structure: personal information (contact, nationality, date of birth, driving licence, photo — empty fields stay hidden), a profile text, and any number of sections of type *timeline* (work, education, certifications, volunteering…), *languages* (mother tongues + CEFR levels for listening, reading, spoken production/interaction, writing), *list* (digital skills, awards, interests…) or *text*. Sections can be added from Europass presets, renamed, hidden, reordered and deleted.

### GitHub token (once)

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Repository access: **Only select repositories** → `vurado0/personal-portfolio`
3. Permissions → Repository permissions → **Contents: Read and write** (nothing else)
4. Set an expiry you're comfortable with (e.g. 1 year) and copy the token.
5. Vercel → Settings → Environment Variables → `GITHUB_TOKEN` = the token (Production; mark it **Sensitive**) → redeploy.

Optional: `GITHUB_REPO` (default `vurado0/personal-portfolio`) and `GITHUB_BRANCH` (default `main`).

## Cloudinary setup (once)

1. Sign up for the free plan; note **cloud name**, **API key**, **API secret** (Console → Dashboard / API Keys).
2. Keep **unsigned uploads disabled** (Settings → Upload). Uploads are signed by `/api/cloudinary-sign`, which only answers to the Firebase user whose UID equals `ADMIN_UID`.
3. Images land in the folder `portfolio/feed` (created on first upload). Deleting a post deletes its images via `/api/cloudinary-delete`.

Photos are resized to max 2500 px and re-encoded in the browser before upload, which removes EXIF/GPS data. Music covers are copied to Cloudinary on save, so visitors never contact Spotify/SoundCloud until they press **Play preview**.

## Environment variables

See [`.env.example`](.env.example). Locally in `.env.local` (never committed); on Vercel in **Settings → Environment Variables** (Production + Preview).

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | client | Firebase web config (public by design) |
| `VITE_USE_EMULATORS` | client | `true` only locally with the emulators — **always `false` on Vercel** |
| `VITE_CLOUDINARY_CLOUD_NAME` | client + server | Cloudinary cloud name |
| `FIREBASE_PROJECT_ID` | server | used by `firebase-admin` to verify ID tokens |
| `ADMIN_UID` | server | the only UID allowed to upload/delete |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | server | signing — **never** give these a `VITE_` prefix |
| `GITHUB_TOKEN` | server | fine-grained token (Contents read/write on this repo) for the content editor |
| `GITHUB_REPO`, `GITHUB_BRANCH` | server (optional) | defaults `vurado0/personal-portfolio`, `main` |
| `SITE_URL` | build (optional) | canonical URL for sitemap, RSS and Open Graph |

`VITE_*` values are baked in at build time: after changing them on Vercel, **redeploy**.

## Deployment (Vercel)

The repo is connected to Vercel; every push to `main` deploys production, every other branch gets a preview URL.

1. Vercel → **Add New → Project** → import this repo (preset **Vite**; `vercel.json` sets build command and output).
2. Add all environment variables above → **Deploy**.
3. Firebase → **Authentication → Settings → Authorized domains** → add `<project>.vercel.app` and any custom domain (without `https://`). Preview domains need to be added too if you want to log in on previews.
4. Live test: pages load, `/admin` login works, a photo post uploads and appears in the feed, the music card loads the player only after the click, the contact form saves.

`vercel.json` uses `cleanUrls` so prerendered pages (`dist/skills.html` → `/skills`) are served directly, and rewrites everything else except `/api/*` to `/spa` (`spa.html`) (the client-side app for `/blog/p/:id`, `/admin` and 404s).

## Design

- Colors are CSS variables in [`src/styles/tokens.css`](src/styles/tokens.css) (espresso, dark-roast, mocha, caramel, crema, latte, cream, foam, ink), mapped in [`tailwind.config.ts`](tailwind.config.ts). Contrast ratios are noted in the file (all body text ≥ 4.5:1).
- Fonts: JetBrains Mono (portfolio) and Inter Tight (blog) are self-hosted. **Raptor Text** is commercial: drop licensed `RaptorText-{Regular,Bold,Black}.woff2` into `public/fonts/` and it is picked up automatically; otherwise Inter Tight is used.
- Background textures in `public/images/backgrounds/` are generated from the mood board in `docs/design-references/` (the typography reference is never shipped).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank feed "not connected" | `VITE_FIREBASE_*` missing at build time → add on Vercel, redeploy |
| Google login: unauthorized domain | Add the domain in Firebase → Authentication → Settings → Authorized domains |
| Feed error / "requires an index" in the console | Deploy `firestore.indexes.json` (see Firebase setup step 5) |
| Upload 401/403 | Wrong `ADMIN_UID`, missing server env vars, or expired login → check Vercel vars, redeploy |
| "Invalid signature" | API key/secret mismatch |
| `/api/...` did not return JSON locally | Use `vercel dev` instead of `npm run dev` |
| Spotify only plays 30 s | Expected for visitors not logged in to Spotify |
