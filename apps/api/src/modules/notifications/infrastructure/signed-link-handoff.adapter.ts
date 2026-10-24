import type { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import {
  LinkHandoff,
  type LinkStart,
} from '../application/port/link-handoff.port';
import { ChatProvider } from '../domain/value-object/chat-provider.vo';

/** Long enough to authorise in another tab, short enough to be worth little if stolen. */
const STATE_LIFETIME_MS = 5 * 60 * 1000;

/**
 * What this token is. Integrations signs its own tokens with the same secret, so without a kind
 * its install `state` — which carries an Account and a provider too — would read as a valid
 * account-link `state`, and a round trip started for one purpose could be finished as the other.
 */
const START_KIND = 'account-link';

const START_FIELDS = ['kind', 'accountId', 'provider'] as const;

/**
 * Signs and reads back the `state` the link round trip carries, over the application's HMAC
 * helper. The provider is parsed on the way back, so a token naming a tool Thrive no longer
 * links reads as invalid rather than as that tool.
 */
export class SignedLinkHandoff extends LinkHandoff {
  constructor(private readonly signedHandoff: SignedHandoff) {
    super();
  }

  signLinkStart(start: LinkStart): string {
    return this.signedHandoff.sign(
      {
        kind: START_KIND,
        accountId: start.accountId,
        provider: start.provider,
      },
      STATE_LIFETIME_MS,
    );
  }

  readLinkStart(token: string): LinkStart | null {
    const claims = this.signedHandoff.verify(token, START_FIELDS);
    if (!claims || claims.kind !== START_KIND) {
      return null;
    }
    const provider = providerOf(claims.provider);
    return provider ? { accountId: claims.accountId, provider } : null;
  }
}

function providerOf(raw: string) {
  try {
    return ChatProvider.of(raw).toString();
  } catch {
    // A token naming a tool this release does not link is one to refuse, not to report.
    return null;
  }
}
