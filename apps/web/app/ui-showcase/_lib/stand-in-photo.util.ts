/**
 * A drawn stand-in for a Google photo: a soft two-tone disc, so the showcase shows a photo
 * without showing anybody's face.
 */
export function standInPhoto(from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="48" cy="38" r="16" fill="#fff" fill-opacity=".85"/><ellipse cx="48" cy="86" rx="30" ry="22" fill="#fff" fill-opacity=".85"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
