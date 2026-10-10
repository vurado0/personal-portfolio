// Feed post editor (photo / text / achievement / music) — used in /admin and in edit mode on the site.
import { useState, type FormEvent } from 'react';
import { typeLabel } from '../../components/feed/PostCard';
import { apiFetch, cldUrl, deleteFromCloudinary, uploadToCloudinary } from '../../lib/cloudinary';
import { parseMusicUrl, providerLabel } from '../../lib/embeds';
import { createPost, POST_TYPES, updatePost, type MusicInfo, type Post, type PostImage, type PostInput, type PostType } from '../../lib/feed';
import { prepareImage } from '../../lib/image';
import { SkillPicker } from './SkillPicker';

type DraftImage =
  | { kind: 'existing'; image: PostImage }
  | { kind: 'new'; id: string; blob: Blob; previewUrl: string; width: number; height: number; alt: string; progress: number };

type Draft = {
  type: PostType;
  text: string;
  images: DraftImage[];
  musicUrl: string;
  music: MusicInfo | null;
  tags: string;
  skills: string[];
  mood: string;
  badge: string;
};

const emptyDraft = (type: PostType = 'photo'): Draft => ({ type, text: '', images: [], musicUrl: '', music: null, tags: '', skills: [], mood: '', badge: '' });

function draftFromPost(p: Post): Draft {
  return {
    type: p.type,
    text: p.text,
    images: p.images.map((image) => ({ kind: 'existing', image })),
    musicUrl: p.music?.url ?? '',
    music: p.music ?? null,
    tags: p.tags.join(', '),
    skills: p.skills,
    mood: p.mood ?? '',
    badge: p.badge ?? '',
  };
}

const altOf = (img: DraftImage) => (img.kind === 'existing' ? img.image.alt : img.alt);

export function PostEditor({ editing, onDone }: { editing: Post | null; onDone: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => (editing ? draftFromPost(editing) : emptyDraft()));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const allowsImages = draft.type === 'photo' || draft.type === 'achievement';
  const maxImages = draft.type === 'photo' ? 10 : 1;
  const parsedMusic = parseMusicUrl(draft.musicUrl);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const room = maxImages - draft.images.length;
    const picked = [...files].slice(0, Math.max(0, room));
    if (files.length > room) setError(`Max ${maxImages} image${maxImages > 1 ? 's' : ''} for this post type.`);
    setBusy('Preparing photos (resizing, removing location data)…');
    try {
      const prepared = await Promise.all(picked.map((f) => prepareImage(f)));
      setDraft((d) => ({
        ...d,
        images: [
          ...d.images,
          ...prepared.map((p) => ({ kind: 'new' as const, id: crypto.randomUUID(), blob: p.blob, previewUrl: p.previewUrl, width: p.width, height: p.height, alt: '', progress: 0 })),
        ],
      }));
    } catch (e) {
      setError(`Could not read a photo: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const updateImage = (index: number, patch: Partial<{ alt: string; progress: number }>) =>
    setDraft((d) => ({
      ...d,
      images: d.images.map((img, i) =>
        i !== index ? img : img.kind === 'existing' ? { ...img, image: { ...img.image, alt: patch.alt ?? img.image.alt } } : { ...img, ...patch },
      ),
    }));
  const moveImage = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const images = [...d.images];
      const j = index + dir;
      if (j < 0 || j >= images.length) return d;
      [images[index], images[j]] = [images[j], images[index]];
      return { ...d, images };
    });
  const removeImage = (index: number) => setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== index) }));

  const fetchMusic = async () => {
    if (!parsedMusic) return setError('Paste a Spotify or SoundCloud link.');
    setError(null);
    setBusy('Fetching track info…');
    try {
      const info = await apiFetch<{ title: string; artist: string; thumbnailUrl: string }>(`/api/oembed?url=${encodeURIComponent(parsedMusic.url)}`);
      set('music', { ...parsedMusic, title: info.title, artist: info.artist, coverUrl: info.thumbnailUrl });
    } catch (e) {
      // Still allow posting: title/artist can be typed in manually.
      set('music', { ...parsedMusic, title: draft.music?.title ?? '', artist: draft.music?.artist ?? '', coverUrl: '' });
      setError(`Could not fetch info (${(e as Error).message}). Fill in title/artist manually.`);
    } finally {
      setBusy(null);
    }
  };

  const validate = (): string | null => {
    if (draft.type === 'photo' && draft.images.length === 0) return 'Add at least one photo.';
    if ((draft.type === 'text' || draft.type === 'achievement') && !draft.text.trim()) return 'Write some text.';
    if (draft.type === 'music' && (!parsedMusic || !draft.music)) return 'Paste a music link and press "Fetch info".';
    if (allowsImages && draft.images.some((img) => !altOf(img).trim())) return 'Every photo needs alt text (describe it for screen readers).';
    return null;
  };

  const save = async (published: boolean) => {
    const problem = validate();
    if (problem) return setError(problem);
    setError(null);
    try {
      // 1. Upload new photos
      const images: PostImage[] = [];
      if (allowsImages) {
        for (let i = 0; i < draft.images.length; i++) {
          const img = draft.images[i];
          if (img.kind === 'existing') {
            images.push(img.image);
            continue;
          }
          setBusy(`Uploading photo ${i + 1} of ${draft.images.length}…`);
          const r = await uploadToCloudinary(img.blob, (p) => updateImage(i, { progress: p }));
          images.push({ url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height, alt: img.alt.trim() });
        }
      }
      // 2. Copy the music cover to Cloudinary so visitors never contact Spotify/SoundCloud before clicking play
      let music: MusicInfo | null = null;
      if (draft.type === 'music' && draft.music && parsedMusic) {
        music = { ...draft.music, ...parsedMusic };
        if (music.coverUrl && !music.coverUrl.includes('res.cloudinary.com')) {
          setBusy('Saving cover image…');
          try {
            const r = await uploadToCloudinary(music.coverUrl);
            music = { ...music, coverUrl: r.secure_url, coverPublicId: r.public_id };
          } catch {
            music = { ...music, coverUrl: '' };
          }
        }
      }
      // 3. Save to Firestore
      setBusy(published ? 'Publishing…' : 'Saving draft…');
      const input: PostInput = {
        type: draft.type,
        text: draft.text.trim(),
        images,
        music,
        tags: draft.tags
          .split(',')
          .map((t) => t.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-'))
          .filter(Boolean),
        skills: draft.skills,
        mood: draft.mood.trim() || undefined,
        badge: draft.type === 'achievement' ? draft.badge.trim() || undefined : undefined,
        published,
      };
      if (editing) await updatePost(editing.id, input);
      else await createPost(input);

      // 4. Remove images that were dropped while editing
      if (editing) {
        const kept = new Set([...images.map((i) => i.publicId), music?.coverPublicId]);
        const dropped = [...editing.images.map((i) => i.publicId), editing.music?.coverPublicId].filter((id): id is string => Boolean(id) && !kept.has(id));
        await deleteFromCloudinary(dropped).catch(() => undefined);
      }
      draft.images.forEach((img) => img.kind === 'new' && URL.revokeObjectURL(img.previewUrl));
      // Feed lists (blog, home, skills) refresh themselves.
      window.dispatchEvent(new Event('feed-changed'));
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <form onSubmit={(e: FormEvent) => e.preventDefault()} className="max-w-2xl space-y-6">
      <fieldset>
        <legend className="label mb-2">post type</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {POST_TYPES.map((pt) => (
            <button
              key={pt}
              type="button"
              onClick={() => set('type', pt)}
              aria-pressed={draft.type === pt}
              className={`btn min-h-14 border ${draft.type === pt ? 'border-accent bg-accent text-on-accent' : 'border-line text-fg'}`}
            >
              {typeLabel[pt]}
            </button>
          ))}
        </div>
      </fieldset>

      {allowsImages && (
        <div>
          <p className="label mb-2">
            photos ({draft.images.length}/{maxImages}){draft.type === 'achievement' ? ' — optional' : ''}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {draft.images.map((img, i) => (
              <div key={img.kind === 'existing' ? img.image.publicId : img.id} className="card space-y-2 p-2">
                <div className="relative">
                  <img src={img.kind === 'existing' ? cldUrl(img.image.url, 320) : img.previewUrl} alt="" className="aspect-square w-full rounded object-cover" />
                  {img.kind === 'new' && img.progress > 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-espresso/50">
                      <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(img.progress * 100)}%` }} />
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Alt text for photo {i + 1}</span>
                  <input value={altOf(img)} onChange={(e) => updateImage(i, { alt: e.target.value })} placeholder="Alt text (required)" required className="input py-1.5 text-sm" />
                </label>
                <div className="flex justify-between gap-1 text-xs">
                  <button type="button" className="chip" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move left">
                    ←
                  </button>
                  <button type="button" className="chip" onClick={() => removeImage(i)}>
                    remove
                  </button>
                  <button type="button" className="chip" onClick={() => moveImage(i, 1)} disabled={i === draft.images.length - 1} aria-label="Move right">
                    →
                  </button>
                </div>
              </div>
            ))}
            {draft.images.length < maxImages && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-center text-sm text-muted hover:border-accent">
                <span className="text-3xl" aria-hidden="true">
                  +
                </span>
                Camera / gallery
                <input type="file" accept="image/*" multiple={maxImages > 1} className="sr-only" onChange={(e) => addFiles(e.target.files).then(() => (e.target.value = ''))} />
              </label>
            )}
          </div>
        </div>
      )}

      {draft.type === 'music' && (
        <div className="space-y-3">
          <label className="block">
            <span className="label mb-1.5 block">spotify / soundcloud link</span>
            <input
              value={draft.musicUrl}
              onChange={(e) => set('musicUrl', e.target.value)}
              inputMode="url"
              placeholder="https://open.spotify.com/track/…"
              className="input"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost" onClick={fetchMusic} disabled={!parsedMusic || Boolean(busy)}>
              Fetch info
            </button>
            <span className="font-mono text-xs text-muted">{parsedMusic ? `${providerLabel[parsedMusic.provider]} detected` : draft.musicUrl ? 'unsupported link' : ''}</span>
          </div>
          {draft.music && (
            <div className="card flex gap-3 p-3">
              {draft.music.coverUrl ? <img src={cldUrl(draft.music.coverUrl, 160)} alt="" className="h-16 w-16 rounded object-cover" /> : null}
              <div className="grid flex-1 gap-2">
                <input value={draft.music.title} onChange={(e) => set('music', { ...draft.music!, title: e.target.value })} placeholder="Title" className="input py-1.5" aria-label="Title" />
                <input value={draft.music.artist} onChange={(e) => set('music', { ...draft.music!, artist: e.target.value })} placeholder="Artist" className="input py-1.5" aria-label="Artist" />
              </div>
            </div>
          )}
        </div>
      )}

      <label className="block">
        <span className="label mb-1.5 block">
          {draft.type === 'music' ? 'comment' : draft.type === 'achievement' ? 'what did you achieve today?' : draft.type === 'photo' ? 'caption' : 'text'}
        </span>
        <textarea value={draft.text} onChange={(e) => set('text', e.target.value)} rows={draft.type === 'text' ? 5 : 3} className="input" maxLength={2000} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label mb-1.5 block">mood (optional)</span>
          <input value={draft.mood} onChange={(e) => set('mood', e.target.value)} placeholder="☕ focused" className="input" maxLength={40} />
        </label>
        {draft.type === 'achievement' ? (
          <label className="block">
            <span className="label mb-1.5 block">badge emoji (optional)</span>
            <input value={draft.badge} onChange={(e) => set('badge', e.target.value)} placeholder="🏆" className="input" maxLength={8} />
          </label>
        ) : null}
        <label className="block sm:col-span-2">
          <span className="label mb-1.5 block">tags (comma separated)</span>
          <input value={draft.tags} onChange={(e) => set('tags', e.target.value)} placeholder="gym, docker, graz" className="input" autoCapitalize="none" />
        </label>
      </div>

      <SkillPicker value={draft.skills} onChange={(v) => set('skills', v)} />

      {error && (
        <p role="alert" className="rounded-md border border-accent px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {busy && (
        <p role="status" className="font-mono text-sm text-muted">
          {busy}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-line/60 bg-bg/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={() => save(true)} disabled={Boolean(busy)}>
          {editing?.published ? 'Save' : 'Publish'}
        </button>
        <button type="button" className="btn-ghost flex-1 sm:flex-none" onClick={() => save(false)} disabled={Boolean(busy)}>
          {editing?.published ? 'Unpublish (draft)' : 'Save draft'}
        </button>
        <button type="button" className="btn-ghost" onClick={onDone} disabled={Boolean(busy)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

