/**
 * The photo link stored with an Account, as it may be shown: an `https` address, or `null`.
 * The link came from the sign-in provider, outside Thrive, and ends up in an `<img src>`, so
 * anything that is not a well-formed `https` URL reads as no photo.
 */
export function toPhotoUrl(stored: string | null | undefined): string | null {
  if (!stored || !URL.canParse(stored)) {
    return null;
  }
  return new URL(stored).protocol === 'https:' ? stored : null;
}
