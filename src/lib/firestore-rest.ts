// Public, read-only Firestore access over the REST API. Visitors only read published posts, so the
// ~700 kB Firestore SDK is not needed for them; requests run unauthenticated against the same
// security rules and the same composite index (published + createdAt) as the SDK query.
import { firebaseConfig, useEmulators } from './env';

type Value = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  mapValue?: { fields?: Record<string, Value> };
  arrayValue?: { values?: Value[] };
};

export type RestDoc = { id: string; data: Record<string, unknown> };

export class RestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Firestore REST value → plain JS (timestamps become Date). */
function decode(v: Value): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return new Date(v.timestampValue!);
  if ('mapValue' in v) return decodeFields(v.mapValue?.fields);
  if ('arrayValue' in v) return (v.arrayValue?.values ?? []).map(decode);
  return null;
}

function decodeFields(fields: Record<string, Value> = {}): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));
}

const base = () => {
  const host = useEmulators ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com';
  return `${host}/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
};
const key = () => (firebaseConfig.apiKey ? `?key=${encodeURIComponent(firebaseConfig.apiKey)}` : '');

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new RestError(res.status, `Firestore ${res.status}`);
  return (await res.json()) as T;
}

/** Published posts, newest first (same query as the SDK version). */
export async function queryPublishedPosts(max: number): Promise<RestDoc[]> {
  const rows = await call<{ document?: { name: string; fields?: Record<string, Value> } }[]>(`${base()}:runQuery${key()}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'posts' }],
        where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: max,
      },
    }),
  });
  return rows.filter((r) => r.document).map(({ document }) => ({ id: document!.name.split('/').pop()!, data: decodeFields(document!.fields) }));
}

/** One post; 403 (unpublished) and 404 both mean "not visible to visitors". */
export async function getPostDoc(id: string): Promise<RestDoc | null> {
  try {
    const doc = await call<{ name: string; fields?: Record<string, Value> }>(`${base()}/posts/${encodeURIComponent(id)}${key()}`);
    return { id, data: decodeFields(doc.fields) };
  } catch (e) {
    if (e instanceof RestError && (e.status === 403 || e.status === 404)) return null;
    throw e;
  }
}
