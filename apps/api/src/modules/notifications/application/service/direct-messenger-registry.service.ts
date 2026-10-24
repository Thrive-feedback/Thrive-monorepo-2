import { Injectable } from '@nestjs/common';
import type { ChatProviderValue } from '../../domain/value-object/chat-provider.vo';
import type { DirectMessenger } from '../port/direct-messenger.port';

/**
 * The messenger of one chat tool, by provider (design 0021 D3). One entry today, so a second
 * provider is one more adapter and one more entry rather than a change in the notifier.
 */
@Injectable()
export class DirectMessengerRegistry {
  constructor(
    private readonly messengers: Readonly<
      Record<ChatProviderValue, DirectMessenger>
    >,
  ) {}

  /**
   * Every provider value here was stored by the link flow, which parsed it, so a missing entry
   * is a provider added to the value object and not to this registry — a programming error,
   * not a refusal a caller can act on.
   */
  for(provider: ChatProviderValue): DirectMessenger {
    const messenger = this.messengers[provider];
    if (!messenger) {
      throw new Error(`No direct messenger is registered for ${provider}`);
    }
    return messenger;
  }
}
