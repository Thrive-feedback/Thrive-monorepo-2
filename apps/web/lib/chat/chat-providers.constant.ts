import type { components } from '@repo/api';

type ConnectionResponse =
  components['schemas']['ListConnectionsResponseDto_Output']['items'][number];

/** Which chat tool. Discord today; Slack is next (brain `ADR-0035`). */
export type ChatProvider = ConnectionResponse['provider'];

/**
 * The chat tools Thrive talks to, by the segment that names one in a URL. The segment is
 * lowercase because a person reads it — the API and what it stores use the capitalised value,
 * and this is the one place that knows both.
 *
 * It sits in `lib/` rather than beside one screen because two routes now read it: Settings →
 * Workspace, where an Admin connects a Workspace's channel, and Settings → Account, where a
 * Member links their own chat account (`FE_01` R4).
 *
 * Discord today. Slack is next, and arrives here as a second entry.
 */
export const CHAT_PROVIDERS = {
  discord: { value: 'DISCORD', label: 'Discord' },
} as const satisfies Record<
  string,
  { readonly value: ChatProvider; readonly label: string }
>;

export type ChatProviderSegment = keyof typeof CHAT_PROVIDERS;

/** The segment for a stored provider value, for a link back to the tool's own section. */
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
 * Every tool, for a screen that lists them. A second tool reaches both screens by being one
 * more entry in {@link CHAT_PROVIDERS}, and nothing else changes.
 */
export const CHAT_PROVIDER_LIST = Object.entries(CHAT_PROVIDERS).map(
  ([segment, provider]) => ({
    segment: segment as ChatProviderSegment,
    value: provider.value,
    label: provider.label,
  }),
);
