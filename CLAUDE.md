# CLAUDE.md

Personal IT portfolio, know-how base and blog. **Read [docs/requirements.md](docs/requirements.md) before larger changes** — it is the source of truth for features, design and privacy rules.

## Commands

- `npm run dev` — Vite dev server (portfolio pages work without env vars; `/api` does not run)
- `vercel dev` — dev server including `/api` serverless functions
- `npm run validate:content` — content checks (front matter, slugs, dates, tags, skill ids, internal links)
- `npm run build` — validate → `tsc -b` → client build → SSR build → `scripts/prerender.ts`
- `npm run emulators` + `npm run seed:feed` — local Firebase with sample posts (see README)

Always run `npm run build` before committing; fix all errors.

## Architecture

- `content/` → parsed and validated by the pure `src/lib/content-core/` (no Node APIs). `scripts/lib/content.ts` feeds it files from disk (+ highlight.js) for the Vite plugin `virtual:content`, the validator and the prerenderer; the admin content editor (`src/pages/admin/`) runs the same validation in the browser before committing through `api/content.ts` (GitHub API).
- `src/config/navigation.ts` — fixed menu data (paths, icons, sides); labels/order/visibility come from `content/navigation.json`, identity from `content/profile.json` (`src/config/site.ts` merges them).
- Pages read content via `useContent()` (`src/lib/content.ts`): static bundle for visitors/prerendering, the live draft in edit mode. Edit-mode UI (`ItemTools`, `AddButton`, `EditButton` from `src/lib/edit.tsx`) renders nothing for visitors; the editor itself (`src/edit/EditProvider.tsx`) is lazy-loaded for the owner only. New editable things need an `EditTarget` kind plus a form in `FormFor`. `side` only switches fonts/accents; the theme is dark everywhere unless the visitor picks light with the toggle (saved), so it never flips on navigation.
- `src/lib/firebase.ts` loads Firebase lazily; never import `firebase/*` statically in components (keeps it out of the main bundle and out of prerendering).
- Feed (`src/lib/feed.ts`): public queries **must** filter `where('published', '==', true)` or the rules reject them.
- `api/` — Vercel functions; imports use `.js` extensions (NodeNext). Admin check: `api/_lib/auth.ts` (`verifyIdToken` + `ADMIN_UID`).
- Prerender: every portfolio page and article becomes `dist/<path>.html`; `spa.html` is the fallback for runtime routes (`/blog/p/:id`, `/admin`). Components must render the same on server and client (no `localStorage`/`window` during render — use effects; see `ThemeToggle`).

## Rules

- Keep skill ids and slugs stable (they are URLs and references).
- No AI features at runtime, no paid APIs, no tracking, no external requests before consent (embeds are click-to-load; fonts self-hosted).
- Never commit `.env.local`, service-account JSON or Cloudinary secrets; server secrets never get a `VITE_` prefix.
- If `firestore.rules` or `firestore.indexes.json` change: republish them in Firebase.
- Colors only via the tokens in `src/styles/tokens.css` / Tailwind names; keep WCAG AA contrast.
- Bigger changes on a branch → Vercel preview → merge to `main`.
