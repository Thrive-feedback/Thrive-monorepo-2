import { describe, expect, it } from 'bun:test';
import { WebConfig } from '@app/config/configuration';
import {
  FakeChatPoster,
  FakeConnectionQuery,
} from '@test/support/integrations.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { ChannelCopyService } from '../service/channel-copy.service';
import { ConnectionChannelAnnouncer } from './connection-channel-announcer.adapter';

const WORKSPACE_ID = 'workspace-1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CHANNEL = { provider: 'DISCORD', externalChannelId: '42' } as const;

function aSummary(accountId: string, displayName: string | null) {
  return {
    accountId,
    email: `${accountId}@thrive.test`,
    fullName: displayName,
    displayName,
    slug: displayName?.toLowerCase() ?? null,
    photoUrl: null,
  };
}

function setUp() {
  const connectionQuery = new FakeConnectionQuery();
  const accountSummary = new FakeAccountSummaryPort();
  accountSummary.summaries.push(aSummary(ANN, 'Ann'), aSummary(BEN, 'Ben'));
  const chatPoster = new FakeChatPoster();
  const announcer = new ConnectionChannelAnnouncer(
    connectionQuery,
    accountSummary,
    new ChannelCopyService(new WebConfig('https://thrive.test')),
    chatPoster,
  );
  return { announcer, connectionQuery, accountSummary, chatPoster };
}

function publishing() {
  return {
    workspaceId: WORKSPACE_ID,
    giverAccountId: ANN,
    receiverAccountIds: [BEN],
    feedbackId: 'feedback-1',
  };
}

describe('announcing to a Workspace that has connected nothing', () => {
  it('posts nothing and resolves', async () => {
    const { announcer, chatPoster } = setUp();

    await announcer.feedbackPublished(publishing());

    expect(chatPoster.posts).toHaveLength(0);
  });

  it('does not even resolve a name — the cheap read comes first', async () => {
    const { announcer, accountSummary } = setUp();

    await announcer.feedbackPublished(publishing());

    expect(accountSummary.calls).toHaveLength(0);
  });
});

describe('announcing to a connected channel', () => {
  it('posts the Feedback line into it', async () => {
    const { announcer, connectionQuery, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL);

    await announcer.feedbackPublished(publishing());

    expect(chatPoster.posts).toHaveLength(1);
    expect(chatPoster.posts[0]).toEqual({
      provider: 'DISCORD',
      channelId: '42',
      text: [
        '**Ann** gave **Ben** feedback',
        'https://thrive.test/home?feedback=feedback-1',
      ].join('\n'),
    });
  });

  it('posts a Kudos with its message', async () => {
    const { announcer, connectionQuery, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL);

    await announcer.kudosGiven({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANN,
      recipientAccountIds: [BEN],
      message: 'Carried the launch.',
      kudosId: 'kudos-1',
    });

    expect(chatPoster.posts[0]?.text).toContain('> Carried the launch.');
  });

  it('reads every name it needs in one call (BE_06 R9)', async () => {
    const { announcer, connectionQuery, accountSummary } = setUp();
    connectionQuery.postingTo(CHANNEL);

    await announcer.feedbackPublished(publishing());

    expect(accountSummary.calls).toHaveLength(1);
    expect(accountSummary.calls[0]).toEqual([ANN, BEN]);
  });

  it('asks for a person named twice only once', async () => {
    const { announcer, connectionQuery, accountSummary } = setUp();
    connectionQuery.postingTo(CHANNEL);

    // Somebody may be both the Giver and among the people a Kudos mentions, because the Kudos
    // entity only drops the Giver from its own recipients.
    await announcer.feedbackPublished({
      ...publishing(),
      receiverAccountIds: [BEN, BEN],
    });

    expect(accountSummary.calls[0]).toEqual([ANN, BEN]);
  });
});

describe('when the channel refuses the post', () => {
  it('resolves rather than rejecting — ADR-0035 §8', async () => {
    const { announcer, connectionQuery, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL);
    chatPoster.unreachableChannel();

    // Nothing a person does may fail because a chat tool is unreachable, so this must not throw.
    await expect(
      announcer.feedbackPublished(publishing()),
    ).resolves.toBeUndefined();
  });

  it('keeps posting to the channels that work', async () => {
    const { announcer, connectionQuery, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL, {
      provider: 'DISCORD',
      externalChannelId: '43',
    });
    chatPoster.unreachableChannel();

    await announcer.feedbackPublished(publishing());

    // Both were attempted: one failing does not stop the other.
    expect(chatPoster.posts).toHaveLength(2);
  });
});

describe('when the Connection cannot be read at all', () => {
  it('reads as nowhere to post rather than failing', async () => {
    const { announcer, chatPoster, connectionQuery } = setUp();
    connectionQuery.postableChannelsOf = () => {
      throw new Error('the database is gone');
    };

    await expect(
      announcer.feedbackPublished(publishing()),
    ).resolves.toBeUndefined();
    expect(chatPoster.posts).toHaveLength(0);
  });
});
