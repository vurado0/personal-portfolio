// POST /api/cloudinary-delete { publicIds: string[] } — deletes feed images (admin only).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, requireAdmin } from './_lib/auth.js';
import { cloudinaryEnv, FEED_FOLDER, signParams } from './_lib/cloudinary.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!(await requireAdmin(req, res))) return;
  const env = cloudinaryEnv();
  if (!env) return res.status(500).json({ error: 'Cloudinary environment variables are missing' });

  const ids: unknown = req.body?.publicIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20 || ids.some((id) => typeof id !== 'string')) {
    return res.status(400).json({ error: 'publicIds must be a list of 1–20 strings' });
  }
  // Never allow deleting anything outside the feed folder.
  if (ids.some((id: string) => !id.startsWith(FEED_FOLDER + '/') || id.includes('..'))) {
    return res.status(400).json({ error: `Only images in ${FEED_FOLDER}/ can be deleted` });
  }

  const results: Record<string, string> = {};
  for (const publicId of ids as string[]) {
    const timestamp = Math.round(Date.now() / 1000);
    const params = { invalidate: 'true', public_id: publicId, timestamp };
    const body = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      api_key: env.apiKey,
      signature: signParams(params, env.apiSecret),
    });
    try {
      const r = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/image/destroy`, { method: 'POST', body });
      const json = (await r.json()) as { result?: string; error?: { message: string } };
      results[publicId] = json.result ?? json.error?.message ?? `HTTP ${r.status}`;
    } catch (e) {
      results[publicId] = (e as Error).message;
    }
  }
  return res.status(200).json({ results });
}
