// POST /api/cloudinary-sign — returns a signed upload signature for folder portfolio/feed (admin only).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, requireAdmin } from './_lib/auth.js';
import { cloudinaryEnv, FEED_FOLDER, signParams } from './_lib/cloudinary.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!(await requireAdmin(req, res))) return;
  const env = cloudinaryEnv();
  if (!env) return res.status(500).json({ error: 'Cloudinary environment variables are missing' });

  // Exactly these params must be sent with the upload, otherwise Cloudinary reports "Invalid signature".
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: FEED_FOLDER, timestamp };
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    cloudName: env.cloudName,
    apiKey: env.apiKey,
    folder: FEED_FOLDER,
    timestamp,
    signature: signParams(params, env.apiSecret),
  });
}
