import type { ChatProvider } from '@/lib/chat/chat-providers.constant';

/** One chat account this person has linked, as Settings → Account lists it. */
export type LinkedAccount = {
  readonly provider: ChatProvider;
  /** The name they go by in that chat tool, so they can see which account Thrive has. */
  readonly externalUsername: string;
  /** When they linked it, as an ISO date-time. */
  readonly linkedAt: string;
};
