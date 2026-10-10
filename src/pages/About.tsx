import { PageHeader } from '../components/PageHeader';
import { site } from '../config/site';
import { content } from '../lib/content';
import { Seo } from '../lib/head';

const typeIcon = { education: '🎓', work: '⌘', certificate: '✓' } as const;

export default function About() {
  const { cv } = content;
  return (
    <>
      <Seo title="About / CV" description={`CV of ${site.name}: education, work, certificates and languages.`} path="/about" />
      <PageHeader label="about" title={`About ${site.name}`}>
        {cv.summary}
      </PageHeader>
      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_18rem]">
        <section aria-labelledby="tl">
          <h2 id="tl" className="section-title">
            timeline
          </h2>
          <ol className="mt-6 border-l border-line/70">
            {cv.timeline.map((e) => (
              <li key={`${e.title}-${e.start}`} className="relative pb-8 pl-6">
                <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                <p className="font-mono text-xs text-muted">
                  {e.start} — {e.end ?? 'now'} · <span aria-hidden="true">{typeIcon[e.type]}</span> {e.type}
                </p>
                <h3 className="mt-1 font-mono font-bold">{e.title}</h3>
                <p className="text-sm text-muted">{e.org}</p>
                {e.text ? <p className="mt-2 max-w-xl text-sm">{e.text}</p> : null}
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-10">
          <section aria-labelledby="lang">
            <h2 id="lang" className="section-title">
              languages
            </h2>
            <ul className="mt-4 space-y-2 font-mono text-sm">
              {cv.languages.map((l) => (
                <li key={l.name} className="flex justify-between border-b border-line/40 pb-2">
                  <span>{l.name}</span>
                  <span className="text-muted">{l.level}</span>
                </li>
              ))}
            </ul>
          </section>
          {cv.pdf ? (
            <a href={cv.pdf} className="btn-primary w-full" download>
              ↓ Download CV (PDF)
            </a>
          ) : null}
        </aside>
      </div>
    </>
  );
}
