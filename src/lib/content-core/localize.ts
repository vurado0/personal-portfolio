// Short content in other languages. Translations are keyed by the English text, so changing an
// English text simply falls back to English until its translation is updated. Long texts (know-how,
// projects, blog articles) stay in English on purpose.
import { buildNav } from '../../config/navigation.ts';
import type { ContentBundle, CvSection, PageText, TranslationLocale } from '../../types/content.ts';

export type Dictionary = Record<string, string>;
export type TranslatableGroup = 'Menu' | 'Page texts' | 'Profile' | 'Skills' | 'CV' | 'Hobbies';
export type Translatable = { group: TranslatableGroup; text: string };

type Tr = (s: string | undefined) => string | undefined;

function walk(bundle: ContentBundle, tr: Tr, tl: (list: string[]) => string[]) {
  const page = (p: PageText): PageText => ({
    ...p,
    title: tr(p.title) ?? p.title,
    label: tr(p.label),
    intro: tr(p.intro),
    meta: p.meta?.map((m) => ({ label: tr(m.label) ?? m.label, value: tr(m.value) ?? m.value })),
  });
  const section = (s: CvSection): CvSection => {
    const title = tr(s.title) ?? s.title;
    switch (s.type) {
      case 'timeline':
        return { ...s, title, items: s.items.map((e) => ({ ...e, title: tr(e.title) ?? e.title, org: tr(e.org) ?? e.org, location: tr(e.location), text: tr(e.text) })) };
      case 'languages':
        return { ...s, title, motherTongues: tl(s.motherTongues), items: s.items.map((l) => ({ ...l, name: tr(l.name) ?? l.name, certificate: tr(l.certificate) })) };
      case 'list':
        return { ...s, title, items: s.items.map((i) => ({ ...i, name: tr(i.name) ?? i.name, detail: tr(i.detail), level: tr(i.level) })) };
      case 'text':
        return { ...s, title, text: tr(s.text) ?? s.text };
    }
  };
  const p = bundle.profile;
  return {
    ...bundle,
    navigation: buildNav(bundle.navigation).map((n) => ({ id: n.id, label: tr(n.label) ?? n.label, enabled: n.enabled })),
    pages: Object.fromEntries(Object.entries(bundle.pages).map(([id, pt]) => [id, page(pt)])),
    profile: { ...p, role: tr(p.role) ?? p.role, tagline: tr(p.tagline) ?? p.tagline, description: tr(p.description) ?? p.description, location: tr(p.location) ?? p.location, currentFocus: tl(p.currentFocus) },
    skillGroups: bundle.skillGroups.map((g) => ({ ...g, label: tr(g.label) ?? g.label })),
    skills: bundle.skills.map((s) => ({ ...s, name: tr(s.name) ?? s.name, context: tr(s.context) ?? s.context })),
    hobbies: bundle.hobbies.map((h) => ({ ...h, title: tr(h.title) ?? h.title, text: tr(h.text) ?? h.text, links: h.links?.map((l) => ({ ...l, label: tr(l.label) ?? l.label })) })),
    cv: {
      ...bundle.cv,
      personal: { ...bundle.cv.personal, headline: tr(bundle.cv.personal.headline) ?? '', address: tr(bundle.cv.personal.address) ?? '', nationality: tr(bundle.cv.personal.nationality) ?? '' },
      summary: tr(bundle.cv.summary) ?? bundle.cv.summary,
      sections: bundle.cv.sections.map(section),
    },
  } satisfies ContentBundle;
}

/** The bundle with every short text replaced by its translation (when there is one). */
export function localizeBundle(bundle: ContentBundle, dict: Dictionary): ContentBundle {
  const tr: Tr = (s) => (s === undefined ? s : dict[s] ?? dict[s.trim()] ?? s);
  return walk(bundle, tr, (list) => list.map((s) => tr(s) ?? s));
}

const worthTranslating = (s: string) => /\p{L}/u.test(s) && !/^(https?:|mailto:|\/)/.test(s.trim());

/** Every English text that can be translated, grouped and in page order (for the editor). */
export function translatableStrings(bundle: ContentBundle): Translatable[] {
  const out: Translatable[] = [];
  const seen = new Set<string>();
  let group: TranslatableGroup = 'Menu';
  const add: Tr = (s) => {
    if (s && worthTranslating(s) && !seen.has(s)) {
      seen.add(s);
      out.push({ group, text: s });
    }
    return s;
  };
  buildNav(bundle.navigation).forEach((n) => add(n.label));
  group = 'Page texts';
  for (const pt of Object.values(bundle.pages)) [pt.label, pt.title, pt.intro, ...(pt.meta ?? []).flatMap((m) => [m.label, m.value])].forEach(add);
  group = 'Profile';
  const p = bundle.profile;
  [p.role, p.tagline, p.description, p.location, ...p.currentFocus].forEach(add);
  group = 'Skills';
  bundle.skillGroups.forEach((g) => add(g.label));
  bundle.skills.forEach((s) => [s.name, s.context].forEach(add));
  group = 'CV';
  const cv = bundle.cv;
  [cv.personal.headline, cv.personal.address, cv.personal.nationality, cv.summary].forEach(add);
  for (const s of cv.sections) {
    add(s.title);
    if (s.type === 'timeline') s.items.forEach((e) => [e.title, e.org, e.location, e.text].forEach(add));
    if (s.type === 'languages') [...s.motherTongues, ...s.items.flatMap((l) => [l.name, l.certificate])].forEach(add);
    if (s.type === 'list') s.items.forEach((i) => [i.name, i.detail, i.level].forEach(add));
    if (s.type === 'text') add(s.text);
  }
  group = 'Hobbies';
  bundle.hobbies.forEach((h) => [h.title, h.text, ...(h.links ?? []).map((l) => l.label)].forEach(add));
  return out;
}

export function dictionaryFor(bundle: ContentBundle, locale: TranslationLocale): Dictionary {
  return bundle.translations?.[locale] ?? {};
}
