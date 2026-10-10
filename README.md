# Personal portfolio, know-how & blog

A coffee-themed personal website with two sides:

- **Portfolio** (dark "espresso", monospace): Home, Skills, Know-how, Projects, About/CV, Certificates, Contact
- **Personal** (light "latte", grotesk): Blog with a social-style **Feed** (photos, achievements, thoughts, music) and longer **Articles**, plus Hobbies

Portfolio content is Markdown/JSON in [`content/`](content) and is **prerendered** at build time. Feed posts are written from the phone on a private `/admin` page and stored in **Firestore**; photos go to **Cloudinary** through signed uploads. Everything runs on free tiers (Vercel Hobby, Firebase Spark, Cloudinary Free).

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
| Menu | `src/config/site.ts` (`enabled`, `order`, `side`, label, icon) + name, socials, fonts |
| Feed post | `/admin` on the live site — no deploy needed |

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
