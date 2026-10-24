import { Injectable } from '@nestjs/common';
import type { ChatProviderValue } from '../../domain/value-object/chat-provider.vo';
import type { AccountLinker } from '../port/account-linker.port';

/**
 * The linker of one chat tool, by provider (design 0021 D3). One entry today, so a second
 * provider is one new adapter and one more entry rather than a change in any use case.
 */
@Injectable()
export class AccountLinkerRegistry {
  constructor(
    private readonly linkers: Readonly<
      Record<ChatProviderValue, AccountLinker>
    >,
  ) {}

  /**
   * Every provider value has passed `ChatProvider.of` before reaching here, so a missing entry
   * is a provider added to the value object and not to this registry — a programming error, not
   * a refusal a caller can act on.
   */
  for(provider: ChatProviderValue): AccountLinker {
    const linker = this.linkers[provider];
    if (!linker) {
      throw new Error(`No account linker is registered for ${provider}`);
    }
    return linker;
  }
}
