import type { ChatProviderValue } from '../../domain/value-object/chat-provider.vo';

/** One Linked Account as a screen shows it: which tool, which account there, and since when. */
export interface LinkedAccountView {
  readonly provider: ChatProviderValue;
  readonly externalUsername: string;
  readonly linkedAt: Date;
}
