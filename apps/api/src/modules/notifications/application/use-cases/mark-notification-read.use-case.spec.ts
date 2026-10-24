import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  aNotificationRecord,
  FakeNotificationRepository,
} from '@test/support/notifications.fakes';
import { NotificationNotFoundError } from '../notifications.errors';
import { MarkNotificationReadUseCase } from './mark-notification-read.use-case';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const GLOBEX_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANN = 'account-ann';
const BEN = 'account-ben';
const NOTIFICATION_ID = '0199a0f0-0000-7000-8000-00000000n001';
const READ_AT = new Date('2026-10-24T09:00:00.000Z');

function setUp() {
  const notificationRepository = new FakeNotificationRepository().holding(
    aNotificationRecord({
      id: NOTIFICATION_ID,
      workspaceId: ACME_ID,
      recipientAccountId: ANN,
    }),
  );
  const useCase = new MarkNotificationReadUseCase(
    notificationRepository,
    new FakeClock(READ_AT),
  );
  return { notificationRepository, useCase };
}

describe('marking one thing I was told about as read', () => {
  it('stamps it with the instant I read it', async () => {
    const { notificationRepository, useCase } = setUp();

    await useCase.execute({
      workspaceId: ACME_ID,
      recipientAccountId: ANN,
      notificationId: NOTIFICATION_ID,
    });

    expect(notificationRepository.stored[0]?.readAt).toEqual(READ_AT);
  });

  it('refuses one belonging to somebody else, as not found', async () => {
    const { useCase } = setUp();

    // Ben knows Ann's id — it travelled in nothing he can read, but guessing is free. The
    // refusal must not tell him apart from a Notification that was never written, because the
    // existence of this one is itself the fact: it says Ann was asked, answered or written to.
    await expect(
      useCase.execute({
        workspaceId: ACME_ID,
        recipientAccountId: BEN,
        notificationId: NOTIFICATION_ID,
      }),
    ).rejects.toThrow(NotificationNotFoundError);
  });

  it('leaves somebody else’s unread when it refuses', async () => {
    const { notificationRepository, useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: ACME_ID,
        recipientAccountId: BEN,
        notificationId: NOTIFICATION_ID,
      }),
    ).rejects.toThrow(NotificationNotFoundError);

    expect(notificationRepository.stored[0]?.readAt).toBeNull();
  });

  it('refuses one of mine reached through another Workspace, the same way', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: GLOBEX_ID,
        recipientAccountId: ANN,
        notificationId: NOTIFICATION_ID,
      }),
    ).rejects.toThrow(NotificationNotFoundError);
  });

  it('refuses an id that names nothing, as not found', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: ACME_ID,
        recipientAccountId: ANN,
        notificationId: '0199a0f0-0000-7000-8000-00000000n999',
      }),
    ).rejects.toThrow(NotificationNotFoundError);
  });
});
