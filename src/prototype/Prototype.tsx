// Design prototype: the portfolio rebuilt with Glisse (Apple's Liquid Glass for the web).
// Real content and languages, glass components over a coffee wallpaper that the glass bends.
// Lives at /prototype on this branch only; the real site is untouched.
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button, Glass, Menu, SearchField, SegmentedControl, Slider, Switch, TabBar, Input } from 'glisse';
import './prototype.css';
import { LOCALES, setLocale, useLocale, useT } from '../i18n';
import { categoryLabel, levelKey, useContent } from '../lib/content';
import { formatDate } from '../lib/format';
import { useTheme } from '../lib/theme';
import type { ProjectDoc } from '../types/content';
import { ArrowIcon, BookIcon, GitHubIcon, HeartIcon, HomeIcon, LinkIcon, MailIcon, MoonIcon, PenIcon, PersonIcon, ProjectsIcon, ScaleIcon, SunIcon } from './icons';

type Tab = 'home' | 'projects' | 'knowhow' | 'blog' | 'about';

/** A glass surface for content. `clear` shows the bent wallpaper (hero); the default is a thicker,
 *  frosted material so longer text stays readable, as in iOS. */
function Panel({ children, className = '', clear = false }: { children: ReactNode; className?: string; clear?: boolean }) {
  return <Glass className={`pg-panel ${clear ? 'pg-clear' : 'pg-frost'} ${className}`}>{children}</Glass>;
}

/** Section heading; on the wallpaper (`floating`) it sits on a small glass capsule. */
function SectionTitle({ children, action, floating = false }: { children: ReactNode; action?: ReactNode; floating?: boolean }) {
  const title = <h2 className="pg-eyebrow">{children}</h2>;
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 ${floating ? '' : 'px-1'}`}>
      {floating ? <Glass className="pg-capsule">{title}</Glass> : title}
      {action ? floating ? <Glass className="pg-capsule">{action}</Glass> : action : null}
    </div>
  );
}

/** Page header on glass: eyebrow, title and the page's controls. */
function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <Panel className="mb-6 flex flex-wrap items-end justify-between gap-5 p-6 sm:p-8">
      <div>
        <p className="pg-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{title}</h1>
      </div>
      {children}
    </Panel>
  );
}

function years(start: string, end: string | undefined, now: string): string {
  const s = start.slice(0, 4);
  const e = end?.slice(0, 4);
  return !e ? `${s} – ${now}` : e === s ? s : `${s} – ${e}`;
}

function StatusDot({ status }: { status: ProjectDoc['status'] }) {
  const t = useT();
  const label = t(status === 'in progress' ? 'status.inProgress' : status === 'done' ? 'status.done' : 'status.idea').replace(/^[^\p{L}]+/u, '');
  return (
    <span className="pg-status" data-status={status}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

function ProjectGlassCard({ project }: { project: ProjectDoc }) {
  return (
    <Panel className="group flex flex-col overflow-hidden p-2">
      {project.cover ? <img src={project.cover} alt="" loading="lazy" className="aspect-[16/10] w-full rounded-[20px] object-cover" /> : null}
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <StatusDot status={project.status} />
          <span className="pg-mono text-xs opacity-60">{project.period}</span>
        </div>
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight">
          <Link to={project.url} className="pg-stretched">
            {project.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed opacity-75">{project.summary}</p>
        <p className="pg-mono mt-auto pt-2 text-[11px] opacity-55">{project.stack.slice(0, 4).join(' · ')}</p>
      </div>
    </Panel>
  );
}

// ---- Home ------------------------------------------------------------------------

function HomeTab({ go }: { go: (tab: Tab) => void }) {
  const { content } = useContent();
  const t = useT();
  const p = content.profile;
  const featured = content.projects.filter((x) => x.featured).slice(0, 6);
  const github = p.socials.find((s) => s.id === 'github')?.url;
  return (
    <div className="space-y-10">
      <Panel clear className="pg-hero grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          <p className="pg-mono text-sm opacity-70">
            <span className="pg-accent">$</span> whoami
          </p>
          <h1 className="mt-3 text-5xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
            {p.name}
            <span className="pg-accent">.</span>
          </h1>
          <p className="mt-3 text-lg opacity-75">{p.role}</p>
          <p className="mt-5 max-w-lg text-xl font-medium tracking-tight">{p.tagline}</p>
          {p.highlights?.length ? (
            <ul aria-label={t('home.highlights')} className="mt-6 flex flex-wrap gap-2">
              {p.highlights.map((h) => (
                <li key={h} className="pg-chip">
                  {h.replace('{projects}', String(content.projects.length))}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="filled" onClick={() => go('projects')}>
              {t('home.viewProjects')}
            </Button>
            <Button onClick={() => go('about')}>{t('home.cv')}</Button>
            {github ? <Button icon={<GitHubIcon />} aria-label="GitHub" onClick={() => window.open(github, '_blank', 'noopener')} /> : null}
          </div>
        </div>
        {p.photo ? <img src={p.photo} alt={t('home.portraitAlt', { name: p.name })} className="aspect-square w-full rounded-[28px] object-cover shadow-2xl" /> : null}
      </Panel>

      <section>
        <SectionTitle
          floating
          action={
            <button type="button" className="pg-link" onClick={() => go('projects')}>
              {t('home.allProjects')}
            </button>
          }
        >
          {t('home.featured')}
        </SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((x) => (
            <ProjectGlassCard key={x.slug} project={x} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel className="p-6">
          <SectionTitle>{t('home.focus')}</SectionTitle>
          <ul className="space-y-3 px-1">
            {p.currentFocus.map((f) => (
              <li key={f} className="flex items-center gap-3 text-[15px]">
                <span className="pg-dot" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-6">
          <SectionTitle
            action={
              <button type="button" className="pg-link" onClick={() => go('knowhow')}>
                {t('home.knowledgeBase')}
              </button>
            }
          >
            {t('home.recentKnowhow')}
          </SectionTitle>
          <ul className="divide-y divide-[var(--pg-separator)]">
            {content.knowhow.slice(0, 4).map((d) => (
              <li key={d.url} className="relative flex items-center justify-between gap-4 px-1 py-3">
                <div className="min-w-0">
                  <Link to={d.url} className="pg-stretched block truncate font-medium">
                    {d.title}
                  </Link>
                  <p className="pg-mono text-xs opacity-60">{categoryLabel(d.category)}</p>
                </div>
                <span className="opacity-50">
                  <ArrowIcon />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ---- Projects ----------------------------------------------------------------------

const FILTERS = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'japanese', label: 'Japanese', match: (p: ProjectDoc) => p.tags.includes('japanese') },
  { value: 'learning', label: 'Learning', match: (p: ProjectDoc) => p.tags.includes('education') },
  { value: 'design', label: 'Design', match: (p: ProjectDoc) => p.tags.some((t) => t === 'design' || t === 'generative') },
];

function ProjectsTab() {
  const { content } = useContent();
  const [filter, setFilter] = useState('all');
  const match = FILTERS.find((f) => f.value === filter)!.match;
  const list = content.projects.filter(match);
  return (
    <div>
      <PageHeader eyebrow="projects" title="Things I built">
        <SegmentedControl aria-label="Filter projects" items={FILTERS.map(({ value, label }) => ({ value, label }))} value={filter} onValueChange={setFilter} />
      </PageHeader>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((x) => (
          <ProjectGlassCard key={x.slug} project={x} />
        ))}
      </div>
    </div>
  );
}

// ---- Know-how ----------------------------------------------------------------------

function KnowhowTab() {
  const { content, knowhowCategories } = useContent();
  const t = useT();
  const [q, setQ] = useState('');
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const docs = content.knowhow.filter((d) => terms.every((term) => `${d.title} ${d.summary} ${d.tags.join(' ')} ${d.category}`.toLowerCase().includes(term)));
  return (
    <div>
      <PageHeader eyebrow="know-how" title="Knowledge base">
        <div className="w-full max-w-sm">
          <SearchField aria-label={t('knowhow.search')} placeholder={t('knowhow.placeholder')} value={q} onValueChange={setQ} />
        </div>
      </PageHeader>
      <div className="gap-5 md:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {knowhowCategories
          .filter((c) => docs.some((d) => d.category === c))
          .map((c) => (
            <Panel key={c} className="p-6">
              <SectionTitle>{categoryLabel(c)}</SectionTitle>
              <ul className="divide-y divide-[var(--pg-separator)]">
                {docs
                  .filter((d) => d.category === c)
                  .map((d) => (
                    <li key={d.url} className="relative px-1 py-3">
                      <Link to={d.url} className="pg-stretched font-medium">
                        {d.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm opacity-70">{d.summary}</p>
                    </li>
                  ))}
              </ul>
            </Panel>
          ))}
      </div>
      {!docs.length ? <p className="pg-mono mt-10 text-center opacity-70">{t('search.empty', { q })}</p> : null}
    </div>
  );
}

// ---- Blog --------------------------------------------------------------------------

function BlogTab() {
  const { content } = useContent();
  const locale = useLocale();
  return (
    <div>
      <PageHeader eyebrow="blog" title="Articles" />
      <div className="grid gap-5 md:grid-cols-2">
        {content.articles.map((a) => (
          <Panel key={a.url} className="relative flex flex-col gap-3 p-7">
            <p className="pg-mono text-xs opacity-60">{formatDate(a.date, locale)}</p>
            <h2 className="text-2xl font-bold leading-tight tracking-tight">
              <Link to={a.url} className="pg-stretched">
                {a.title}
              </Link>
            </h2>
            <p className="opacity-75">{a.summary}</p>
            <span className="pg-link mt-auto inline-flex items-center gap-2 pt-2">
              Read <ArrowIcon />
            </span>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ---- About -------------------------------------------------------------------------

function AboutTab() {
  const { content } = useContent();
  const t = useT();
  const cv = content.cv;
  const timelines = cv.sections.filter((s) => s.visible && s.type === 'timeline' && s.items.length);
  const groups = content.skillGroups.map((g) => ({ ...g, skills: content.skills.filter((s) => s.group === g.id) })).filter((g) => g.skills.length);
  const [sent, setSent] = useState(false);
  return (
    <div className="space-y-8">
      <Panel className="grid gap-8 p-6 sm:p-10 md:grid-cols-[12rem_minmax(0,1fr)]">
        {content.profile.photo ? <img src={content.profile.photo} alt="" className="aspect-square w-40 rounded-[28px] object-cover md:w-full" /> : null}
        <div>
          <p className="pg-eyebrow">{t('cv.profile')}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em]">{cv.personal.fullName || content.profile.name}</h1>
          <p className="mt-1 opacity-70">{cv.personal.headline}</p>
          <p className="mt-5 max-w-2xl leading-relaxed opacity-85">{cv.summary}</p>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {timelines.map((s) =>
          s.type === 'timeline' ? (
            <Panel key={s.id} className="p-6">
              <SectionTitle>{s.title}</SectionTitle>
              <ol className="space-y-5 px-1">
                {s.items.map((e, i) => (
                  <li key={i} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                    <span className="pg-mono pt-0.5 text-xs opacity-60">{years(e.start, e.end, t('cv.now'))}</span>
                    <div>
                      <p className="font-semibold leading-snug">{e.title}</p>
                      <p className="text-sm opacity-70">{e.org}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null,
        )}
      </div>

      <section>
        <SectionTitle floating>skills</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Panel key={g.id} className="p-6">
              <p className="mb-4 font-semibold">{g.label}</p>
              <ul className="space-y-4">
                {g.skills.map((s) => (
                  <li key={s.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span>{s.name}</span>
                      <span className="pg-mono text-[11px] opacity-60">{t(levelKey(s.level))}</span>
                    </div>
                    <Slider aria-label={`${s.name} level`} min={0} max={5} step={1} value={s.level} disabled />
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </section>

      <Panel className="grid gap-6 p-6 sm:p-10 md:grid-cols-2">
        <div>
          <p className="pg-eyebrow">{t('cvreq.title')}</p>
          <p className="mt-3 max-w-md leading-relaxed opacity-80">{t('cvreq.text')}</p>
        </div>
        {sent ? (
          <p role="status" className="self-center text-lg font-medium">
            {t('cvreq.sent')}
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true); // prototype: nothing is sent
            }}
          >
            <Input aria-label={t('cvreq.name')} placeholder={t('cvreq.name')} icon={<PersonIcon />} required />
            <Input type="email" aria-label={t('cvreq.email')} placeholder={t('cvreq.email')} icon={<MailIcon />} required />
            <Input aria-label={t('cvreq.company')} placeholder={t('cvreq.company')} />
            <div className="pt-2">
              <Button variant="filled" type="submit">
                {t('cvreq.send')}
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}

// ---- Shell -------------------------------------------------------------------------

export default function Prototype() {
  const t = useT();
  const locale = useLocale();
  const { content } = useContent();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>('home');
  const nav = useMemo(() => new Map(content.navigation.map((n) => [n.id, n.label])), [content.navigation]);
  const go = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pg-root">
      {/* The wallpaper every glass surface bends. */}
      <div className="pg-wallpaper" data-glisse-backdrop aria-hidden="true" />
      <div className="pg-edge pg-edge-top" aria-hidden="true" />
      <div className="pg-edge pg-edge-bottom" aria-hidden="true" />

      <header className="pg-top">
        <Glass className="pg-pill pg-brand">
          <button type="button" onClick={() => go('home')} className="pg-mono text-sm font-bold">
            {content.profile.name}
            <span className="pg-accent pg-caret">_</span>
          </button>
        </Glass>
        <div className="flex items-center gap-2.5">
          <div className="hidden md:block">
            <SegmentedControl aria-label={t('lang.title')} items={LOCALES.map((l) => ({ value: l.id, label: l.short }))} value={locale} onValueChange={(v) => setLocale(v as typeof locale)} />
          </div>
          <Glass className="pg-pill flex items-center gap-2 px-3">
            <SunIcon />
            <Switch aria-label={t('theme.toggle')} checked={theme === 'dark'} onCheckedChange={() => toggle()} />
            <MoonIcon />
          </Glass>
          <Menu
            aria-label="More"
            align="end"
            items={[
              { label: nav.get('skills') ?? 'Skills', icon: <ProjectsIcon />, onSelect: () => go('about') },
              { label: nav.get('hobbies') ?? 'Hobbies', icon: <HeartIcon />, onSelect: () => (location.href = '/hobbies') },
              { label: nav.get('contact') ?? 'Contact', icon: <MailIcon />, onSelect: () => (location.href = '/contact') },
              'separator',
              ...LOCALES.filter((l) => l.id !== locale).map((l) => ({ label: l.label, icon: <span className="pg-mono text-xs">{l.short}</span>, onSelect: () => setLocale(l.id) })),
              'separator',
              { label: 'Impressum', icon: <ScaleIcon />, onSelect: () => (location.href = '/impressum') },
              { label: 'Current site', icon: <LinkIcon />, onSelect: () => (location.href = '/') },
            ]}
          />
        </div>
      </header>

      <main className="pg-main" key={tab}>
        {tab === 'home' ? <HomeTab go={go} /> : null}
        {tab === 'projects' ? <ProjectsTab /> : null}
        {tab === 'knowhow' ? <KnowhowTab /> : null}
        {tab === 'blog' ? <BlogTab /> : null}
        {tab === 'about' ? <AboutTab /> : null}
        <footer className="pg-mono mt-16 text-center text-xs opacity-60">
          © {new Date().getFullYear()} {content.profile.name} · Liquid Glass prototype ·{' '}
          <a href="https://glisse.kelvinzhang.com" className="underline">
            Glisse
          </a>
        </footer>
      </main>

      <nav className="pg-tabbar" aria-label="Main">
        <TabBar
          aria-label="Sections"
          value={tab}
          onValueChange={(v) => go(v as Tab)}
          items={[
            { value: 'home', label: nav.get('home') ?? 'Home', icon: <HomeIcon /> },
            { value: 'projects', label: nav.get('projects') ?? 'Projects', icon: <ProjectsIcon /> },
            { value: 'knowhow', label: nav.get('knowhow') ?? 'Know-how', icon: <BookIcon /> },
            { value: 'blog', label: nav.get('blog') ?? 'Blog', icon: <PenIcon /> },
            { value: 'about', label: (nav.get('about') ?? 'About').split(' / ')[0], icon: <PersonIcon /> },
          ]}
        />
      </nav>
    </div>
  );
}
