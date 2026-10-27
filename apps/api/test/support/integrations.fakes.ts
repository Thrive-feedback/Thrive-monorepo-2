import {
  ChannelAnnouncerPort,
  type FeedbackPublished,
  type KudosGiven,
} from '@app/modules/integrations';
import {
  type AuthorizedSpace,
  ChatInstaller,
} from '@app/modules/integrations/application/port/chat-installer.port';
import {
  type AuthorizedInstall,
  InstallHandoff,
  type InstallStart,
} from '@app/modules/integrations/application/port/install-handoff.port';
import { ConnectionQuery } from '@app/modules/integrations/application/query-port/connection.query-port';
import type {
  ConnectedSpace,
  OfferedChannel,
  PostableChannel,
} from '@app/modules/integrations/application/types/connection.types';
import {
  ConnectionRepository,
  type ConnectionToStore,
} from '@app/modules/integrations/domain/repository/connection-repository.port';
import {
  type ChatChannelPost,
  ChatPoster,
} from '@app/shared/application/chat-poster.port';

/**
 * One chat tool, as the test sets it up. It records what it was asked, because several of the
 * rules here are about a provider *not* being called — a non-Admin, or a refused `state`.
 */
export class FakeChatInstaller extends ChatInstaller {
  readonly exchangedCodes: string[] = [];
  readonly listedSpaces: string[] = [];
  private space: AuthorizedSpace = {
    externalWorkspaceId: 'guild-acme',
    externalWorkspaceName: 'Acme HQ',
  };
  private channels: readonly OfferedChannel[] = [
    { id: 'channel-general', name: 'general' },
  ];
  private refusal: 'exchange' | 'channels' | 'leave' | null = null;
  /** Every space this tool was asked to leave, so a test can see that it was — or was not. */
  readonly left: string[] = [];

  constructor(private readonly name = 'DISCORD') {
    super();
  }

  withSpace(space: AuthorizedSpace): this {
    this.space = space;
    return this;
  }

  withChannels(...channels: OfferedChannel[]): this {
    this.channels = channels;
    return this;
  }

  /** What this tool offers, so a scenario can look up the channel it named by its name. */
  get channelsOffered(): readonly OfferedChannel[] {
    return this.channels;
  }

  /** Scenarios share one booted application, so each starts from the same tool. */
  reset(): this {
    this.exchangedCodes.length = 0;
    this.listedSpaces.length = 0;
    this.left.length = 0;
    this.refusal = null;
    return this;
  }

  refusing(call: 'exchange' | 'channels' | 'leave'): this {
    this.refusal = call;
    return this;
  }

  authorizeUrl(state: string): string {
    return `https://${this.name.toLowerCase()}.example/authorize?state=${state}`;
  }

  async exchangeCode(code: string): Promise<AuthorizedSpace> {
    this.exchangedCodes.push(code);
    if (this.refusal === 'exchange') {
      throw new Error('the tool refused the exchange');
    }
    return this.space;
  }

  async leave(externalWorkspaceId: string): Promise<void> {
    this.left.push(externalWorkspaceId);
    if (this.refusal === 'leave') {
      throw new Error('the tool would not let go');
    }
  }

  async listChannels(
    externalWorkspaceId: string,
  ): Promise<readonly OfferedChannel[]> {
    this.listedSpaces.push(externalWorkspaceId);
    if (this.refusal === 'channels') {
      throw new Error('the tool refused to list channels');
    }
    return this.channels;
  }
}

/**
 * Signs by writing the claims down rather than with a key, and can be told to treat a token as
 * stale — so a test can state "this install did not start here" without reaching for crypto.
 */
export class FakeInstallHandoff extends InstallHandoff {
  private stale = false;

  treatingEverythingAsStale(): this {
    this.stale = true;
    return this;
  }

  signInstallStart(start: InstallStart): string {
    return `start:${JSON.stringify(start)}`;
  }

  readInstallStart(token: string): InstallStart | null {
    return this.read<InstallStart>('start', token);
  }

  signAuthorizedInstall(install: AuthorizedInstall): string {
    return `install:${JSON.stringify(install)}`;
  }

  readAuthorizedInstall(token: string): AuthorizedInstall | null {
    return this.read<AuthorizedInstall>('install', token);
  }

  private read<T>(kind: string, token: string): T | null {
    if (this.stale || !token.startsWith(`${kind}:`)) {
      return null;
    }
    return JSON.parse(token.slice(kind.length + 1)) as T;
  }
}

/** Every post, in order, so a test can assert what a channel was told — or that it was not. */
export class FakeChatPoster extends ChatPoster {
  /** Every post attempted, whether or not the channel took it. */
  readonly posts: ChatChannelPost[] = [];
  /** Only the posts that actually arrived, for proving one failure did not stop another. */
  readonly delivered: ChatChannelPost[] = [];
  private unreachable: readonly string[] | 'all' | null = null;

  /** Every channel refuses. */
  unreachableChannel(): this {
    this.unreachable = 'all';
    return this;
  }

  /** Only the channels named refuse, so a test can prove the others still got the post. */
  unreachableChannels(...channelIds: readonly string[]): this {
    this.unreachable = channelIds;
    return this;
  }

  /** Scenarios share one booted application, so each starts from a channel that works. */
  reset(): this {
    this.posts.length = 0;
    this.delivered.length = 0;
    this.unreachable = null;
    return this;
  }

  async postToChannel(post: ChatChannelPost): Promise<void> {
    this.posts.push(post);
    if (
      this.unreachable === 'all' ||
      this.unreachable?.includes(post.channelId)
    ) {
      throw new Error('the bot cannot post there');
    }
    this.delivered.push(post);
  }
}

/** What was stored, so a test can assert that nothing was when a step failed. */
export class FakeConnectionRepository extends ConnectionRepository {
  saved: ConnectionToStore[] = [];

  async save(connection: ConnectionToStore): Promise<void> {
    this.saved.push(connection);
  }

  async remove(connection: {
    readonly workspaceId: string;
    readonly provider: string;
  }): Promise<boolean> {
    const held = this.saved.length;
    this.saved = this.saved.filter(
      (stored) =>
        stored.workspaceId !== connection.workspaceId ||
        stored.provider !== connection.provider,
    );
    return this.saved.length < held;
  }
}

/** What a Workspace is connected to, as the test sets it up. */
export class FakeConnectionQuery extends ConnectionQuery {
  private space: ConnectedSpace | null = null;

  connectedTo(externalWorkspaceId: string): this {
    this.space = { externalWorkspaceId };
    return this;
  }

  async connectedSpace(): Promise<ConnectedSpace | null> {
    return this.space;
  }

  async connectionsOfWorkspace(): Promise<never> {
    throw new Error('Not the read under test.');
  }

  private channels: readonly PostableChannel[] = [];

  /** A Workspace that has connected a channel. With none, announcing is silent. */
  postingTo(...channels: readonly PostableChannel[]): this {
    this.channels = channels;
    return this;
  }

  async postableChannelsOf(): Promise<readonly PostableChannel[]> {
    return this.channels;
  }
}

/**
 * What Feedback calls when something happens in the open. It records what it was told, and can be
 * made to reject — the promise that matters is that nothing a person does fails when it does.
 */
export class FakeChannelAnnouncer extends ChannelAnnouncerPort {
  readonly feedbackPublished_: FeedbackPublished[] = [];
  readonly kudosGiven_: KudosGiven[] = [];
  private rejecting = false;

  /** The port promises never to reject. This is for proving the caller survives it anyway. */
  rejectingEverything(): this {
    this.rejecting = true;
    return this;
  }

  async feedbackPublished(event: FeedbackPublished): Promise<void> {
    this.feedbackPublished_.push(event);
    this.refuseIfAsked();
  }

  async kudosGiven(event: KudosGiven): Promise<void> {
    this.kudosGiven_.push(event);
    this.refuseIfAsked();
  }

  private refuseIfAsked(): void {
    if (this.rejecting) {
      throw new Error('No channel could be told.');
    }
  }
}
