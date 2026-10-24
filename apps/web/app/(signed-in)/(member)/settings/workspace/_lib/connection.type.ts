import type { ChatProvider } from '@/lib/chat/chat-providers.constant';

/** One chat tool this Workspace is connected to, as Settings → Workspace lists it. */
export type WorkspaceConnection = {
  readonly provider: ChatProvider;
  /** The tool's own name for the space — a Discord server, a Slack team. */
  readonly spaceName: string;
  /** The one channel this Workspace's public Feedback is posted in. */
  readonly channelName: string;
  /** Who connected it: their Display name, or their address until they have introduced themselves. */
  readonly connectedBy: string;
  /** When it was connected, as an ISO date-time. */
  readonly connectedAt: string;
};

/** One channel the tool offered, for an Admin to choose between. */
export type OfferedChannel = {
  readonly id: string;
  readonly name: string;
};

/**
 * What the tool said was authorised, once the Admin comes back from it: the space by name, the
 * channels Thrive may post in, and Thrive's own signed statement of which space it was, which
 * the next request carries back. Nothing is connected until one of those channels is chosen.
 */
export type AuthorizedInstall = {
  readonly spaceName: string;
  readonly channels: readonly OfferedChannel[];
  readonly installation: string;
};
