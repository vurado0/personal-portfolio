// Serves dist/ the way Vercel does (vercel.json): clean URLs (/skills → skills.html), every other
// path falls back to spa.html, text is compressed and hashed assets are cached. Used by the smoke tests and Lighthouse in CI; `npm run serve` locally.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 4173;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
};

function resolve(urlPath: string): string {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = clean === '/' ? ['index.html'] : [clean, `${clean}.html`, path.join(clean, 'index.html')];
  for (const c of candidates) {
    const file = path.join(dist, c);
    if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return path.join(dist, 'spa.html');
}

http
  .createServer((req, res) => {
    const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
    const file = resolve(urlPath);
    const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
    const headers: Record<string, string> = { 'content-type': type };
    if (urlPath.startsWith('/assets/')) headers['cache-control'] = 'public, max-age=31536000, immutable';
    const compress = /text|javascript|json|xml|svg/.test(type) && /\bbr\b/.test(String(req.headers['accept-encoding']));
    if (compress) headers['content-encoding'] = 'br';
    res.writeHead(200, headers);
    const stream = fs.createReadStream(file);
    if (compress) stream.pipe(zlib.createBrotliCompress()).pipe(res);
    else stream.pipe(res);
  })
  .listen(port, () => console.log(`dist/ on http://localhost:${port}`));
