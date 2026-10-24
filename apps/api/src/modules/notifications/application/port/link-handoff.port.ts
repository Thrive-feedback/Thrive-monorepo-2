import type { ChatProviderValue } from '../../domain/value-object/chat-provider.vo';

/** Who started a link, and into which tool. There is no Workspace: a link is an Account's. */
export interface LinkStart {
  readonly accountId: string;
  readonly provider: ChatProviderValue;
}

/**
 * Signs the `state` a link carries through somebody's browser and back.
 *
 * Signed rather than stored, for the reason design 0020 D5 gives and this one inherits: there
 * is no Redis, and a table for a value that lives minutes is a migration plus something to
 * sweep it. Being signed, bound to the Account **and the provider** that started it, and
 * short-lived is what such a value needs.
 */
export abstract class LinkHandoff {
  abstract signLinkStart(start: LinkStart): string;

  /** `null` when the token was not signed here, was tampered with, or has expired. */
  abstract readLinkStart(token: string): LinkStart | null;
}
