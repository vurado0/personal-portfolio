// IBM Plex Sans JP for the Japanese pages, cut down to the characters the site actually uses (all
// prerendered pages, the Japanese interface strings and content translations, plus every kana and
// full-width sign). About 60 kB per weight instead of 900 kB. Characters that appear only later
// (e.g. a new feed post) fall back to the system's Japanese font until the next build.
import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const WEIGHTS = [400, 700] as const;
export const japaneseFontFiles = WEIGHTS.map((w) => `/fonts/ibm-plex-sans-jp-${w}.woff2`);

/** Japanese and other wide characters (CJK, kana, full-width forms). */
const wide = (c: string) => c.codePointAt(0)! >= 0x2e80;

function htmlFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

export async function writeJapaneseFont(root: string, dist: string): Promise<{ chars: number; bytes: number }> {
  const sources = [
    fs.readFileSync(path.join(root, 'src/i18n/ja.ts'), 'utf8'),
    fs.readFileSync(path.join(root, 'content/i18n/ja.json'), 'utf8'),
    ...htmlFiles(dist).map((f) => fs.readFileSync(f, 'utf8')),
  ];
  const chars = new Set([...sources.join('')].filter(wide));
  for (let c = 0x3000; c <= 0x30ff; c++) chars.add(String.fromCharCode(c)); // punctuation, hiragana, katakana
  for (let c = 0xff01; c <= 0xff9f; c++) chars.add(String.fromCharCode(c)); // full-width forms
  const text = [...chars].join('');

  const out = path.join(dist, 'fonts');
  fs.mkdirSync(out, { recursive: true });
  const pkg = path.join(root, 'node_modules/@fontsource/ibm-plex-sans-jp');
  let bytes = 0;
  for (const w of WEIGHTS) {
    const source = fs.readFileSync(path.join(pkg, `files/ibm-plex-sans-jp-japanese-${w}-normal.woff2`));
    const font = await subsetFont(source, text, { targetFormat: 'woff2' });
    fs.writeFileSync(path.join(out, `ibm-plex-sans-jp-${w}.woff2`), font);
    bytes += font.length;
  }
  // The SIL Open Font License travels with the font files.
  fs.copyFileSync(path.join(pkg, 'LICENSE'), path.join(out, 'IBM-Plex-Sans-JP-OFL.txt'));
  return { chars: chars.size, bytes };
}
