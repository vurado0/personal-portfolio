# Personal IT Portfolio, Know-how & Blog Website – Blueprint

Personal website with two sides: a **work portfolio** (skills, IT know-how, projects, CV) and a **personal blog / feed** (photos, daily achievements, short posts like on X/Instagram/VSCO, music moods via Spotify/SoundCloud). Structure reused from the Spanish learning project. Free tiers only, deployed on Vercel.

---

## 1. Purpose

- Present **who I am** professionally: skills, projects, experience, CV
- Collect my **IT know-how** as notes and guides I can reuse and link to
- Show how everything connects: **every skill links to the projects, articles and posts where I used it**
- Run a **personal feed**: quick posts with photos, daily achievements, thoughts and songs, written from my phone in the browser
- Keep **longer blog articles** as Markdown files in the repo
- Be easy to extend with Claude Code: new portfolio content = new file; new feed post = written on the admin page, no deploy needed

---

## 2. Tech stack

| Part | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast, simple SPA |
| Styling | Tailwind CSS with design tokens (section 5) | Coffee palette, dark/light mode |
| Portfolio content | Markdown/MDX + JSON in the repo | Version-controlled, editable in VS Code |
| Feed posts | Firestore (Spark free plan) | Posted from the browser/phone, live without redeploy |
| Images (feed) | **Cloudinary** (free plan) | Upload storage + automatic resizing, WebP/AVIF, thumbnails |
| Upload security | Vercel serverless function `/api/cloudinary-sign` | Signs uploads only for my verified Firebase login |
| Auth | Firebase Authentication (Google) | Admin login for the owner only |
| Music | Official Spotify / SoundCloud embeds | Short listen snippet inside a post |
| Fonts | Self-hosted via `@fontsource` / local files | Fast, no requests to Google servers (GDPR) |
| Hosting | Vercel (Hobby, free) | Auto-deploy on every push to `main`, serverless functions |
| Dev tool | Claude Code + VS Code | Feature work, content, deploys |

**Division of work:** Firebase = login + database (post text, tags, date, **image URLs**). Cloudinary = only the image files. Firebase Storage is not used (it requires the paid Blaze plan).

No AI features at runtime and no paid APIs.

---

## 3. Site structure (menu bar)

**Portfolio side (core)**
1. **Home**: short intro, current focus, featured projects, latest feed posts
2. **Skills**: skill groups with level, linked to projects, know-how and posts
3. **Know-how**: IT knowledge base (guides, cheat sheets, setups), searchable, by category
4. **Projects**: project cards with stack, role, status, links (GitHub, live demo)

**Personal side (core)**
5. **Blog**: two tabs
   - **Feed** (default): short posts like X/Instagram/VSCO: photos, achievements, thoughts, music
   - **Articles**: longer Markdown posts

**Optional (toggle in a config file, can be hidden from the menu)**
6. **Hobbies**: e.g. filmmaking, languages, gaming, fitness
7. **About / CV**: timeline (education, work, certificates), languages, downloadable CV (PDF)
8. **Certificates**: planned and completed certifications with status
9. **Contact**: contact form + links (GitHub, LinkedIn, email)

**Hidden:** `/admin` (Google login, only me): write feed posts, upload photos, read contact messages.

**Always in the footer:** Impressum, Datenschutz (required for a website run from Austria/EU), social links.

Menu items are defined in `src/config/site.ts` (`enabled: true/false`, order, label, icon, `side: "portfolio" | "personal"`). Hiding a page = setting `enabled: false`.

---

## 4. Page requirements

### Skills (with references)
- Grouped: Programming, Cloud & DevOps, Systems & Networking, Tools, Spoken languages
- Defined once in `content/skills.json` with a stable `id` (e.g. `java`, `docker`, `linux`), name, group, level (1–5 or "learning / working / advanced"), context
- **Two-way references:** projects, know-how articles, blog articles and feed posts have a `skills: [...]` field with skill IDs
  - Skill page/card automatically lists all linked **projects, know-how articles and posts** (counts + links)
  - Projects/articles/posts show their skills as chips that link back to the skill
- Filter by group; optional skill detail page `/skills/<id>`
- `validate:content` fails on unknown skill IDs

### Know-how (knowledge base)
- Markdown articles in `content/knowhow/<category>/<slug>.md`
- Front matter: title, category, tags, **skills**, summary, updated date, difficulty
- Categories e.g. Linux, Networking, Cloud, Docker, Git, Java, C, Security, macOS
- Full-text search, category sidebar, tags, table of contents, syntax-highlighted code blocks with copy button, "last updated" date

### Projects
- Markdown in `content/projects/`
- Fields: title, summary, stack, **skills**, role, status (idea / in progress / done), period, links, cover image (local), featured flag
- Detail page: description, problem → solution, screenshots, lessons learned

### Blog – Feed (social-style posts)
- Stored in Firestore `posts`, written on `/admin` (works on the phone)
- **Post types:**
  - `photo`: 1–10 images (carousel), caption
  - `text`: short thought, like a tweet
  - `achievement`: what I achieved today (e.g. "finished Docker networking", "gym PR"), optional photo, icon/badge
  - `music`: Spotify or SoundCloud link + my comment / current mood
- Fields on every post: text, tags, `skills` (optional), mood (optional emoji/label), createdAt, published flag
- **Layouts:** timeline (X-style) and photo grid (Instagram/VSCO-style), switchable; filter by type and tag
- Post detail page `/blog/p/<id>` with shareable link and Open Graph image (first photo)
- Drafts (`published: false`) only visible to admin
- Edit and delete from the admin page (also deletes the images in Cloudinary)

### Blog – Articles
- Markdown/MDX in `content/blog/<yyyy-mm-dd>-<slug>.md`
- Front matter: title, date, tags, **skills**, summary, cover, draft flag
- Tag filter, reading time, newest first, RSS feed (articles + published feed posts)
- `draft: true` is not shown on the live site

### Music posts (Spotify / SoundCloud)
- Paste a link on the admin page → type detected automatically
  - Spotify: `open.spotify.com/track|album|playlist/<id>` → embed `open.spotify.com/embed/...`
  - SoundCloud: track URL → embed `w.soundcloud.com/player/?url=...`
- When saving, fetch title, artist and cover via the official oEmbed endpoint and **store them in the post**
- **Click-to-load (GDPR):** visitors first see a coffee-styled card (cover, title, artist, my comment, mood). The real player loads only after clicking "Play preview" with a short note that Spotify/SoundCloud is loaded
- Note: Spotify plays a ~30 s preview for visitors who are not logged in; SoundCloud usually plays the full track
- Optional: "Now playing / current mood" widget on Home showing the latest music post

### Hobbies (optional)
- Cards per hobby with short text, local photos/links

### About / CV (optional)
- Timeline: education, jobs, certificates; spoken languages with level; CV download from `/public/cv.pdf`

### Contact (optional)
- Form: name, email, message → Firestore `messages` (create-only for visitors)
- Honeypot field + simple client-side rate limit; alternative `mailto:` link

---

## 5. Design system ("Coffee")

### Two moods, one palette
| | Portfolio side | Personal side (Blog) |
|---|---|---|
| Feel | Minimal, technical, like a code editor | Warm, creamy, editorial, photo-led |
| Default theme | Dark ("espresso") | Light ("latte") |
| Font | Monospace coding font | Clean grotesk (Raptor-Text-style) |
| Backgrounds | Flat espresso tones, thin 1px rule lines | Coffee texture images (see below) behind headers/sections |

Both sides support the dark/light toggle; the defaults above apply when no choice is saved.

### Color tokens
Define as CSS variables on `:root` (light) and `[data-theme="dark"]`, mapped in `tailwind.config`.

| Token | Hex | Use |
|---|---|---|
| `espresso` | `#1A120D` | Dark background |
| `dark-roast` | `#2B1D14` | Cards / surfaces on dark |
| `mocha` | `#5C3A21` | Borders, secondary surfaces |
| `caramel` | `#A86A3D` | Links, chips, accents |
| `crema` | `#D9822B` | Primary accent (buttons, focus ring, active tab) – from the espresso stream |
| `latte` | `#C8A27A` | Muted text on dark, dividers |
| `cream` | `#EADBC8` | Light background / text on dark |
| `foam` | `#F5ECDF` | Light surfaces, cards on light |
| `ink` | `#262220` | Text on light (like the typography sample) |

- Check contrast (WCAG AA): body text `cream` on `espresso`, `ink` on `foam`; use `crema` only for large text, icons and buttons with `espresso` text
- Rounded corners small (4–8 px), subtle shadows in warm brown tones, no pure black/white

### Typography
- **Portfolio side:** monospace coding font, e.g. **JetBrains Mono**, **Geist Mono** or **IBM Plex Mono** (all free, OFL). Headings in the same font, bold; small labels in uppercase with letter spacing; optional `>` prompt or `//` comment styling for section titles
- **Blog side:** **Raptor Text** (Superior Type), as in the reference image: large, tight headlines in Black/Bold, body in Regular/Light, small "Font: / Style:"-like meta labels left-aligned, thin horizontal rules between posts
  - Raptor Text is a **commercial font**: use it only with a web licence. Free fallback with a similar look: **Inter Tight**, **Geist** or **Satoshi**
  - Configure as `--font-blog: "Raptor Text", "Inter Tight", system-ui, sans-serif` so it can be swapped later
- Code blocks always in the monospace font
- Self-host all fonts (`@fontsource` or `/public/fonts`), `font-display: swap`, preload the main weights only

### Reference images (mood board)
Stored next to this blueprint in my Obsidian vault (iCloud):

- Path: `/Users/kaito/Library/Mobile Documents/iCloud~md~obsidian/Documents/sync/personal-portfolio/`
- In the terminal (escaped): `/Users/kaito/Library/Mobile\ Documents/iCloud\~md\~obsidian/Documents/sync/personal-portfolio`

Files:

| File                           | Shows                                                                                | Used for                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| ![[ref-coffee-waves.jpg]]      | Layered brown/cream waves with coffee beans                                          | Blog hero/header, 404 page, palette source (mocha, caramel, latte, cream)             |
| ![[ref-latte-swirl.jpg]]       | Creamy latte-art swirl with small bubbles                                            | Feed background, music card, empty states, palette source (foam, cream, caramel)      |
| ![[ref-espresso-shot.jpg]]     | Espresso stream on black (portafilter)                                               | Portfolio-side accent: Home hero or Projects header, palette source (espresso, crema) |
| ![[ref-typography-raptor.jpg]] | Raptor Text weights Black → Light on light grey, "Font: / Style:" labels, thin rules | Blog typography and layout reference (headline scale, meta labels, horizontal rules)  |

Claude Code reads these files to match colors and style; background images are converted from them into `public/images/backgrounds/` (see below). The typography reference is only a style guide and is never shipped on the site.

**Note:** keep the code repository **outside iCloud** (e.g. `~/dev/personal-portfolio`), because iCloud would sync `node_modules` and build files and slow everything down. Copy the four `ref-*` images and this blueprint into the repo under `docs/` (`docs/requirements.md`, `docs/design-references/`), so Claude Code and Git have them locally.

### Background images (Blog)
- Source: the three `ref-*` coffee images above → converted to `public/images/backgrounds/coffee-waves.webp`, `latte-swirl.webp`, `espresso-shot.webp`
- Use: header/hero of the Blog page, empty states, section dividers, the click-to-load music card, the 404 page; text always on a solid or blurred overlay for readability
- Store locally in `public/images/backgrounds/` as optimised WebP (≤ 300 KB, ~1600 px), with blur placeholder
- **Rights:** use only images I created myself or that are licensed for website use. The reference images are a mood board; if their source/licence is unknown, replace them with my own photos (espresso macro shots) or self-made textures in the same style

---

## 6. Auth, data & storage

**Who logs in:** only me (admin). Visitors never need an account.

### Firestore data model
```
posts/{id}           type, text, images[{url, publicId, width, height, alt}],
                     music{provider, url, embedUrl, title, artist, coverUrl},
                     tags[], skills[], mood, published, createdAt, updatedAt
messages/{id}        name, email, message, createdAt          (visitors: create only)
stats/{slug}         views, likes                              (optional)
admins/{uid}         role: "admin"                             (set once manually)
```

### Security rules (firestore.rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /posts/{id} {
      allow read: if resource.data.published == true || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /messages/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name','email','message','createdAt'])
                    && request.resource.data.message is string
                    && request.resource.data.message.size() < 5000;
      allow read, update, delete: if isAdmin();
    }

    match /stats/{slug} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
  }
}
```
Public feed queries must filter `where('published', '==', true)`, otherwise the rules reject them.

### Image upload flow (Cloudinary)
1. On `/admin` I pick photos (phone gallery or camera)
2. Client resizes to max ~2500 px and **removes EXIF/GPS data** (phone photos contain the location)
3. Client sends my Firebase ID token to `/api/cloudinary-sign`
4. Function verifies the token with `firebase-admin` (`verifyIdToken`, project ID only) and checks that the UID equals `ADMIN_UID`; then returns a signed upload signature (folder `portfolio/feed`)
5. Client uploads directly to Cloudinary → gets `secure_url` + `public_id`
6. Post is saved in Firestore with these values
7. Delete: `/api/cloudinary-delete` (same check) removes the image when a post is deleted

Delivery: Cloudinary URLs with `f_auto,q_auto` and widths for thumbnails (grid) and full view; `loading="lazy"`, `srcset`.

---

## 7. Project folder structure

```
portfolio-website/
├─ CLAUDE.md                 # project rules for Claude Code
├─ docs/
│  ├─ requirements.md        # this blueprint
│  └─ design-references/     # ref-coffee-waves.jpg, ref-latte-swirl.jpg,
│                            # ref-espresso-shot.jpg, ref-typography-raptor.jpg
├─ api/
│  ├─ cloudinary-sign.ts     # signed upload (admin only)
│  └─ cloudinary-delete.ts   # delete image (admin only)
├─ content/
│  ├─ knowhow/<category>/*.md
│  ├─ blog/*.md              # long articles
│  ├─ projects/*.md
│  ├─ skills.json
│  └─ hobbies.json
├─ public/
│  ├─ images/backgrounds/    # coffee textures (WebP)
│  ├─ fonts/                 # self-hosted fonts (licensed)
│  └─ cv.pdf, favicon, robots.txt
├─ src/
│  ├─ config/site.ts         # menu items (enabled/order/side), name, socials
│  ├─ styles/tokens.css      # coffee color tokens, fonts
│  ├─ components/            # incl. PostCard, MusicCard, ImageCarousel, SkillChip
│  ├─ pages/                 # incl. Blog (Feed/Articles), Admin
│  └─ lib/                   # firebase.ts, cloudinary.ts, embeds.ts, skills.ts
├─ scripts/validate-content.ts
├─ firestore.rules
├─ vercel.json               # SPA rewrite (excluding /api)
├─ .env.example
├─ .env.local                # never committed
└─ README.md
```

---

## 8. Environment variables

`.env.local` (local) and Vercel → Settings → Environment Variables (production + preview):

```
# Client (public, VITE_ prefix)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_USE_EMULATORS=false
VITE_CLOUDINARY_CLOUD_NAME=<cloud-name>

# Server only (NO VITE_ prefix – never exposed to the browser)
FIREBASE_PROJECT_ID=<project-id>
ADMIN_UID=<your-firebase-uid>
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

- Firebase values: Firebase → Project settings → General → My apps → Web app → **Config**
- Cloudinary values: Cloudinary Console → Dashboard / API Keys
- `VITE_USE_EMULATORS=true` only locally with `firebase emulators:start`; **always `false` on Vercel**
- `CLOUDINARY_API_SECRET` must never get a `VITE_` prefix
- `.env.local` must be in `.gitignore`
- Local testing of `/api`: `vercel dev` instead of `npm run dev`

---

## 9. Setup & deployment checklist

### Firebase (once)
1. Create a project at console.firebase.google.com (Spark plan)
2. Add a **Web app** (`</>`); no Firebase Hosting; copy the config
3. **Authentication** → Sign-in method → enable **Google**
4. **Firestore** → Create database → location `europe-west3` (Frankfurt) or `europe-southwest1` (Madrid), **production mode**
5. **Firestore → Rules**: paste `firestore.rules` → **Publish**
6. After your first login: **Firestore → Data** → create `admins/<your-uid>` with `role: "admin"`; put the same UID into `ADMIN_UID`

### Cloudinary (once)
1. Sign up for the free plan; note cloud name, API key, API secret
2. Create folder `portfolio/feed` (optional; created on first upload)
3. Settings → Security: keep **unsigned uploads disabled** (only signed uploads via `/api`)

### Vercel (once)
1. Push the repo to GitHub (check `.env.local` is ignored)
2. Vercel → Add New → Project → import the repo; preset **Vite** (build `npm run build`, output `dist`)
3. **Environment Variables**: add all keys from section 8 with **real** values (paste `.env.local` or **Import .env**; on macOS **Cmd + Shift + .** shows hidden files)
4. **Deploy**
5. Firebase → Authentication → Settings → **Authorized domains** → add `<project>.vercel.app` (and custom domain), without `https://`
6. Live test: pages load, admin login works, photo post uploads and appears in the feed, music card loads player after click, contact form saves

### Optional
- Custom domain: Vercel → Settings → Domains → DNS records → also add to Firebase authorized domains

---

## 10. General website requirements

- **Responsive, mobile-first**; the admin posting flow must be comfortable on the phone (big buttons, camera/gallery picker, upload progress)
- **Dark / light mode** toggle (remembered in localStorage)
- **Languages**: English default; German optional (i18n-ready)
- **SEO**: title + description per page, Open Graph tags, sitemap.xml, robots.txt; prerender portfolio pages and articles at build time. Feed posts load from Firestore at runtime (detail pages get OG tags client-side; SEO is secondary for the feed)
- **Performance**: Lighthouse ≥ 90; lazy-loaded, responsive images; fonts self-hosted, only needed weights; background images WebP
- **Accessibility**: semantic HTML, keyboard navigation, alt text required on every uploaded photo (field on the admin page), good contrast
- **Privacy / GDPR**:
  - No tracking cookies; if analytics, cookieless (e.g. Vercel Analytics)
  - Spotify/SoundCloud only after click (click-to-load)
  - No external font requests (self-hosted)
  - EXIF/GPS removed from photos
  - Datenschutz page names: Vercel (hosting), Firebase (auth, database), Cloudinary (image delivery), Spotify/SoundCloud (only after click), contact form data
- **Legal**: Impressum and Datenschutz in the footer
- **Copyright**: only own texts/images or properly licensed assets (incl. fonts with web licence)

---

## 11. Workflow

**One-time:** run `claude` in the project folder → `/init` to create `CLAUDE.md`; reference `docs/requirements.md` in it.

**Portfolio content / features (Claude Code)**
1. Describe the change (e.g. "Add a know-how article about Docker networking, skills: docker, linux")
2. Test locally: `npm run dev` (or `vercel dev` when touching `/api`)
3. `npm run validate:content` and `npm run build`; fix all errors
4. Review the summary, commit and push to `main` → Vercel deploys (1–2 min)

**Feed posts (no code, no deploy)**
1. Open `/admin` on phone or laptop → log in with Google
2. Choose type (photo / text / achievement / music), add text, tags, skills, mood, alt texts
3. Publish → visible immediately

**Rules of thumb**
- Bigger changes on a branch → Vercel preview URL → merge (Google login on previews only if the preview domain is authorized)
- If `firestore.rules` changes: republish in the Firebase console
- Keep slugs and skill IDs stable
- Never commit secrets

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Blank page after deploy | Env vars missing or added after build | Add them, then Deployments → Redeploy |
| Google login: unauthorized domain | Vercel domain not authorized | Firebase → Authentication → Settings → Authorized domains |
| Nothing saves to Firestore | Default deny rules still active | Publish `firestore.rules` |
| Feed empty for visitors | Query without `published == true` filter | Add the `where` filter |
| Photo upload 401/403 | Wrong `ADMIN_UID`, expired token or missing server env vars | Check UID and Cloudinary/Firebase vars in Vercel, redeploy |
| Upload "Invalid signature" | API secret/key mismatch or different params signed vs. sent | Use the same folder/timestamp params on both sides |
| `/api/...` returns `index.html` | SPA rewrite catches API routes | Exclude `/api` in the `vercel.json` rewrite |
| `/api` not working locally | `npm run dev` doesn't run functions | Use `vercel dev` |
| Spotify embed doesn't play full songs | Visitor not logged in to Spotify | Expected: 30 s preview |
| Login/data fails only live | `VITE_USE_EMULATORS=true` or demo values in Vercel | Set real values and `false`, redeploy |
| 404 on page refresh | Missing SPA rewrite | `vercel.json` with rewrite to `index.html` |

---

## 13. Prompt for Claude Code (initial build)

```
Build my personal IT portfolio, know-how and blog website. Read docs/requirements.md first and follow it exactly. Show me a short plan before implementing. No AI features at runtime, no paid APIs – free tiers only.

TECH
- React + Vite + TypeScript, Tailwind CSS with the coffee design tokens from section 5 (dark/light mode), mobile-first
- Portfolio content as Markdown/MDX and JSON in /content (front matter)
- Firebase (Spark): Authentication (Google, admin only) + Firestore (feed posts, contact messages, optional stats)
- Cloudinary (free) for feed images: signed uploads via Vercel serverless function api/cloudinary-sign.ts that verifies my Firebase ID token (firebase-admin verifyIdToken) and checks ADMIN_UID; api/cloudinary-delete.ts the same way. Strip EXIF/GPS and resize client-side before upload. Deliver with f_auto,q_auto and srcset
- Deploy on Vercel: vercel.json with SPA rewrite that excludes /api; env variables as in section 8 (server secrets without VITE_ prefix)
- Prerender portfolio pages and articles; sitemap.xml, robots.txt, Open Graph, RSS

MENU (src/config/site.ts with enabled/order/side per item)
- Portfolio side: Home, Skills, Know-how, Projects
- Personal side: Blog (tabs Feed + Articles)
- Optional (enabled by default): Hobbies, About/CV, Certificates, Contact
- Footer: Impressum, Datenschutz, social links; hidden /admin

PAGES & FEATURES
- Skills: content/skills.json with stable ids; projects, know-how, articles and feed posts reference skills via skills: [...]; each skill shows linked projects/articles/posts, chips link back; filter by group
- Know-how: Markdown knowledge base with search, tags, TOC, code blocks with copy button
- Projects: cards + detail pages
- Blog Feed: Firestore posts of type photo (1–10 images, carousel), text, achievement, music; timeline and grid layouts; filter by type/tag; post detail pages; drafts admin-only
- Music posts: paste Spotify/SoundCloud link, detect provider, fetch title/artist/cover via oEmbed on save, show click-to-load card; real iframe loads only after click
- Blog Articles: Markdown with tags, reading time, drafts hidden, RSS
- Admin (/admin, Google login, admins/{uid}): create/edit/delete feed posts with phone-friendly photo upload and progress, required alt text; read/delete contact messages
- Hobbies, About/CV, Certificates, Contact as in the requirements

DESIGN
- Look at the reference images in docs/design-references/ first (copied from /Users/kaito/Library/Mobile Documents/iCloud~md~obsidian/Documents/sync/personal-portfolio/: ref-coffee-waves.jpg, ref-latte-swirl.jpg, ref-espresso-shot.jpg, ref-typography-raptor.jpg) and match colors, mood and typography to them; convert the three coffee images to optimised WebP in public/images/backgrounds/ (≤ 300 KB, ~1600 px, with blur placeholders); never ship ref-typography-raptor.jpg
- Coffee palette tokens from section 5; portfolio side dark espresso with monospace font (JetBrains Mono default, configurable); blog side light latte with --font-blog ("Raptor Text" if licensed font files exist in /public/fonts, fallback Inter Tight), large tight headlines, thin rules, meta labels
- Blog background textures from public/images/backgrounds/ with overlays for readability
- All fonts self-hosted; check WCAG AA contrast

QUALITY
- Lighthouse ≥ 90, accessible, no tracking cookies, no external requests before consent (embeds click-to-load)
- firestore.rules from section 6
- scripts/validate-content.ts (npm run validate:content): required front matter, unique slugs, valid dates/tags, unknown skill ids, broken internal links; part of npm run build
- Sample content with clear placeholders (skills in all groups, 3 know-how articles, 2 projects, 2 articles, 2 hobbies) and a seed script for 4 sample feed posts (one per type)

DELIVERABLES & DEPLOYMENT
- README: local setup (npm run dev / vercel dev), Firebase setup, Cloudinary setup, env variables, Vercel deployment, authorized domains
- .env.example, firestore.rules, vercel.json
- When validate and build pass: show me a summary and how to test locally, wait for my OK, then commit and push to main. Never commit .env.local
- Remind me to publish firestore.rules, set ADMIN_UID, add the Vercel domain to Firebase authorized domains, and check font/background image licences
```
