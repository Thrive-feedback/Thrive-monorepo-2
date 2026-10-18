import { Injectable } from '@nestjs/common';
import type { IntegrationProviderValue } from '../../domain/value-object/integration-provider.vo';
import type { ChatInstaller } from '../port/chat-installer.port';

/**
 * The installer of one chat tool, by provider (design 0020 D12). One entry today, so a second
 * provider is one new adapter and one more entry rather than a change in any use case.
 */
@Injectable()
export class ChatInstallerRegistry {
  constructor(
    private readonly installers: Readonly<
      Record<IntegrationProviderValue, ChatInstaller>
    >,
  ) {}

  /**
   * Every provider value has passed `IntegrationProvider.of` before reaching here, so a missing
   * entry is a provider added to the value object and not to this registry — a programming
   * error, not a refusal a caller can act on.
   */
  for(provider: IntegrationProviderValue): ChatInstaller {
    const installer = this.installers[provider];
    if (!installer) {
      throw new Error(`No chat installer is registered for ${provider}`);
    }
    return installer;
  }
}
