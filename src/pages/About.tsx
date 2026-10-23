// About / CV — Europass-style CV from content/cv.json. Every part is editable in edit mode.
import { CvRequest } from '../components/CvRequest';
import { PageHeader } from '../components/PageHeader';
import { useContent } from '../lib/content';
import { AddButton, EditButton, ItemTools, useEdit } from '../lib/edit';
import { Seo } from '../lib/head';
import type { CvPersonal, CvSection } from '../types/content';
import { useT, type MessageKey, type Translate } from '../i18n';

const PERSONAL_FIELDS: { key: keyof CvPersonal; label: MessageKey; href?: (v: string) => string }[] = [
  { key: 'email', label: 'cv.email', href: (v) => `mailto:${v}` },
  { key: 'phone', label: 'cv.phone', href: (v) => `tel:${v.replace(/\s/g, '')}` },
  { key: 'address', label: 'cv.address' },
  { key: 'website', label: 'cv.website', href: (v) => v },
  { key: 'linkedin', label: 'cv.linkedin', href: (v) => v },
  { key: 'github', label: 'cv.github', href: (v) => v },
  { key: 'nationality', label: 'cv.nationality' },
  { key: 'dateOfBirth', label: 'cv.dateOfBirth' },
  { key: 'drivingLicence', label: 'cv.drivingLicence' },
];

const period = (t: Translate, start: string, end?: string) => `${start} — ${end || t('cv.now')}`;
const shortUrl = (v: string) => v.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function SectionBody({ section }: { section: CvSection }) {
  const t = useT();
  const entry = (index: number) => ({ kind: 'cv-entry' as const, section: section.id, index });
  switch (section.type) {
    case 'timeline':
      return (
        <ol className="mt-6 border-l border-line/70">
          {section.items.map((e, i) => (
            <li key={`${e.title}-${i}`} className="reveal group relative pb-8 pl-6 pr-24">
              <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <ItemTools target={entry(i)} label={e.title} className="top-0" />
              <p className="font-mono text-xs text-muted">
                {period(t, e.start, e.end)}
                {e.location ? ` · ${e.location}` : ''}
              </p>
              <h3 className="mt-1 font-mono font-bold">{e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer">{e.title} ↗</a> : e.title}</h3>
              <p className="text-sm text-muted">{e.org}</p>
              {e.text ? <p className="mt-2 max-w-xl whitespace-pre-line text-sm">{e.text}</p> : null}
            </li>
          ))}
        </ol>
      );
    case 'languages':
      return (
        <div className="mt-4 space-y-4">
          {section.motherTongues.length > 0 && (
            <p className="text-sm">
              <span className="label mr-2">{t('cv.motherTongues')}</span>
              {section.motherTongues.join(', ')}
            </p>
          )}
          {section.items.length > 0 && (
            // Scrolls sideways on phones: focusable so it also scrolls with the keyboard.
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={section.title}>
              <table className="w-full min-w-[34rem] border-collapse font-mono text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-label text-muted">
                    <th className="py-2 pr-3 font-normal" rowSpan={2}>
                      {t('cv.language')}
                    </th>
                    <th className="border-l border-line/50 px-3 font-normal" colSpan={2}>
                      {t('cv.understanding')}
                    </th>
                    <th className="border-l border-line/50 px-3 font-normal" colSpan={2}>
                      {t('cv.speaking')}
                    </th>
                    <th className="border-l border-line/50 px-3 font-normal">{t('cv.writing')}</th>
                  </tr>
                  <tr className="text-left text-[10px] text-muted">
                    <th className="border-l border-line/50 px-3 pb-2 font-normal">{t('cv.listening')}</th>
                    <th className="px-3 pb-2 font-normal">{t('cv.reading')}</th>
                    <th className="border-l border-line/50 px-3 pb-2 font-normal">{t('cv.production')}</th>
                    <th className="px-3 pb-2 font-normal">{t('cv.interaction')}</th>
                    <th className="border-l border-line/50 px-3 pb-2 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((l, i) => (
                    <tr key={l.name} className="group relative border-t border-line/40">
                      <td className="py-2 pr-3 font-bold">
                        {l.name}
                        {l.certificate ? <span className="block text-[11px] font-normal text-muted">{l.certificate}</span> : null}
                      </td>
                      <td className="border-l border-line/50 px-3 text-accent">{l.listening}</td>
                      <td className="px-3 text-accent">{l.reading}</td>
                      <td className="border-l border-line/50 px-3 text-accent">{l.spokenProduction}</td>
                      <td className="px-3 text-accent">{l.spokenInteraction}</td>
                      <td className="relative border-l border-line/50 px-3 pr-24 text-accent">
                        {l.writing}
                        <ItemTools target={entry(i)} label={l.name} className="top-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-muted">{t('cv.levels')}</p>
            </div>
          )}
        </div>
      );
    case 'list':
      return (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {section.items.map((it, i) => (
            <li key={`${it.name}-${i}`} className="group relative rounded-md border border-line/50 px-3 py-2 pr-24">
              <ItemTools target={entry(i)} label={it.name} className="top-1" />
              <p className="font-mono text-sm font-bold">
                {it.name}
                {it.level ? <span className="ml-2 font-normal text-accent">{it.level}</span> : null}
              </p>
              {it.detail ? <p className="text-sm text-muted">{it.detail}</p> : null}
            </li>
          ))}
        </ul>
      );
    case 'text':
      return section.text ? <p className="mt-4 max-w-2xl whitespace-pre-line">{section.text}</p> : null;
  }
}

export default function About() {
  const { content } = useContent();
  const editing = Boolean(useEdit());
  const t = useT();
  const { cv, profile } = content;
  const p = cv.personal;
  const name = p.fullName || profile.name;
  const sections = cv.sections.filter((s) => s.visible || editing);

  return (
    <>
      <Seo title="About / CV" description={`CV of ${name}: experience, education, languages and skills.`} path="/about" />
      <PageHeader label={t('cv.pageLabel')} title={name}>
        <span className="flex flex-wrap items-center gap-3">
          {p.headline || profile.role}
          <EditButton target={{ kind: 'cv-personal' }} label="edit personal info" />
        </span>
      </PageHeader>
      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-12">
          {cv.summary ? (
            <section aria-labelledby="cv-summary">
              <h2 id="cv-summary" className="section-title">
                {t('cv.profile')}
              </h2>
              <p className="mt-4 max-w-2xl whitespace-pre-line">{cv.summary}</p>
            </section>
          ) : null}

          {sections.map((s) => {
            const empty = s.type === 'text' ? !s.text : s.items.length === 0 && !(s.type === 'languages' && s.motherTongues.length);
            if (empty && !editing) return null;
            return (
              <section key={s.id} aria-labelledby={`cv-${s.id}`} className={`group relative ${!s.visible ? 'opacity-60' : ''}`}>
                <ItemTools target={{ kind: 'cv-section', id: s.id }} label={`section ${s.title}`} className="right-0 top-0" />
                <h2 id={`cv-${s.id}`} className="section-title pr-40">
                  {s.title}
                  {!s.visible ? <span className="ml-2 normal-case tracking-normal text-muted">{t('cv.hidden')}</span> : null}
                </h2>
                <SectionBody section={s} />
                {s.type !== 'text' ? <AddButton target={{ kind: 'cv-entry', section: s.id }} label={`Add to ${s.title}`} className="mt-3 min-h-14" /> : null}
              </section>
            );
          })}
          <AddButton target={{ kind: 'cv-section' }} label="Add CV section" />
        </div>

        <aside className="space-y-8">
          {p.photo ? <img src={p.photo} alt={t('cv.photoAlt', { name })} className="aspect-square w-40 rounded-lg border border-line/60 object-cover" /> : null}
          <section aria-labelledby="cv-personal">
            <h2 id="cv-personal" className="section-title">
              {t('cv.personal')}
            </h2>
            <dl className="mt-4 space-y-2 font-mono text-sm">
              {PERSONAL_FIELDS.filter((f) => p[f.key]).map((f) => (
                <div key={f.key} className="border-b border-line/40 pb-2">
                  <dt className="label">{t(f.label)}</dt>
                  <dd className="mt-0.5 break-words">
                    {f.href ? (
                      <a href={f.href(p[f.key])} {...(/^https?:/.test(p[f.key]) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {/^https?:/.test(p[f.key]) ? shortUrl(p[f.key]) : p[f.key]}
                      </a>
                    ) : (
                      p[f.key]
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <CvRequest email={p.email || profile.email} />
        </aside>
      </div>
    </>
  );
}
