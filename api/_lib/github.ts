// Minimal GitHub REST client for the content editor (fine-grained token: Contents read/write on one repo).

export type GitHubEnv = { token: string; repo: string; branch: string };

export function githubEnv(): GitHubEnv | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? 'vurado0/personal-portfolio';
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  return token ? { token, repo, branch } : null;
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function gh<T>(env: GitHubEnv, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${env.repo}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${env.token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'portfolio-admin',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      msg = (JSON.parse(text) as { message?: string }).message ?? text;
    } catch {
      /* not JSON */
    }
    throw new GitHubError(res.status, `GitHub ${res.status}: ${msg}`);
  }
  return (await res.json()) as T;
}

export async function headCommit(env: GitHubEnv): Promise<{ sha: string; tree: string }> {
  const ref = await gh<{ object: { sha: string } }>(env, `/git/ref/heads/${env.branch}`);
  const commit = await gh<{ tree: { sha: string } }>(env, `/git/commits/${ref.object.sha}`);
  return { sha: ref.object.sha, tree: commit.tree.sha };
}
