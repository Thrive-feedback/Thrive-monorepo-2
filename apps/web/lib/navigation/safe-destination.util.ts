/**
 * The longest destination worth carrying. It travels in a cookie, which the browser drops
 * silently once the jar for an origin grows past a few kilobytes, and no address Thrive writes
 * comes near this.
 */
const MAX_LENGTH = 512;

/**
 * A path inside Thrive: one leading slash, then printable ASCII with no backslash. The second
 * slash is refused because `//host` and `/\host` are addresses on another site, not paths; a
 * space or a control character is refused because it can hide a scheme from a reader while a
 * browser still follows it.
 */
const INTERNAL_PATH = /^\/(?![/\\])[!-~]*$/;

/** Any absolute URL parses against this, and lands on an origin that is not it. */
const NOWHERE = 'https://destination.invalid';

/**
 * The path to send someone to, or `null` to send them wherever they would have gone anyway.
 *
 * Only a relative path inside Thrive is ever followed. Anything else — an absolute URL, a
 * scheme-relative `//host`, a path carrying a scheme, a backslash, an encoded or padded variant
 * of any of those — is discarded rather than corrected, because following it would make every
 * Thrive sign-in link a way to land somebody on another site that looks like this one.
 *
 * Nothing here asks whether the path leads anywhere, or whether this person may see it. The
 * redirect is blind on purpose: a link to something they may not see has to behave exactly as it
 * does when they were already signed in.
 */
export function toSafeDestination(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length > MAX_LENGTH ||
    !INTERNAL_PATH.test(value)
  ) {
    return null;
  }
  // Parsed as the browser will parse it, because the pattern above reads the text and a browser
  // reads an address. A path that starts with a slash always resolves against a valid base, so
  // this cannot throw.
  const parsed = new URL(value, NOWHERE);
  const path = `${parsed.pathname}${parsed.search}`;
  // What comes out is held to the whole rule again, not only to the pattern: `/..//host` passes
  // as text, keeps this origin while parsing, and still collapses to `//host`, which is another
  // site — and percent-encoding can treble the length that went in.
  if (
    parsed.origin !== NOWHERE ||
    path.length > MAX_LENGTH ||
    !INTERNAL_PATH.test(path)
  ) {
    return null;
  }
  return path;
}
