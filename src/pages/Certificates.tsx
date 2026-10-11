import { SkillChips } from '../components/Chips';
import { PageHeader } from '../components/PageHeader';
import { useContent } from '../lib/content';
import { AddButton, ItemTools, useEdit } from '../lib/edit';
import { formatDate } from '../lib/format';
import { Seo } from '../lib/head';
import { useLocale, useT } from '../i18n';
import type { CertificateStatus } from '../types/content';

const order: CertificateStatus[] = ['done', 'in progress', 'planned'];
const badge: Record<CertificateStatus, string> = {
  done: 'border-fg/60 text-fg',
  'in progress': 'border-accent text-accent',
  planned: 'border-line text-muted',
};

export default function Certificates() {
  const { content } = useContent();
  const editing = Boolean(useEdit());
  const t = useT();
  const locale = useLocale();
  const statusLabel = (s: CertificateStatus) => t(s === 'done' ? 'cert.done' : s === 'in progress' ? 'cert.inProgress' : 'cert.planned');
  return (
    <>
      <Seo title="Certificates" description="Completed, in-progress and planned certifications." path="/certificates" />
      <PageHeader pageId="certificates" label="certificates" title="Certifications">
        Completed, in progress and on the roadmap.
      </PageHeader>
      <div className="container-page space-y-12 pt-10">
        {order.map((status) => {
          const list = content.certificates.filter((c) => c.status === status);
          if (!list.length && !editing) return null;
          return (
            <section key={status} aria-labelledby={`c-${status}`}>
              <h2 id={`c-${status}`} className="section-title">
                {statusLabel(status)}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {list.map((c) => (
                  <article key={c.id} className="card group relative flex flex-col gap-2">
                    <ItemTools target={{ kind: 'certificate', id: c.id }} label={c.title} />
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-mono font-bold">{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.title} ↗</a> : c.title}</h3>
                      <span className={`chip flex-none ${badge[c.status]}`}>{statusLabel(c.status)}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {c.issuer}
                      {c.date ? ` · ${t(c.status === 'done' ? 'cert.earned' : 'cert.target')} ${formatDate(c.date, locale)}` : ''}
                    </p>
                    <SkillChips ids={c.skills} className="mt-1" />
                  </article>
                ))}
                {status === 'planned' ? <AddButton target={{ kind: 'certificate' }} label="Add certificate" /> : null}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
