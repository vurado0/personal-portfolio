import { Link } from 'react-router';
import { useContent } from '../lib/content';
import { useT } from '../i18n';

export function SkillChip({ id }: { id: string }) {
  const skill = useContent().skillById.get(id);
  return (
    <Link to={`/skills#skill-${id}`} className="chip text-fg hover:border-accent hover:text-accent hover:no-underline">
      <span className="text-accent" aria-hidden="true">
        #
      </span>
      {skill?.name ?? id}
    </Link>
  );
}

export function SkillChips({ ids, className = '' }: { ids: string[]; className?: string }) {
  const t = useT();
  if (!ids.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label={t('chips.skills')}>
      {ids.map((id) => (
        <li key={id}>
          <SkillChip id={id} />
        </li>
      ))}
    </ul>
  );
}

export function TagChip({ tag, active, onClick }: { tag: string; active?: boolean; onClick?: () => void }) {
  const cls = `chip ${active ? 'border-accent bg-accent text-on-accent' : 'text-muted hover:border-accent hover:text-fg'}`;
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-pressed={active}>
      {tag}
    </button>
  ) : (
    <span className={cls}>{tag}</span>
  );
}
