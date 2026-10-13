/**
 * Up to two letters for an avatar: the first letter of the first and the last word, so
 * "Ann Lee" is "AL" and "Ann" is "A". An empty name gives an empty string, and the avatar
 * is left blank rather than showing a made-up letter.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) {
    return '';
  }
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return `${first[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}
