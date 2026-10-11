// Translations of the short texts (menu, page texts, profile, skills, CV, hobbies) into German and
// Japanese. Each entry is keyed by its English text: when the English text changes, the old
// translation simply stops matching and the site shows English until it is translated again.
import { useMemo, useState } from 'react';
import { translatableStrings, type TranslatableGroup } from '../../lib/content-core/localize';
import { useEdit } from '../../lib/edit';
import { TRANSLATION_LOCALES, type TranslationLocale } from '../../types/content';
import { Actions } from './ui';
import { prettyJson, readJsonFile } from './serialize';
import { useWorkspace } from './workspace';

const LABEL: Record<TranslationLocale, string> = { de: 'Deutsch', ja: '日本語' };
const file = (lang: TranslationLocale) => `content/i18n/${lang}.json`;

export function TranslationsForm({ onDone }: { onDone: () => void }) {
  const ws = useWorkspace();
  const bundle = useEdit()?.bundle;
  const items = useMemo(() => (bundle ? translatableStrings(bundle) : []), [bundle]);
  const [lang, setLang] = useState<TranslationLocale>('de');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [dicts, setDicts] = useState<Record<TranslationLocale, Record<string, string>>>(() => ({
    de: readJsonFile<Record<string, string>>(ws.files[file('de')], {}),
    ja: readJsonFile<Record<string, string>>(ws.files[file('ja')], {}),
  }));

  const dict = dicts[lang];
  const missing = items.filter((i) => !dict[i.text]?.trim()).length;
  const shown = onlyMissing ? items.filter((i) => !dict[i.text]?.trim()) : items;
  const groups = [...new Set(shown.map((i) => i.group))] as TranslatableGroup[];

  const set = (text: string, value: string) => setDicts((d) => ({ ...d, [lang]: { ...d[lang], [text]: value } }));

  const save = () => {
    const edits: Record<string, string> = {};
    for (const l of TRANSLATION_LOCALES) {
      // Keep entries for texts that are not on the site right now; drop emptied ones.
      const clean = Object.fromEntries(Object.entries(dicts[l]).filter(([, v]) => v.trim()));
      const next = prettyJson(clean);
      if (!(file(l) in ws.files) && !Object.keys(clean).length) continue; // nothing to create
      if (next !== ws.files[file(l)]) edits[file(l)] = next;
    }
    if (Object.keys(edits).length) ws.write(edits);
    onDone();
  };

  return (
    <div className="space-y-5">
      <h3 className="font-mono text-xl font-bold">Translations</h3>
      <p className="text-sm text-muted">
        English is the original. Visitors who pick another language see these translations; anything left empty stays English. Know-how articles, projects and blog posts are
        not translated.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {TRANSLATION_LOCALES.map((l) => (
          <button key={l} type="button" onClick={() => setLang(l)} className={`chip min-h-9 ${l === lang ? 'border-accent bg-accent text-on-accent' : ''}`} aria-pressed={l === lang}>
            {LABEL[l]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          only missing ({missing})
        </label>
      </div>
      {groups.map((g) => (
        <section key={g} className="space-y-3">
          <h4 className="section-title">{g}</h4>
          {shown
            .filter((i) => i.group === g)
            .map((i) => (
              <label key={i.text} className="block">
                <span className="mb-1 block whitespace-pre-line text-xs text-muted">{i.text}</span>
                <textarea
                  value={dict[i.text] ?? ''}
                  onChange={(e) => set(i.text, e.target.value)}
                  rows={Math.min(8, Math.max(1, Math.ceil(i.text.length / 60)))}
                  lang={lang}
                  className="input"
                  placeholder={`${LABEL[lang]}…`}
                />
              </label>
            ))}
        </section>
      ))}
      {!shown.length ? <p className="text-sm text-muted">Everything is translated.</p> : null}
      <Actions onSave={save} onCancel={onDone} />
    </div>
  );
}
