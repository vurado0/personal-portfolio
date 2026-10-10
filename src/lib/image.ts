// Client-side photo preparation: resize to max 2500 px and re-encode through a canvas,
// which drops all EXIF metadata (including GPS location from phone photos).

export type PreparedImage = { blob: Blob; width: number; height: number; previewUrl: string };

export async function prepareImage(file: File, maxSide = 2500): Promise<PreparedImage> {
  // `imageOrientation: 'from-image'` applies the EXIF rotation before we throw EXIF away.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image.'))), 'image/jpeg', 0.88),
  );
  return { blob, width, height, previewUrl: URL.createObjectURL(blob) };
}
