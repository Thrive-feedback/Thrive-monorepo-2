import { describe, expect, it } from 'bun:test';
import {
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import { FakePersonNotifier } from '@test/support/notifications.fakes';
import {
  ASK_ANSWERED_TYPE,
  ASK_RECEIVED_TYPE,
  FEEDBACK_WRITTEN_TYPE,
  PersonNotificationOutboxHandler,
} from './person-notification-outbox.adapter';

const WORKSPACE = 'workspace-1';
const ANN = 'account-ann';
const BEN = 'account-ben';

function setUp() {
  const personNotifier = new FakePersonNotifier();
  return {
    personNotifier,
    handler: new PersonNotificationOutboxHandler(personNotifier),
  };
}

function message(type: string, payload: unknown): OutboxMessageRead {
  return { id: 'outbox-1', type, version: 1, payload, attempts: 1 };
}

describe('draining a notification', () => {
  it('tells the people asked, from the ids the payload carries', async () => {
    const { handler, personNotifier } = setUp();

    await handler.handle(
      message(ASK_RECEIVED_TYPE, {
        workspaceId: WORKSPACE,
        actorAccountId: ANN,
        giverAccountIds: [BEN],
        requestMessage: 'How did the launch go?',
        askIdByGiver: { [BEN]: 'ask-1' },
      }),
    );

    expect(personNotifier.asksReceived).toHaveLength(1);
    expect(personNotifier.asksReceived[0]?.giverAccountIds).toEqual([BEN]);
  });

  it('tells the Requester their request was answered', async () => {
    const { handler, personNotifier } = setUp();

    await handler.handle(
      message(ASK_ANSWERED_TYPE, {
        workspaceId: WORKSPACE,
        actorAccountId: BEN,
        requesterAccountId: ANN,
        feedbackRequestId: 'request-1',
      }),
    );

    expect(personNotifier.asksAnswered).toHaveLength(1);
    expect(personNotifier.asksAnswered[0]?.requesterAccountId).toBe(ANN);
  });

  it('tells the people Feedback was written for', async () => {
    const { handler, personNotifier } = setUp();

    await handler.handle(
      message(FEEDBACK_WRITTEN_TYPE, {
        workspaceId: WORKSPACE,
        actorAccountId: ANN,
        receiverAccountIds: [BEN],
        sharedWithAccountIds: [],
        feedbackId: 'feedback-1',
      }),
    );

    expect(personNotifier.feedbackWritten_).toHaveLength(1);
    expect(personNotifier.feedbackWritten_[0]?.receiverAccountIds).toEqual([
      BEN,
    ]);
  });
});

describe('a message this handler cannot use', () => {
  it('refuses a payload it cannot read, rather than spending five attempts on it', async () => {
    const { handler, personNotifier } = setUp();

    await expect(
      handler.handle(message(ASK_ANSWERED_TYPE, { workspaceId: WORKSPACE })),
    ).rejects.toThrow(UnprocessableOutboxMessage);
    expect(personNotifier.asksAnswered).toHaveLength(0);
  });

  it('refuses a type it does not know', async () => {
    const { handler } = setUp();

    await expect(
      handler.handle(message('notifications.something_else', {})),
    ).rejects.toThrow(UnprocessableOutboxMessage);
  });
});

describe('how often it may be tried', () => {
  it('allows five attempts, because writing the same bell line twice is a no-op', () => {
    const { handler } = setUp();

    // The opposite of the channel announcement, which gets one: `notification` is unique on
    // (recipient, type, subject), so a retry costs nothing and losing the row costs everything.
    expect(handler.maxAttempts).toBe(5);
  });
});

describe('what reaches the relay', () => {
  it('passes a refusal through, so the row is retried rather than lost', async () => {
    const { handler, personNotifier } = setUp();
    personNotifier.rejectingEverything();

    await expect(
      handler.handle(
        message(FEEDBACK_WRITTEN_TYPE, {
          workspaceId: WORKSPACE,
          actorAccountId: ANN,
          receiverAccountIds: [BEN],
          sharedWithAccountIds: [],
          feedbackId: 'feedback-1',
        }),
      ),
    ).rejects.toThrow();
  });
});
