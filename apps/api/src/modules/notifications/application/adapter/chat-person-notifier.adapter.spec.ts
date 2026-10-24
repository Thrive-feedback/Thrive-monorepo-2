import { describe, expect, it } from 'bun:test';
import { WebConfig } from '@app/config/configuration';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import {
  FakeDirectMessenger,
  FakeLinkedAccountQuery,
  FakeLinkedAccountRepository,
  FakeProfileNamePort,
  FakeWorkspaceNamePort,
} from '@test/support/notifications.fakes';
import { ChatCopyService } from '../service/chat-copy.service';
import { DirectMessengerRegistry } from '../service/direct-messenger-registry.service';
import { EventContextService } from '../service/event-context.service';
import { NotificationRecipients } from '../service/notification-recipients.service';
import { ChatPersonNotifier } from './chat-person-notifier.adapter';

const WORKSPACE = '0199a0f0-0000-7000-8000-0000000000w1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const ASK = 'ask-for-ben';

function setUp() {
  const membership = new FakeWorkspaceMembershipPort().with(
    WORKSPACE,
    ANN,
    BEN,
    CARA,
  );
  const query = new FakeLinkedAccountQuery();
  const repository = new FakeLinkedAccountRepository();
  const discord = new FakeDirectMessenger();
  const notifier = new ChatPersonNotifier(
    new NotificationRecipients(membership),
    query,
    repository,
    new DirectMessengerRegistry({ DISCORD: discord }),
    new ChatCopyService(new WebConfig('https://thrive.test')),
    new EventContextService(
      new FakeWorkspaceNamePort().withName(WORKSPACE, 'Acme'),
      new FakeProfileNamePort().withName(ANN, 'Ann'),
    ),
  );
  const linked = (accountId: string, directChannelId: string | null = null) =>
    query.withReachable(accountId, {
      accountId,
      provider: 'DISCORD',
      externalUserId: `discord-${accountId}`,
      directChannelId,
    });
  const asked = (giverAccountIds: string[] = [BEN]) => ({
    workspaceId: WORKSPACE,
    actorAccountId: ANN,
    giverAccountIds,
    requestMessage: 'how our standups are going',
    askIdByGiver: Object.fromEntries(
      giverAccountIds.map((giver) => [giver, `${ASK}-${giver}`]),
    ),
  });
  return { membership, query, repository, discord, notifier, linked, asked };
}

describe('messaging the people an Ask is for', () => {
  it('names who asked, what about, the Workspace, and where to go', async () => {
    const { notifier, discord, linked, asked } = setUp();
    linked(BEN);

    await notifier.askReceived(asked());

    expect(discord.posted).toHaveLength(1);
    const text = discord.posted[0]?.text ?? '';
    expect(text).toContain('Ann');
    expect(text).toContain('Acme');
    expect(text).toContain('how our standups are going');
    expect(text).toContain(
      `https://thrive.test/home?tab=waiting&ask=${ASK}-${BEN}`,
    );
  });

  it('says nothing to somebody who has linked no chat account', async () => {
    const { notifier, discord, asked } = setUp();

    await notifier.askReceived(asked());

    expect(discord.opened).toEqual([]);
    expect(discord.posted).toEqual([]);
  });

  it('never messages the person who did the asking', async () => {
    const { notifier, discord, linked, asked } = setUp();
    linked(ANN);
    linked(BEN);

    await notifier.askReceived(asked([ANN, BEN]));

    expect(discord.posted).toHaveLength(1);
    expect(discord.opened).toEqual([`discord-${BEN}`]);
  });

  it('never messages a Deactivated Member', async () => {
    const { notifier, discord, linked, asked, membership } = setUp();
    membership.withDeactivated(WORKSPACE, BEN);
    linked(BEN);

    // `membersAmong` answers active Members only (ADR 0047), so a Deactivated person is simply
    // not among the recipients — there is no separate liveness check to forget.
    await notifier.askReceived({
      ...asked(),
      giverAccountIds: [BEN],
    });

    expect(discord.posted).toEqual([]);
  });

  it('messages everybody asked, and one refusal does not stop the others', async () => {
    const { notifier, discord, query, asked } = setUp();
    query
      .withReachable(BEN, {
        accountId: BEN,
        provider: 'DISCORD',
        externalUserId: 'discord-ben',
        directChannelId: null,
      })
      .withReachable(CARA, {
        accountId: CARA,
        provider: 'DISCORD',
        externalUserId: 'discord-cara',
        directChannelId: 'dm-cara',
      });
    discord.refusingTo('open');

    await notifier.askReceived(asked([BEN, CARA]));

    // Ben's conversation has to be opened and is refused; Cara's is already known, so her
    // message still goes. `allSettled`, not a loop with `await` (#213 AC 7).
    expect(discord.posted.map((post) => post.channelId)).toEqual(['dm-cara']);
  });
});

describe('the conversation, once opened', () => {
  it('is remembered after the first message actually arrives', async () => {
    const { notifier, repository, linked, asked } = setUp();
    linked(BEN);
    await repository.save({
      id: 'link-ben',
      accountId: BEN,
      providerAccount: {
        provider: 'DISCORD',
        externalTeamId: '',
        externalUserId: 'discord-ben',
        externalUsername: 'ben',
      },
    });

    await notifier.askReceived(asked());

    expect(repository.conversations.get(`${BEN}:DISCORD`)).toBe('dm-channel');
  });

  it('is not remembered when the message was refused', async () => {
    const { notifier, repository, discord, linked, asked } = setUp();
    linked(BEN);
    discord.refusingTo('post');

    await notifier.askReceived(asked());

    // An id learned from a conversation that then refused the message is not worth keeping.
    expect(repository.conversations.size).toBe(0);
  });

  it('is reused rather than opened again', async () => {
    const { notifier, discord, linked, asked } = setUp();
    linked(BEN, 'dm-known');

    await notifier.askReceived(asked());

    expect(discord.opened).toEqual([]);
    expect(discord.posted[0]?.channelId).toBe('dm-known');
  });
});

describe('never failing the thing that caused it', () => {
  it('resolves when the chat tool refuses to open a conversation', async () => {
    const { notifier, discord, linked, asked } = setUp();
    linked(BEN);
    discord.refusingTo('open');

    await expect(notifier.askReceived(asked())).resolves.toBeUndefined();
  });

  it('resolves when the chat tool refuses the message itself', async () => {
    const { notifier, discord, linked, asked } = setUp();
    linked(BEN);
    // Discord's refusal often lands here rather than on opening, so both have to be survivable.
    discord.refusingTo('post');

    await expect(notifier.askReceived(asked())).resolves.toBeUndefined();
  });
});

describe('messaging somebody Feedback was written to', () => {
  it('tells the Receiver it was written to them, and a Selected person it was shared', async () => {
    const { notifier, discord, linked } = setUp();
    linked(BEN);
    linked(CARA);

    await notifier.feedbackWritten({
      workspaceId: WORKSPACE,
      actorAccountId: ANN,
      receiverAccountId: BEN,
      sharedWithAccountIds: [CARA],
      feedbackId: 'feedback-1',
    });

    const texts = discord.posted.map((post) => post.text);
    expect(texts.some((text) => text.includes('wrote feedback to you'))).toBe(
      true,
    );
    expect(
      texts.some((text) => text.includes('shared feedback with you')),
    ).toBe(true);
  });

  it('tells somebody who is both the Receiver and Selected exactly once', async () => {
    const { notifier, discord, linked } = setUp();
    linked(BEN);

    await notifier.feedbackWritten({
      workspaceId: WORKSPACE,
      actorAccountId: ANN,
      receiverAccountId: BEN,
      sharedWithAccountIds: [BEN],
      feedbackId: 'feedback-1',
    });

    expect(discord.posted).toHaveLength(1);
    // De-duplicated to the wording that is true of them: it was written *to* them (#215 AC 5).
    expect(discord.posted[0]?.text).toContain('wrote feedback to you');
  });
});

describe('messaging the Requester when an Ask is answered', () => {
  it('tells only the Requester, and carries none of the answer', async () => {
    const { notifier, discord, linked } = setUp();
    linked(ANN);
    linked(CARA);

    await notifier.askAnswered({
      workspaceId: WORKSPACE,
      // Ben answered; Ann asked. Cara is on the same request and is told nothing.
      actorAccountId: BEN,
      requesterAccountId: ANN,
      feedbackRequestId: 'request-1',
    });

    expect(discord.posted).toHaveLength(1);
    expect(discord.posted[0]?.text).toContain('answered your feedback request');
    expect(discord.posted[0]?.text).toContain('request=request-1');
  });
});
