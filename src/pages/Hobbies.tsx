import { Background } from '../components/Background';
import { useContent } from '../lib/content';
import { AddButton, ItemTools } from '../lib/edit';
import { Seo } from '../lib/head';

export default function Hobbies() {
  const { content } = useContent();
  return (
    <>
      <Seo title="Hobbies" description="What I do when I am not at the keyboard." path="/hobbies" />
      <Background name="latte-swirl" position="center 20%">
        <div className="container-page pb-12 pt-14 sm:pt-20">
          <dl className="meta-grid">
            <dt>Page:</dt>
            <dd className="text-fg">Hobbies</dd>
          </dl>
          <h1 className="blog-headline mt-4 text-6xl sm:text-8xl">Off the clock.</h1>
        </div>
      </Background>
      <div className="container-page grid gap-0 pt-6">
        {content.hobbies.map((h) => (
          <article key={h.id} className="group relative grid gap-6 border-t border-ink/20 py-10 dark:border-cream/15 md:grid-cols-[1fr_1.2fr]">
            <ItemTools target={{ kind: 'hobby', id: h.id }} label={h.title} />
            <div>
              <h2 className="blog-headline text-4xl sm:text-5xl">{h.title}</h2>
              <p className="mt-4 max-w-lg text-lg">{h.text}</p>
              {h.links?.length ? (
                <ul className="mt-4 flex flex-wrap gap-4 text-sm">
                  {h.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        {l.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {h.image ? <img src={h.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" /> : null}
          </article>
        ))}
        <AddButton target={{ kind: 'hobby' }} label="Add hobby" className="mb-6" />
      </div>
    </>
  );
}
