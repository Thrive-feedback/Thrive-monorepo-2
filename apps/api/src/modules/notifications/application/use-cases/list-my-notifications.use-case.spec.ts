import { describe, expect, it } from 'bun:test';
import {
  aNotificationRow,
  FakeNotificationQuery,
} from '@test/support/notifications.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { ListMyNotificationsUseCase } from './list-my-notifications.use-case';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const GLOBEX_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const ONE_PAGE = { page: 1, pageSize: 20 };

/**
 * The two names differ on purpose. A bell line shows the **Display name** — the name others
 * call them by — and a fixture where both were the same could not tell the two apart, so a
 * regression to `fullName` would pass it.
 */
function aSummary(accountId: string, displayName: string | null) {
  return {
    accountId,
    email: `${accountId}@acme.test`,
    fullName: displayName === null ? null : `${displayName} Formal-Surname`,
    displayName,
    slug: null,
    photoUrl: null,
  };
}

function setUp() {
  const notificationQuery = new FakeNotificationQuery()
    .with(
      ACME_ID,
      ANN,
      aNotificationRow({
        id: '0199a0f0-0000-7000-8000-00000000n001',
        type: 'ASK_RECEIVED',
        actorAccountId: BEN,
        subjectId: '0199a0f0-0000-7000-8000-0000000000s1',
      }),
      aNotificationRow({
        id: '0199a0f0-0000-7000-8000-00000000n002',
        type: 'FEEDBACK_RECEIVED',
        actorAccountId: CARA,
        subjectId: '0199a0f0-0000-7000-8000-0000000000s2',
        readAt: new Date('2026-10-24T05:00:00.000Z'),
      }),
      // A second thing the same person did. One page, one lookup — not one per line.
      aNotificationRow({
        id: '0199a0f0-0000-7000-8000-00000000n003',
        type: 'ASK_ANSWERED',
        actorAccountId: BEN,
        subjectId: '0199a0f0-0000-7000-8000-0000000000s3',
      }),
    )
    .with(
      ACME_ID,
      BEN,
      aNotificationRow({ id: '0199a0f0-0000-7000-8000-00000000n004' }),
    );
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    aSummary(BEN, 'Ben Carter'),
    aSummary(CARA, 'Cara Diaz'),
  );
  const useCase = new ListMyNotificationsUseCase(
    notificationQuery,
    accountSummaryPort,
  );
  return { accountSummaryPort, useCase };
}

describe('reading what I have been told about', () => {
  it('lists my own, naming who did each thing', async () => {
    const { useCase } = setUp();

    const bell = await useCase.execute({
      workspaceId: ACME_ID,
      recipientAccountId: ANN,
      page: ONE_PAGE,
    });

    expect(bell.total).toBe(3);
    expect(
      bell.items.map((line) => [line.type, line.actorName, line.subjectId]),
    ).toEqual([
      ['ASK_RECEIVED', 'Ben Carter', '0199a0f0-0000-7000-8000-0000000000s1'],
      [
        'FEEDBACK_RECEIVED',
        'Cara Diaz',
        '0199a0f0-0000-7000-8000-0000000000s2',
      ],
      ['ASK_ANSWERED', 'Ben Carter', '0199a0f0-0000-7000-8000-0000000000s3'],
    ]);
  });

  it('names everybody on the page in one call, however many lines it holds', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: ACME_ID,
      recipientAccountId: ANN,
      page: ONE_PAGE,
    });

    // Three lines, two people, one call — and the repeated actor asked for once. A lookup per
    // row would pass every other test in this file and cost a query per line in production.
    expect(accountSummaryPort.calls).toHaveLength(1);
    expect(accountSummaryPort.calls[0]).toEqual([BEN, CARA]);
  });

  it('asks about nobody when there is nothing to show', async () => {
    const { accountSummaryPort, useCase } = setUp();

    const bell = await useCase.execute({
      workspaceId: GLOBEX_ID,
      recipientAccountId: ANN,
      page: ONE_PAGE,
    });

    expect(bell).toEqual({ items: [], total: 0 });
    expect(accountSummaryPort.calls).toEqual([[]]);
  });

  it('leaves an actor unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const bell = await useCase.execute({
      workspaceId: ACME_ID,
      recipientAccountId: ANN,
      page: ONE_PAGE,
    });

    expect(bell.items.map((line) => line.actorName)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('says of each line whether I have read it', async () => {
    const { useCase } = setUp();

    const bell = await useCase.execute({
      workspaceId: ACME_ID,
      recipientAccountId: ANN,
      page: ONE_PAGE,
    });

    expect(bell.items.map((line) => line.readAt)).toEqual([
      null,
      new Date('2026-10-24T05:00:00.000Z'),
      null,
    ]);
  });
});
