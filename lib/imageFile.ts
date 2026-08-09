import { readFile } from "fs/promises";
import path from "path";

const MEDIA_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function readUploadedImageAsBase64(url: string) {
  if (!url.startsWith("/uploads/")) return null;
  const ext = path.extname(url).toLowerCase();
  const mediaType = MEDIA_TYPES[ext];
  if (!mediaType) return null;

  const filePath = path.join(process.cwd(), "public", url);
  try {
    const bytes = await readFile(filePath);
    return { mediaType, base64: bytes.toString("base64") };
  } catch {
    return null;
  }
}
