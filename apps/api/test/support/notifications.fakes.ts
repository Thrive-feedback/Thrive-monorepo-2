import { ProfileNamePort } from '@app/modules/identity';
import {
  type AskAnswered,
  type AskReceived,
  type FeedbackWritten,
  PersonNotifierPort,
} from '@app/modules/notifications';
import {
  AccountLinker,
  type LinkedIdentity,
} from '@app/modules/notifications/application/port/account-linker.port';
import { DirectMessenger } from '@app/modules/notifications/application/port/direct-messenger.port';
import {
  LinkHandoff,
  type LinkStart,
} from '@app/modules/notifications/application/port/link-handoff.port';
import {
  LinkedAccountQuery,
  type ReachableAccount,
} from '@app/modules/notifications/application/query-port/linked-account.query-port';
import { NotificationQuery } from '@app/modules/notifications/application/query-port/notification.query-port';
import type { LinkedAccountView } from '@app/modules/notifications/application/types/linked-account.types';
import type {
  NotificationRow,
  NotificationRowPage,
  PageRequest,
} from '@app/modules/notifications/application/types/notification.types';
import {
  LinkedAccountRepository,
  type LinkedAccountToStore,
} from '@app/modules/notifications/domain/repository/linked-account-repository.port';
import {
  type NotificationOfRecipient,
  NotificationRepository,
  type NotificationToRecord,
} from '@app/modules/notifications/domain/repository/notification-repository.port';
import { WorkspaceNamePort } from '@app/modules/workspace';

/**
 * One chat tool's linking half, as a test sets it up. It records the codes it was given,
 * because several rules here are about the tool *not* being reached — a refused `state` must
 * end the round trip before anything is exchanged.
 */
export class FakeAccountLinker extends AccountLinker {
  readonly exchangedCodes: string[] = [];
  private identity: LinkedIdentity = {
    externalUserId: 'discord-user-ann',
    externalUsername: 'ann',
  };
  private refusing = false;

  constructor(private readonly name = 'DISCORD') {
    super();
  }

  withIdentity(identity: LinkedIdentity): this {
    this.identity = identity;
    return this;
  }

  refusingTheExchange(): this {
    this.refusing = true;
    return this;
  }

  /** The application boots once for the whole run, so each scenario starts from here. */
  reset(): this {
    this.exchangedCodes.length = 0;
    this.identity = {
      externalUserId: 'discord-user-ann',
      externalUsername: 'ann',
    };
    this.refusing = false;
    return this;
  }

  authorizeUrl(state: string): string {
    return `https://${this.name.toLowerCase()}.example/authorize?state=${state}`;
  }

  async exchangeCode(code: string): Promise<LinkedIdentity> {
    this.exchangedCodes.push(code);
    if (this.refusing) {
      throw new Error(`${this.name} refused the exchange`);
    }
    return this.identity;
  }
}

/** Signs by writing the claims down, so a test can forge one and see it refused. */
export class FakeLinkHandoff extends LinkHandoff {
  private stale = false;

  treatingEverythingAsStale(): this {
    this.stale = true;
    return this;
  }

  signLinkStart(start: LinkStart): string {
    return `link:${JSON.stringify(start)}`;
  }

  readLinkStart(token: string): LinkStart | null {
    if (this.stale || !token.startsWith('link:')) {
      return null;
    }
    try {
      return JSON.parse(token.slice('link:'.length)) as LinkStart;
    } catch {
      // The real signer answers `null` for anything it did not produce, tampered-with payloads
      // included. A fake that threw instead would let a use case pass here and fail in Postgres.
      return null;
    }
  }
}

/** Keeps links in memory, with both unique indexes enforced the way Postgres enforces them. */
export class FakeLinkedAccountRepository extends LinkedAccountRepository {
  readonly saved: LinkedAccountToStore[] = [];

  async save(link: LinkedAccountToStore): Promise<boolean> {
    const { providerAccount } = link;
    const takenByAnother = this.saved.some(
      (stored) =>
        stored.accountId !== link.accountId &&
        stored.providerAccount.provider === providerAccount.provider &&
        stored.providerAccount.externalTeamId ===
          providerAccount.externalTeamId &&
        stored.providerAccount.externalUserId ===
          providerAccount.externalUserId,
    );
    if (takenByAnother) {
      return false;
    }
    const index = this.saved.findIndex(
      (stored) =>
        stored.accountId === link.accountId &&
        stored.providerAccount.provider === providerAccount.provider,
    );
    if (index === -1) {
      this.saved.push(link);
    } else {
      this.saved[index] = link;
    }
    return true;
  }

  /** What each link's conversation was cached as, so a test can see it happened — or did not. */
  readonly conversations = new Map<string, string>();

  async rememberConversation(conversation: {
    readonly accountId: string;
    readonly provider: string;
    readonly directChannelId: string;
  }): Promise<void> {
    const stored = this.saved.find(
      (link) =>
        link.accountId === conversation.accountId &&
        link.providerAccount.provider === conversation.provider,
    );
    // Mirrors `updateMany`: a link removed mid-flight simply has nothing to cache against.
    if (stored) {
      this.conversations.set(
        `${conversation.accountId}:${conversation.provider}`,
        conversation.directChannelId,
      );
    }
  }

  async remove(link: {
    readonly accountId: string;
    readonly provider: string;
  }): Promise<boolean> {
    const index = this.saved.findIndex(
      (stored) =>
        stored.accountId === link.accountId &&
        stored.providerAccount.provider === link.provider,
    );
    if (index === -1) {
      return false;
    }
    this.saved.splice(index, 1);
    return true;
  }
}

/** Answers the views it was handed, for the Account that asks. */
export class FakeLinkedAccountQuery extends LinkedAccountQuery {
  private readonly views = new Map<string, readonly LinkedAccountView[]>();
  private readonly reachable = new Map<string, readonly ReachableAccount[]>();

  /** Every way this person can be reached. More than one is somebody who linked two tools. */
  withReachable(accountId: string, ...links: ReachableAccount[]): this {
    this.reachable.set(accountId, links);
    return this;
  }

  async reachableFor(
    accountIds: readonly string[],
  ): Promise<readonly ReachableAccount[]> {
    return accountIds.flatMap(
      (accountId) => this.reachable.get(accountId) ?? [],
    );
  }

  withLinksFor(accountId: string, ...views: LinkedAccountView[]): this {
    this.views.set(accountId, views);
    return this;
  }

  async forAccount(accountId: string): Promise<readonly LinkedAccountView[]> {
    return this.views.get(accountId) ?? [];
  }
}

/**
 * What Feedback calls. It records what it was told, because most of the rules are about *who*
 * is notified rather than what the message says — and it can be made to reject, because the
 * promise that matters is that nothing a person does fails when it does.
 */
export class FakePersonNotifier extends PersonNotifierPort {
  readonly asksReceived: AskReceived[] = [];
  readonly asksAnswered: AskAnswered[] = [];
  readonly feedbackWritten_: FeedbackWritten[] = [];
  private rejecting = false;

  /** The port promises never to reject. This is for proving the caller survives it anyway. */
  rejectingEverything(): this {
    this.rejecting = true;
    return this;
  }

  async askReceived(event: AskReceived): Promise<void> {
    this.asksReceived.push(event);
    this.refuseIfAsked();
  }

  async askAnswered(event: AskAnswered): Promise<void> {
    this.asksAnswered.push(event);
    this.refuseIfAsked();
  }

  async feedbackWritten(event: FeedbackWritten): Promise<void> {
    this.feedbackWritten_.push(event);
    this.refuseIfAsked();
  }

  private refuseIfAsked(): void {
    if (this.rejecting) {
      throw new Error('Nobody could be told.');
    }
  }
}

/** One chat tool's messaging half, recording what it was asked and able to refuse. */
export class FakeDirectMessenger extends DirectMessenger {
  readonly opened: string[] = [];
  readonly posted: { channelId: string; text: string }[] = [];
  private refusing: 'open' | 'post' | null = null;

  constructor(private readonly channelId = 'dm-channel') {
    super();
  }

  /**
   * A chat tool refuses both ways round: it may decline to open a conversation with somebody the
   * bot shares no space with, and in Discord's case the refusal often lands on the message
   * instead. Both have to read as "cannot reach this person".
   */
  /** The application boots once per run, so each scenario starts from here. */
  reset(): this {
    this.opened.length = 0;
    this.posted.length = 0;
    this.refusing = null;
    return this;
  }

  refusingTo(step: 'open' | 'post'): this {
    this.refusing = step;
    return this;
  }

  async openConversation(
    externalUserId: string,
  ): Promise<{ readonly channelId: string }> {
    this.opened.push(externalUserId);
    if (this.refusing === 'open') {
      throw new Error('Cannot send messages to this user');
    }
    return { channelId: this.channelId };
  }

  async postDirect(channelId: string, text: string): Promise<void> {
    if (this.refusing === 'post') {
      throw new Error('Cannot send messages to this user');
    }
    this.posted.push({ channelId, text });
  }
}

/** What a Workspace is called, for the one fact Notifications reads about it. */
export class FakeWorkspaceNamePort extends WorkspaceNamePort {
  private readonly names = new Map<string, string>();

  withName(workspaceId: string, name: string): this {
    this.names.set(workspaceId, name);
    return this;
  }

  async nameOf(workspaceId: string): Promise<string | null> {
    return this.names.get(workspaceId) ?? null;
  }
}

/** The Display name of whoever caused an event, or `null` before they introduced themselves. */
export class FakeProfileNamePort extends ProfileNamePort {
  private readonly names = new Map<string, string>();

  withName(accountId: string, displayName: string): this {
    this.names.set(accountId, displayName);
    return this;
  }

  async displayNameOf(accountId: string): Promise<string | null> {
    return this.names.get(accountId) ?? null;
  }
}

/** One stored Notification, with any field the test cares about overridden. */
export function aNotificationRecord(
  overrides: Partial<NotificationToRecord> = {},
): NotificationToRecord {
  return {
    id: '0199a0f0-0000-7000-8000-00000000n001',
    workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
    recipientAccountId: 'account-ann',
    type: 'ASK_RECEIVED',
    actorAccountId: 'account-ben',
    subjectId: '0199a0f0-0000-7000-8000-0000000000s1',
    ...overrides,
  };
}

/** One Notification as a bell line reads it, with any field the test cares about overridden. */
export function aNotificationRow(
  overrides: Partial<NotificationRow> = {},
): NotificationRow {
  return {
    id: '0199a0f0-0000-7000-8000-00000000n001',
    type: 'ASK_RECEIVED',
    actorAccountId: 'account-ben',
    subjectId: '0199a0f0-0000-7000-8000-0000000000s1',
    createdAt: new Date('2026-10-24T03:00:00.000Z'),
    readAt: null,
    ...overrides,
  };
}

/**
 * Notifications held in memory, with the idempotency the unique index enforces and the same
 * matching rules: the recipient and the Workspace are part of every match, never a check run
 * after a row has been found.
 */
export class FakeNotificationRepository extends NotificationRepository {
  readonly stored: {
    row: NotificationToRecord;
    readAt: Date | null;
  }[] = [];

  /** One entry per call, holding the batch: how a test sees a fan-out done row by row. */
  readonly recordCalls: (readonly NotificationToRecord[])[] = [];

  holding(...rows: NotificationToRecord[]): this {
    this.stored.push(...rows.map((row) => ({ row, readAt: null })));
    return this;
  }

  private refusing = false;

  /** For proving the bell failing never silences the chat message, and vice versa. */
  refusingToRecord(): this {
    this.refusing = true;
    return this;
  }

  async recordAll(
    notifications: readonly NotificationToRecord[],
  ): Promise<void> {
    this.recordCalls.push([...notifications]);
    if (this.refusing) {
      throw new Error('The bell could not be written.');
    }
    for (const row of notifications) {
      const duplicate = this.stored.some(
        (held) =>
          held.row.recipientAccountId === row.recipientAccountId &&
          held.row.type === row.type &&
          held.row.subjectId === row.subjectId,
      );
      if (!duplicate) {
        this.stored.push({ row, readAt: null });
      }
    }
  }

  async markRead(
    notification: NotificationOfRecipient,
    readAt: Date,
  ): Promise<boolean> {
    const held = this.stored.find(
      (candidate) =>
        candidate.row.id === notification.notificationId &&
        candidate.row.workspaceId === notification.workspaceId &&
        candidate.row.recipientAccountId === notification.recipientAccountId,
    );
    if (!held) {
      return false;
    }
    held.readAt = readAt;
    return true;
  }

  async markAllRead(
    recipient: {
      readonly workspaceId: string;
      readonly recipientAccountId: string;
    },
    readAt: Date,
  ): Promise<void> {
    for (const held of this.stored) {
      if (
        held.readAt === null &&
        held.row.workspaceId === recipient.workspaceId &&
        held.row.recipientAccountId === recipient.recipientAccountId
      ) {
        held.readAt = readAt;
      }
    }
  }
}

/** Answers the rows it was handed, for the recipient and Workspace that ask. */
export class FakeNotificationQuery extends NotificationQuery {
  readonly rows: {
    workspaceId: string;
    recipientAccountId: string;
    row: NotificationRow;
  }[] = [];

  with(
    workspaceId: string,
    recipientAccountId: string,
    ...rows: NotificationRow[]
  ): this {
    this.rows.push(
      ...rows.map((row) => ({ workspaceId, recipientAccountId, row })),
    );
    return this;
  }

  async forRecipient(
    workspaceId: string,
    recipientAccountId: string,
    page: PageRequest,
  ): Promise<NotificationRowPage> {
    const mine = this.rows
      .filter(
        (held) =>
          held.workspaceId === workspaceId &&
          held.recipientAccountId === recipientAccountId,
      )
      .map((held) => held.row);
    return {
      items: mine.slice(
        (page.page - 1) * page.pageSize,
        page.page * page.pageSize,
      ),
      total: mine.length,
    };
  }

  async unreadCountFor(
    workspaceId: string,
    recipientAccountId: string,
  ): Promise<number> {
    return this.rows.filter(
      (held) =>
        held.workspaceId === workspaceId &&
        held.recipientAccountId === recipientAccountId &&
        held.row.readAt === null,
    ).length;
  }
}
