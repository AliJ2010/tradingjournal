export function parseDataUrl(url: string): { mediaType: string; base64: string } | null {
  const match = url.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}
