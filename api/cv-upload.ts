// Admin-only CV upload: replaces public/cv.pdf with one commit on main (Vercel then redeploys).
//
//   POST /api/cv-upload { baseSha, pdf: "<base64>" } → { commitSha, commitUrl }
//
// It also points content/cv.json at /cv.pdf if no PDF was linked yet, so the download button appears.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, requireAdmin } from './_lib/auth.js';
import { gh, GitHubError, githubEnv, headCommit } from './_lib/github.js';

const PDF_PATH = 'public/cv.pdf';
const CV_JSON = 'content/cv.json';
/** Vercel caps request bodies at 4.5 MB; 3 MB of PDF is ~4 MB as base64. */
const MAX_BYTES = 3_000_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!(await requireAdmin(req, res))) return;
  const env = githubEnv();
  if (!env) return res.status(500).json({ error: 'GITHUB_TOKEN is not set on the server (see README → Content editor)' });
  res.setHeader('Cache-Control', 'no-store');

  const body = req.body as { baseSha?: unknown; pdf?: unknown };
  if (typeof body?.baseSha !== 'string' || !/^[0-9a-f]{40}$/.test(body.baseSha)) return res.status(400).json({ error: 'baseSha is required' });
  if (typeof body.pdf !== 'string' || !body.pdf) return res.status(400).json({ error: 'pdf (base64) is required' });
  const bytes = Buffer.from(body.pdf, 'base64');
  if (bytes.length > MAX_BYTES) return res.status(413).json({ error: 'The PDF is larger than 3 MB — compress it and try again.' });
  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') return res.status(400).json({ error: 'That file is not a PDF.' });

  try {
    const head = await headCommit(env);
    if (head.sha !== body.baseSha) {
      return res.status(409).json({ error: 'The content changed on GitHub since you loaded it. Reload the page and upload again.' });
    }
    const blob = await gh<{ sha: string }>(env, '/git/blobs', { method: 'POST', body: { content: body.pdf, encoding: 'base64' } });
    const tree: { path: string; mode: string; type: string; sha?: string; content?: string }[] = [{ path: PDF_PATH, mode: '100644', type: 'blob', sha: blob.sha }];

    // Link the PDF from the CV page if nothing is linked yet.
    try {
      const file = await gh<{ content: string }>(env, `/contents/${CV_JSON}?ref=${head.sha}`);
      const text = Buffer.from(file.content, 'base64').toString('utf8');
      const cv = JSON.parse(text) as { pdf?: string };
      if (!cv.pdf) tree.push({ path: CV_JSON, mode: '100644', type: 'blob', content: text.replace(/\n}\s*$/, ',\n  "pdf": "/cv.pdf"\n}\n') });
    } catch {
      /* no cv.json yet: the PDF is still uploaded */
    }

    const newTree = await gh<{ sha: string }>(env, '/git/trees', { method: 'POST', body: { base_tree: head.tree, tree } });
    const commit = await gh<{ sha: string; html_url: string }>(env, '/git/commits', {
      method: 'POST',
      body: { message: 'cv: upload new CV PDF', tree: newTree.sha, parents: [head.sha] },
    });
    await gh(env, `/git/refs/heads/${env.branch}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
    return res.status(200).json({ commitSha: commit.sha, commitUrl: commit.html_url });
  } catch (e) {
    const status = e instanceof GitHubError && (e.status === 409 || e.status === 422) ? 409 : 502;
    return res.status(status).json({ error: (e as Error).message });
  }
}
