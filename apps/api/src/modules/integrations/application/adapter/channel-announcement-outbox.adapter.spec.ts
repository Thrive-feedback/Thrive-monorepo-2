import { describe, expect, it } from 'bun:test';
import {
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import { FakeChannelAnnouncer } from '@test/support/integrations.fakes';
import {
  ChannelAnnouncementOutboxHandler,
  FEEDBACK_PUBLISHED_TYPE,
  KUDOS_GIVEN_TYPE,
} from './channel-announcement-outbox.adapter';

const WORKSPACE = 'workspace-1';
const ANN = 'account-ann';
const BEN = 'account-ben';

function setUp() {
  const channelAnnouncer = new FakeChannelAnnouncer();
  return {
    channelAnnouncer,
    handler: new ChannelAnnouncementOutboxHandler(channelAnnouncer),
  };
}

function message(type: string, payload: unknown): OutboxMessageRead {
  return { id: 'outbox-1', type, version: 1, payload, attempts: 1 };
}

describe('draining an announcement', () => {
  it('tells the channel about published Feedback, from the ids the payload carries', async () => {
    const { handler, channelAnnouncer } = setUp();

    await handler.handle(
      message(FEEDBACK_PUBLISHED_TYPE, {
        workspaceId: WORKSPACE,
        giverAccountId: ANN,
        receiverAccountIds: [BEN],
        feedbackId: 'feedback-1',
      }),
    );

    expect(channelAnnouncer.feedbackPublished_).toHaveLength(1);
    expect(channelAnnouncer.feedbackPublished_[0]?.feedbackId).toBe(
      'feedback-1',
    );
  });

  it('tells the channel about a Kudos, carrying its message (brain ADR-0045)', async () => {
    const { handler, channelAnnouncer } = setUp();

    await handler.handle(
      message(KUDOS_GIVEN_TYPE, {
        workspaceId: WORKSPACE,
        giverAccountId: ANN,
        recipientAccountIds: [BEN],
        message: 'carried the launch',
        kudosId: 'kudos-1',
      }),
    );

    expect(channelAnnouncer.kudosGiven_[0]?.message).toBe('carried the launch');
  });
});

describe('a message this handler cannot use', () => {
  it('refuses a payload it cannot read, rather than retrying the same bytes', async () => {
    const { handler, channelAnnouncer } = setUp();

    await expect(
      handler.handle(message(FEEDBACK_PUBLISHED_TYPE, { workspaceId: 1 })),
    ).rejects.toThrow(UnprocessableOutboxMessage);
    expect(channelAnnouncer.feedbackPublished_).toHaveLength(0);
  });

  it('refuses a type it does not know', async () => {
    const { handler } = setUp();

    await expect(
      handler.handle(message('integrations.something_else', {})),
    ).rejects.toThrow(UnprocessableOutboxMessage);
  });
});

describe('how often it may be tried', () => {
  it('allows one attempt, because a chat post cannot be taken back', () => {
    const { handler } = setUp();

    // brain ADR-0040: a post reaches a room that may hold a client and cannot be unsent, so a
    // retry would trade "occasionally lost" for "occasionally doubled".
    expect(handler.maxAttempts).toBe(1);
  });
});

describe('what reaches the relay', () => {
  it('passes a refusal through, so the row goes dead and can be seen', async () => {
    const { handler, channelAnnouncer } = setUp();
    channelAnnouncer.rejectingEverything();

    await expect(
      handler.handle(
        message(FEEDBACK_PUBLISHED_TYPE, {
          workspaceId: WORKSPACE,
          giverAccountId: ANN,
          receiverAccountIds: [BEN],
          feedbackId: 'feedback-1',
        }),
      ),
    ).rejects.toThrow();
  });
});
