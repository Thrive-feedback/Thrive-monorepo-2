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
});

describe('when the channel refuses the post', () => {
  it('rejects, so the relay can record it — ADR 0076', async () => {
    const { announcer, connectionQuery, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL);
    chatPoster.unreachableChannel();

    // This used to resolve and swallow. The caller is now the outbox relay, whose whole job is
    // to know: at `maxAttempts: 1` a refusal becomes a dead row somebody can see and replay by
    // hand, instead of the log line it used to be. Nothing a person does fails because of it —
    // that holds because no request is waiting on this any more.
    await expect(announcer.feedbackPublished(publishing())).rejects.toThrow(
      /refused the post/,
    );
  });

  it('still posts to the channel that works before it rejects', async () => {
    const { announcer, connectionQuery, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL, {
      provider: 'DISCORD',
      externalChannelId: '43',
    });
    // Only the first channel refuses, so a post reaching the second is the whole claim.
    chatPoster.unreachableChannels('42');

    await expect(announcer.feedbackPublished(publishing())).rejects.toThrow();

    // One channel refusing must not stop another (ADR 0062): the working channel is still
    // posted to, and only then does the refusal surface.
    expect(chatPoster.posts.map((post) => post.channelId)).toContain('43');
  });
});

describe('when a name cannot be read', () => {
  it('rejects without posting, rather than posting a line with a gap in it', async () => {
    const { announcer, connectionQuery, accountSummary, chatPoster } = setUp();
    connectionQuery.postingTo(CHANNEL);
    accountSummary.summariesOf = () => {
      throw new Error('Identity is gone');
    };

    await expect(announcer.feedbackPublished(publishing())).rejects.toThrow(
      'Identity is gone',
    );
    expect(chatPoster.posts).toHaveLength(0);
  });
});

describe('when the Connection cannot be read at all', () => {
  it('rejects, because nobody can say whether there was a channel to tell', async () => {
    const { announcer, chatPoster, connectionQuery } = setUp();
    connectionQuery.postableChannelsOf = () => {
      throw new Error('the database is gone');
    };

    // Distinct from a Workspace that has connected nothing, which is a success: there, the read
    // succeeded and the answer was none.
    await expect(announcer.feedbackPublished(publishing())).rejects.toThrow(
      'the database is gone',
    );
    expect(chatPoster.posts).toHaveLength(0);
  });
});
