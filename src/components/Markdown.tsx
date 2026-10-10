import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

/** Renders prebuilt Markdown HTML; wires up code copy buttons and client-side internal links. */
export function Markdown({ html, className = '' }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>('[data-copy]');
      if (btn) {
        const code = btn.parentElement?.querySelector('code')?.textContent ?? '';
        try {
          await navigator.clipboard.writeText(code);
          btn.dataset.copied = '';
          btn.textContent = 'copied';
          setTimeout(() => {
            delete btn.dataset.copied;
            btn.textContent = 'copy';
          }, 1600);
        } catch {
          btn.textContent = 'press ⌘C';
        }
        return;
      }
      const a = target.closest<HTMLAnchorElement>('a');
      const href = a?.getAttribute('href');
      if (a && href?.startsWith('/') && !href.startsWith('//') && !a.target && !e.metaKey && !e.ctrlKey && !/\.\w+$/.test(href)) {
        e.preventDefault();
        navigate(href);
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [navigate]);

  return <div ref={ref} className={`prose-coffee ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
