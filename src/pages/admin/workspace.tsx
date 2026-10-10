// The editor works on a snapshot of /content from GitHub plus local, unpublished edits ("draft").
// The draft is kept in localStorage (per base commit) so a reload on the phone loses nothing.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FileMap } from '../../lib/content-core/build';
import type { Skill, SkillGroup } from '../../types/content';
import type { Change, Snapshot } from './contentApi';
import { readJsonFile } from './serialize';

type Draft = Record<string, string | null>;

export type Workspace = {
  headSha: string;
  original: FileMap;
  /** original + draft applied */
  files: FileMap;
  publicFiles: string[];
  changes: Change[];
  /** Apply edits: content string to write, null to delete. */
  write: (edits: Record<string, string | null>) => void;
  discard: () => void;
  skills: Skill[];
  groups: SkillGroup[];
};

const Ctx = createContext<Workspace | null>(null);
const KEY = 'content-draft';

export function useWorkspace(): Workspace {
  const ws = useContext(Ctx);
  if (!ws) throw new Error('useWorkspace outside WorkspaceProvider');
  return ws;
}

export function WorkspaceProvider({ snapshot, children }: { snapshot: Snapshot; children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { baseSha: string; draft: Draft } | null;
      return saved?.baseSha === snapshot.headSha ? saved.draft : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      if (Object.keys(draft).length) localStorage.setItem(KEY, JSON.stringify({ baseSha: snapshot.headSha, draft }));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage full or blocked: draft just isn't persisted */
    }
  }, [draft, snapshot.headSha]);

  const write = useCallback((edits: Record<string, string | null>) => setDraft((d) => ({ ...d, ...edits })), []);
  const discard = useCallback(() => setDraft({}), []);

  const value = useMemo<Workspace>(() => {
    const files: FileMap = { ...snapshot.files };
    for (const [path, content] of Object.entries(draft)) {
      if (content === null) delete files[path];
      else files[path] = content;
    }
    const changes: Change[] = Object.entries(draft)
      .filter(([path, content]) => (content === null ? path in snapshot.files : snapshot.files[path] !== content))
      .map(([path, content]) => ({ path, content }))
      .sort((a, b) => a.path.localeCompare(b.path));
    const skillsJson = readJsonFile<{ groups: SkillGroup[]; skills: Skill[] }>(files['content/skills.json'], { groups: [], skills: [] });
    return {
      headSha: snapshot.headSha,
      original: snapshot.files,
      files,
      publicFiles: snapshot.publicFiles,
      changes,
      write,
      discard,
      skills: skillsJson.skills ?? [],
      groups: skillsJson.groups ?? [],
    };
  }, [draft, snapshot, write, discard]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
