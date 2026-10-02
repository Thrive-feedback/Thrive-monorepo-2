export type ForwardedCookie = {
  readonly name: string;
  readonly value: string;
  readonly options: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  };
};

const SAME_SITE: Record<string, ForwardedCookie['options']['sameSite']> = {
  lax: 'lax',
  strict: 'strict',
  none: 'none',
};

/**
 * Reads one `Set-Cookie` value the API sent, so the server can hand the same cookie to the
 * browser. The value comes back decoded: Next encodes it again when it writes the cookie, and
 * a signed value encoded twice no longer matches its signature.
 */
export function parseSetCookie(header: string): ForwardedCookie | null {
  const [pair = '', ...attributes] = header.split(';');
  const separator = pair.indexOf('=');
  if (separator <= 0) return null;

  const options: ForwardedCookie['options'] = {};
  for (const attribute of attributes) {
    const [rawKey = '', ...rest] = attribute.split('=');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join('=').trim();
    if (key === 'path') options.path = value;
    else if (key === 'domain') options.domain = value;
    else if (key === 'max-age') options.maxAge = Number(value);
    else if (key === 'expires') options.expires = new Date(value);
    else if (key === 'httponly') options.httpOnly = true;
    else if (key === 'secure') options.secure = true;
    else if (key === 'samesite')
      options.sameSite = SAME_SITE[value.toLowerCase()];
  }

  return {
    name: pair.slice(0, separator).trim(),
    value: decodeURIComponent(pair.slice(separator + 1).trim()),
    options,
  };
}
