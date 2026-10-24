import { describe, expect, it } from 'bun:test';
import { WebConfig } from '@app/config/configuration';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import {
  FakeDirectMessenger,
  FakeLinkedAccountQuery,
  FakeLinkedAccountRepository,
  FakeNotificationRepository,
  FakeProfileNamePort,
  FakeWorkspaceNamePort,
} from '@test/support/notifications.fakes';
import { ChatCopyService } from '../service/chat-copy.service';
import { DirectMessengerRegistry } from '../service/direct-messenger-registry.service';
import { EventContextService } from '../service/event-context.service';
import { NotificationRecipients } from '../service/notification-recipients.service';
import { ChatPersonNotifier } from './chat-person-notifier.adapter';
import { FanOutPersonNotifier } from './fan-out-person-notifier.adapter';

const WORKSPACE = '0199a0f0-0000-7000-8000-0000000000w1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';

function setUp() {
  const membership = new FakeWorkspaceMembershipPort().with(
    WORKSPACE,
    ANN,
    BEN,
    CARA,
  );
  const recipients = new NotificationRecipients(membership);
  const linkedAccountQuery = new FakeLinkedAccountQuery();
  const notifications = new FakeNotificationRepository();
  const discord = new FakeDirectMessenger();
  const chat = new ChatPersonNotifier(
    recipients,
    linkedAccountQuery,
    new FakeLinkedAccountRepository(),
    new DirectMessengerRegistry({ DISCORD: discord }),
    new ChatCopyService(new WebConfig('https://thrive.test')),
    new EventContextService(
      new FakeWorkspaceNamePort().withName(WORKSPACE, 'Acme'),
      new FakeProfileNamePort().withName(ANN, 'Ann'),
    ),
  );
  const notifier = new FanOutPersonNotifier(
    recipients,
    notifications,
    new FakeIdGenerator(...Array.from({ length: 20 }, (_, i) => `n-${i}`)),
    chat,
  );
  const linked = (accountId: string) =>
    linkedAccountQuery.withReachable(accountId, {
      accountId,
      provider: 'DISCORD',
      externalUserId: `discord-${accountId}`,
      directChannelId: 'dm-known',
    });
  const asked = (giverAccountIds: string[] = [BEN]) => ({
    workspaceId: WORKSPACE,
    actorAccountId: ANN,
    giverAccountIds,
    requestMessage: 'how our standups are going',
    askIdByGiver: Object.fromEntries(
      giverAccountIds.map((giver) => [giver, `ask-${giver}`]),
    ),
  });
  return { membership, notifications, discord, notifier, linked, asked };
}

describe('the bell is the floor', () => {
  it('writes a line for somebody who has linked no chat account at all', async () => {
    const { notifier, notifications, discord, asked } = setUp();

    await notifier.askReceived(asked());

    // The whole point of #248: being told does not depend on a chat tool, a Connection or a
    // setting. Nothing was sent to Discord, and Ben is still told.
    expect(notifications.stored).toHaveLength(1);
    expect(notifications.stored[0]?.row.recipientAccountId).toBe(BEN);
    expect(notifications.stored[0]?.row.type).toBe('ASK_RECEIVED');
    expect(discord.posted).toEqual([]);
  });

  it('writes one line and sends one message to somebody who linked', async () => {
    const { notifier, notifications, discord, linked, asked } = setUp();
    linked(BEN);

    await notifier.askReceived(asked());

    // Both, deliberately: the bell is where they look, the message is where they are reached.
    expect(notifications.stored).toHaveLength(1);
    expect(discord.posted).toHaveLength(1);
  });

  it('writes a whole fan-out in one call, not one call per person', async () => {
    const { notifier, notifications, asked } = setUp();

    await notifier.askReceived(asked([BEN, CARA]));

    expect(notifications.recordCalls).toHaveLength(1);
    expect(notifications.recordCalls[0]).toHaveLength(2);
  });
});

describe('the two channels are independent, in both directions', () => {
  it('still sends the chat message when the bell cannot be written', async () => {
    const { notifier, notifications, discord, linked, asked } = setUp();
    linked(BEN);
    notifications.refusingToRecord();

    await notifier.askReceived(asked());

    // Telling somebody in one place beats telling them in neither.
    expect(discord.posted).toHaveLength(1);
  });

  it('still writes the bell line when the chat tool refuses', async () => {
    const { notifier, notifications, discord, linked, asked } = setUp();
    linked(BEN);
    discord.refusingTo('post');

    await notifier.askReceived(asked());

    expect(notifications.stored).toHaveLength(1);
  });

  it('resolves even when both fail', async () => {
    const { notifier, notifications, discord, linked, asked } = setUp();
    linked(BEN);
    notifications.refusingToRecord();
    discord.refusingTo('open');

    await expect(notifier.askReceived(asked())).resolves.toBeUndefined();
  });
});

describe('who is told, and about what', () => {
  it('never tells the person who caused it', async () => {
    const { notifier, notifications, asked } = setUp();

    await notifier.askReceived(asked([ANN, BEN]));

    expect(
      notifications.stored.map((held) => held.row.recipientAccountId),
    ).toEqual([BEN]);
  });

  it('never tells a Deactivated Member', async () => {
    const { notifier, notifications, membership, asked } = setUp();
    membership.withDeactivated(WORKSPACE, BEN);

    await notifier.askReceived(asked());

    expect(notifications.stored).toEqual([]);
  });

  it('tells the Receiver and a Selected person differently', async () => {
    const { notifier, notifications } = setUp();

    await notifier.feedbackWritten({
      workspaceId: WORKSPACE,
      actorAccountId: ANN,
      receiverAccountId: BEN,
      sharedWithAccountIds: [CARA],
      feedbackId: 'feedback-1',
    });

    const byRecipient = new Map(
      notifications.stored.map((held) => [
        held.row.recipientAccountId,
        held.row.type,
      ]),
    );
    expect(byRecipient.get(BEN)).toBe('FEEDBACK_RECEIVED');
    expect(byRecipient.get(CARA)).toBe('FEEDBACK_SHARED');
  });

  it('tells somebody who is both the Receiver and Selected exactly once', async () => {
    const { notifier, notifications } = setUp();

    await notifier.feedbackWritten({
      workspaceId: WORKSPACE,
      actorAccountId: ANN,
      receiverAccountId: BEN,
      sharedWithAccountIds: [BEN],
      feedbackId: 'feedback-1',
    });

    // The unique index could not catch this — the two rows would carry different types — so
    // the order of candidates is what makes it true, and it is true of the bell as well as of
    // the chat message (#215 AC 5).
    expect(notifications.stored).toHaveLength(1);
    expect(notifications.stored[0]?.row.type).toBe('FEEDBACK_RECEIVED');
  });

  it('tells only the Requester that an Ask was answered', async () => {
    const { notifier, notifications } = setUp();

    await notifier.askAnswered({
      workspaceId: WORKSPACE,
      actorAccountId: BEN,
      requesterAccountId: ANN,
      feedbackRequestId: 'request-1',
    });

    expect(notifications.stored).toHaveLength(1);
    expect(notifications.stored[0]?.row.recipientAccountId).toBe(ANN);
    expect(notifications.stored[0]?.row.subjectId).toBe('request-1');
  });
});
