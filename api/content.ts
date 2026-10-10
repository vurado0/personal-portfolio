// Admin-only content API backed by GitHub. Portfolio content stays as files in the repo
// (prerendered, versioned); edits from /admin become one commit on main, which Vercel deploys.
//
//   GET  /api/content             → { headSha, files: { "content/…": text }, publicFiles: ["/cv.pdf", …] }
//   GET  /api/content?status=SHA  → { state: "pending" | "success" | "failure" | "error", url? }
//   POST /api/content { baseSha, message, changes: [{ path, content | null }] } → { commitSha, commitUrl }
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, requireAdmin } from './_lib/auth.js';
import { gh, GitHubError, githubEnv, headCommit, type GitHubEnv } from './_lib/github.js';

const PATH_RE = /^content\/[a-z0-9][a-z0-9/_.-]*\.(md|json)$/;
const MAX_FILE = 500_000;

type TreeEntry = { path: string; type: 'blob' | 'tree'; sha: string; size?: number };

async function readAll(env: GitHubEnv) {
  const head = await headCommit(env);
  const tree = await gh<{ tree: TreeEntry[]; truncated: boolean }>(env, `/git/trees/${head.tree}?recursive=1`);
  const blobs = tree.tree.filter((e) => e.type === 'blob');
  const contentEntries = blobs.filter((e) => PATH_RE.test(e.path));
  const files: Record<string, string> = {};
  await Promise.all(
    contentEntries.map(async (e) => {
      const blob = await gh<{ content: string; encoding: string }>(env, `/git/blobs/${e.sha}`);
      files[e.path] = Buffer.from(blob.content, blob.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
    }),
  );
  const publicFiles = blobs.filter((e) => e.path.startsWith('public/')).map((e) => e.path.slice('public'.length));
  return { headSha: head.sha, files, publicFiles };
}

async function commitStatus(env: GitHubEnv, sha: string) {
  // Vercel reports deployments as commit statuses on GitHub.
  const s = await gh<{ state: string; statuses: { context: string; state: string; target_url?: string }[] }>(env, `/commits/${sha}/status`);
  const vercel = s.statuses.find((x) => x.context.toLowerCase().includes('vercel'));
  return { state: vercel?.state ?? (s.statuses.length ? s.state : 'pending'), url: vercel?.target_url };
}

type Change = { path: string; content: string | null };

function parseChanges(body: unknown): { baseSha: string; message: string; changes: Change[] } | string {
  const b = body as { baseSha?: unknown; message?: unknown; changes?: unknown };
  if (typeof b?.baseSha !== 'string' || !/^[0-9a-f]{40}$/.test(b.baseSha)) return 'baseSha is required';
  const message = typeof b.message === 'string' && b.message.trim() ? b.message.trim().slice(0, 200) : 'content: update via admin';
  if (!Array.isArray(b.changes) || b.changes.length === 0 || b.changes.length > 100) return 'changes must be a list of 1–100 entries';
  const changes: Change[] = [];
  for (const c of b.changes as { path?: unknown; content?: unknown }[]) {
    if (typeof c.path !== 'string' || !PATH_RE.test(c.path) || c.path.includes('..')) return `invalid path: ${String(c.path)}`;
    if (c.content !== null && (typeof c.content !== 'string' || c.content.length > MAX_FILE)) return `invalid content for ${c.path}`;
    changes.push({ path: c.path, content: c.content as string | null });
  }
  return { baseSha: b.baseSha, message, changes };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;
  if (!(await requireAdmin(req, res))) return;
  const env = githubEnv();
  if (!env) return res.status(500).json({ error: 'GITHUB_TOKEN is not set on the server (see README → Content editor)' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const status = typeof req.query.status === 'string' ? req.query.status : '';
      if (status) {
        if (!/^[0-9a-f]{40}$/.test(status)) return res.status(400).json({ error: 'invalid sha' });
        return res.status(200).json(await commitStatus(env, status));
      }
      return res.status(200).json(await readAll(env));
    }

    const parsed = parseChanges(req.body);
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed });
    const head = await headCommit(env);
    if (head.sha !== parsed.baseSha) {
      return res.status(409).json({ error: 'The content changed on GitHub since you loaded it. Reload, then apply your changes again.' });
    }
    const tree = await gh<{ sha: string }>(env, '/git/trees', {
      method: 'POST',
      body: {
        base_tree: head.tree,
        tree: parsed.changes.map((c) =>
          c.content === null
            ? { path: c.path, mode: '100644', type: 'blob', sha: null }
            : { path: c.path, mode: '100644', type: 'blob', content: c.content },
        ),
      },
    });
    const commit = await gh<{ sha: string; html_url: string }>(env, '/git/commits', {
      method: 'POST',
      body: { message: parsed.message, tree: tree.sha, parents: [head.sha] },
    });
    await gh(env, `/git/refs/heads/${env.branch}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
    return res.status(200).json({ commitSha: commit.sha, commitUrl: commit.html_url });
  } catch (e) {
    const status = e instanceof GitHubError ? (e.status === 401 || e.status === 403 ? 502 : e.status === 409 || e.status === 422 ? 409 : 502) : 500;
    return res.status(status).json({ error: (e as Error).message });
  }
}
