// npm run validate:content — checks front matter, slugs, dates, tags, skill ids and internal links.
// Runs as the first step of `npm run build`, so a broken content file fails the deploy.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from './lib/content.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { bundle, issues } = loadContent({ root, includeDrafts: false });

const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warn');
for (const i of [...errors, ...warnings]) {
  console.log(`${i.level === 'error' ? '✖' : '⚠'} ${i.file}: ${i.message}`);
}

console.log(
  `\ncontent: ${bundle.skills.length} skills, ${bundle.knowhow.length} know-how, ${bundle.projects.length} projects, ` +
    `${bundle.articles.length} articles, ${bundle.hobbies.length} hobbies, ${bundle.certificates.length} certificates`,
);
if (errors.length) {
  console.error(`\n${errors.length} error(s) — fix them before building.`);
  process.exit(1);
}
console.log('✔ content is valid');
