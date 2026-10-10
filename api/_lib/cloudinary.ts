import { createHash } from 'node:crypto';

export const FEED_FOLDER = 'portfolio/feed';

export type CloudinaryEnv = { cloudName: string; apiKey: string; apiSecret: string };

export function cloudinaryEnv(): CloudinaryEnv | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

/** Cloudinary signature: sha1 of the alphabetically sorted "key=value&..." params + API secret. */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}
