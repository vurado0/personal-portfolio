// Markdown → HTML (heading ids, code blocks with copy button, lazy images).
// Pure: runs at build time (with highlight.js injected) and in the admin preview (without).
import { Marked, type Tokens } from 'marked';
import type { Heading } from '../../types/content.ts';

/** Returns highlighted HTML for a code block, or null to fall back to escaped text. */
export type Highlighter = (code: string, lang: string) => string | null;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export type RenderedMarkdown = { html: string; headings: Heading[]; links: string[]; text: string };

/** Renders Markdown to HTML with heading ids, highlighted code blocks (with copy button) and lazy images. */
export function renderMarkdown(source: string, highlight?: Highlighter): RenderedMarkdown {
  const headings: Heading[] = [];
  const links: string[] = [];
  const used = new Map<string, number>();

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        const plain = token.text.replace(/[`*_~]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
        let id = slugify(plain) || 'section';
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n > 0) id = `${id}-${n}`;
        if (token.depth >= 2 && token.depth <= 3) headings.push({ id, text: plain, depth: token.depth });
        return `<h${token.depth} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${token.depth}>\n`;
      },
      code(token: Tokens.Code) {
        const lang = (token.lang ?? '').split(/\s/)[0];
        const highlighted = (lang && highlight?.(token.text, lang)) || escapeHtml(token.text);
        const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '';
        return `<div class="code-block">${label}<button type="button" class="copy-btn" data-copy aria-label="Copy code">copy</button><pre tabindex="0"><code class="hljs${lang ? ` language-${escapeHtml(lang)}` : ''}">${highlighted}</code></pre></div>\n`;
      },
      link(token: Tokens.Link) {
        links.push(token.href);
        const inner = this.parser.parseInline(token.tokens);
        const external = /^https?:\/\//.test(token.href);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        return `<a href="${escapeHtml(token.href)}"${title}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>`;
      },
      image(token: Tokens.Image) {
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text)}"${title} loading="lazy" decoding="async">`;
      },
    },
  });

  const html = marked.parse(source, { async: false }) as string;
  const text = source
    .replace(/```[\w-]*/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { html, headings, links, text };
}
