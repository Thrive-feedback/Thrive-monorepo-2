import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Clock } from '@app/shared/application/clock.port';

const NONCE_BYTES = 16;

/** Claims are strings, so a token carries identifiers and nothing a type could disagree about. */
export type HandoffClaims = Readonly<Record<string, string>>;

/**
 * Signs a short-lived value that travels through somebody's browser and comes back.
 *
 * Stateless on purpose (design 0020 D5): there is no Redis, and a table for a value that lives
 * minutes is a migration plus something to sweep it. Being signed, bound to the request that
 * started it and short-lived is what such a value needs.
 *
 * It is replayable inside its own window, which is accepted: connecting twice replaces the
 * Connection rather than accumulating one.
 */
export class SignedHandoff {
  constructor(
    private readonly secret: string,
    private readonly clock: Clock,
  ) {}

  sign(claims: HandoffClaims, lifetimeMs: number): string {
    const payload = Buffer.from(
      JSON.stringify({
        ...claims,
        // A fresh value per token, so two signed in the same millisecond differ.
        nonce: randomBytes(NONCE_BYTES).toString('base64url'),
        exp: this.clock.now().getTime() + lifetimeMs,
      }),
    ).toString('base64url');
    return `${payload}.${this.signatureOf(payload)}`;
  }

  /**
   * The claims the token carries, or `null` when it was not signed here, was tampered with, has
   * expired, or is missing one of `fields`. It says the token is genuine — whether it is the
   * right one for this request is the caller's to decide, by comparing what it carries.
   */
  verify<Field extends string>(
    token: string,
    fields: readonly Field[],
  ): Readonly<Record<Field, string>> | null {
    const [payload, signature, ...rest] = token.split('.');
    if (!payload || !signature || rest.length > 0) {
      return null;
    }
    if (!this.hasValidSignature(payload, signature)) {
      return null;
    }
    const body = parseBody(payload);
    if (!body || body.exp <= this.clock.now().getTime()) {
      return null;
    }
    const claims: Partial<Record<Field, string>> = {};
    for (const field of fields) {
      const value = body.claims[field];
      if (typeof value !== 'string') {
        return null;
      }
      claims[field] = value;
    }
    return claims as Readonly<Record<Field, string>>;
  }

  private signatureOf(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64url');
  }

  private hasValidSignature(payload: string, signature: string): boolean {
    const expected = Buffer.from(this.signatureOf(payload));
    const actual = Buffer.from(signature);
    // Compared in constant time, so the comparison itself tells an attacker nothing.
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}

interface HandoffBody {
  readonly claims: Record<string, unknown>;
  /** Milliseconds since the epoch. */
  readonly exp: number;
}

function parseBody(payload: string): HandoffBody | null {
  try {
    const raw: unknown = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    );
    if (typeof raw !== 'object' || raw === null) {
      return null;
    }
    const claims = raw as Record<string, unknown>;
    return typeof claims.exp === 'number' ? { claims, exp: claims.exp } : null;
  } catch {
    // A payload that is not the JSON this signed is a token this did not issue.
    return null;
  }
}
