import type { ChatProvider } from './connection.type';

/**
 * The chat tools a Workspace can connect, by the segment that names one in a URL. The segment
 * is lowercase because a person reads it — the API and the Connection it stores use the
 * capitalised value, and this is the one place that knows both.
 *
 * Discord today. Slack is next (brain `ADR-0035`), and arrives here as a second entry.
 */
export const CHAT_PROVIDERS = {
  discord: { value: 'DISCORD', label: 'Discord' },
} as const satisfies Record<
  string,
  { readonly value: ChatProvider; readonly label: string }
>;

export type ChatProviderSegment = keyof typeof CHAT_PROVIDERS;

/** The segment for a stored Connection's provider, for a link back to the tool's own section. */
export function segmentOf(provider: ChatProvider): ChatProviderSegment {
  return provider.toLowerCase() as ChatProviderSegment;
}

/** What to call the tool on screen. */
export function labelOf(provider: ChatProvider): string {
  return CHAT_PROVIDERS[segmentOf(provider)].label;
}

/**
 * The tool a URL segment names, or `undefined` when it names none — a dynamic segment is
 * validated before it is used (`FE_11` R4).
 */
export function providerForSegment(
  segment: string,
): (typeof CHAT_PROVIDERS)[ChatProviderSegment] | undefined {
  return CHAT_PROVIDERS[segment as ChatProviderSegment];
}

/**
 * Every tool a Workspace can connect, for the screen that lists them. A second tool reaches the
 * screens by being one more entry in {@link CHAT_PROVIDERS}, and nothing else changes.
 */
export const CONNECTABLE_PROVIDERS = Object.entries(CHAT_PROVIDERS).map(
  ([segment, provider]) => ({
    segment: segment as ChatProviderSegment,
    value: provider.value,
    label: provider.label,
  }),
);
