/** Menghapus semua bentuk tag <br> dari output AI dan menggantinya dengan line break normal. */
const BR_RE = /<\s*br\s*\/?\s*>/gi;
const OTHER_TAGS = /<\s*\/?\s*(p|div|span|strong|em|b|i|u|ul|ol|li|h[1-6])\b[^>]*>/gi;

export function sanitizeAiOutput(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(BR_RE, "\n")
    .replace(OTHER_TAGS, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}
