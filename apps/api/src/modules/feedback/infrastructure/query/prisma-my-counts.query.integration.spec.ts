import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { Kudos } from '../../domain/entity/kudos.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import type { SeenListValue } from '../../domain/value-object/seen-list.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRepository } from '../repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from '../repository/prisma-feedback-request.repository';
import { PrismaKudosRepository } from '../repository/prisma-kudos.repository';
import { PrismaListSeenRepository } from '../repository/prisma-list-seen.repository';
import { PrismaFeedbackRequestQuery } from './prisma-feedback-request.query';
import { PrismaKudosQuery } from './prisma-kudos.query';
import { PrismaMyCountsQuery } from './prisma-my-counts.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const feedbackRepository = new PrismaFeedbackRepository(context);
const requestRepository = new PrismaFeedbackRequestRepository(context);
const kudosRepository = new PrismaKudosRepository(context);
const seenRepository = new PrismaListSeenRepository(context);
const requestQuery = new PrismaFeedbackRequestQuery(context);
const kudosQuery = new PrismaKudosQuery(context);
const query = new PrismaMyCountsQuery(context);

const FIRST_PAGE = { after: null, limit: 20 };

const workspacesWritten: string[] = [];

/**
 * A Workspace of the test's own, so it counts only what it wrote. No Account and no Workspace row
 * is created: Feedback's tables hold their ids without a foreign key.
 */
function aWorkspace(): string {
  const workspaceId = uuidv7();
  workspacesWritten.push(workspaceId);
  return workspaceId;
}

/**
 * `requester` asks `count` new people; each answer comes back through `answer(place)`. Shared
 * with nobody else unless `visibility` says so.
 */
async function aRequest(
  workspaceId: string,
  requester: string,
  count: number,
  visibility: Visibility = Visibility.onlyMe(),
) {
  const givers = Array.from({ length: count }, () => ({
    askId: uuidv7(),
    giverAccountId: uuidv7(),
  }));
  const request = FeedbackRequest.send({
    id: uuidv7(),
    workspaceId,
    requesterAccountId: requester,
    message: RequestMessage.of('How clear was the plan?'),
    visibility,
    tags: BoundTags.none(),
    givers,
  });
  await requestRepository.save(request);
  return {
    /** The `place`th person it asked. */
    giver: (place: number): string => {
      const giver = givers[place];
      if (!giver) {
        throw new Error('The request did not ask that many people.');
      }
      return giver.giverAccountId;
    },
    answer: async (place: number): Promise<string> => {
      const giver = givers[place];
      if (!giver) {
        throw new Error('The request did not ask that many people.');
      }
      const answered = request.answerAsk({
        ...giver,
        feedbackId: uuidv7(),
        message: FeedbackMessage.of('The order of the steps was clear.'),
        tags: BoundTags.none(),
      });
      if (!answered) {
        throw new Error('The request does not hold the Ask.');
      }
      await requestRepository.saveAnswer(request, answered);
      return answered.snapshot().id;
    },
  };
}

/** Somebody gives `receiver` Feedback unasked. */
async function offeredTo(workspaceId: string, receiver: string) {
  const id = uuidv7();
  await feedbackRepository.save(
    Feedback.offer({
      id,
      workspaceId,
      giverAccountId: uuidv7(),
      receiverAccountIds: [receiver],
      visibility: Visibility.onlyMe(),
      message: FeedbackMessage.of('Thanks for the clear plan.'),
      tags: BoundTags.none(),
    }),
  );
  return id;
}

/** Somebody writes to somebody else and selects `reader` to read it: Shared with me, for them. */
async function sharedWith(workspaceId: string, reader: string) {
  const id = uuidv7();
  await feedbackRepository.save(
    Feedback.offer({
      id,
      workspaceId,
      giverAccountId: uuidv7(),
      receiverAccountIds: [uuidv7()],
      visibility: Visibility.of({
        value: 'SELECTED_PEOPLE',
        selectedAccountIds: [reader],
      }),
      message: FeedbackMessage.of('The demo landed well.'),
      tags: BoundTags.none(),
    }),
  );
  return id;
}

/** Somebody writes to somebody else for the whole Workspace to read. */
async function forEveryone(workspaceId: string) {
  await feedbackRepository.save(
    Feedback.offer({
      id: uuidv7(),
      workspaceId,
      giverAccountId: uuidv7(),
      receiverAccountIds: [uuidv7()],
      visibility: Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] }),
      message: FeedbackMessage.of('Great review.'),
      tags: BoundTags.none(),
    }),
  );
}

/** Somebody gives a Kudos naming every one of `recipients`, or nobody. */
async function kudosNaming(workspaceId: string, ...recipients: string[]) {
  const kudos = Kudos.give({
    id: uuidv7(),
    workspaceId,
    giverAccountId: uuidv7(),
    message: KudosMessage.of('Great launch.'),
    tags: BoundTags.of({
      workspaceGoals: [],
      mentions: recipients.map((accountId, index) => ({
        accountId,
        slug: `person-${index}`,
        displayName: `Person ${index}`,
      })),
    }),
    card: null,
  });
  await kudosRepository.save(kudos);
  return kudos.snapshot().id;
}

/** When a row was written, as the store wrote it, so a test can open a kind just after it. */
async function writtenAt(
  kind: 'feedback' | 'kudos',
  id: string,
): Promise<Date> {
  const row =
    kind === 'feedback'
      ? await prismaService.feedback.findUniqueOrThrow({ where: { id } })
      : await prismaService.kudos.findUniqueOrThrow({ where: { id } });
  return row.createdAt;
}

/** Moves a row a second past `after`, which only a test can choose. */
async function writeLater(kind: 'feedback' | 'kudos', id: string, after: Date) {
  const createdAt = new Date(after.getTime() + 1000);
  if (kind === 'feedback') {
    await prismaService.feedback.update({ where: { id }, data: { createdAt } });
  } else {
    await prismaService.kudos.update({ where: { id }, data: { createdAt } });
  }
}

function opened(
  workspaceId: string,
  accountId: string,
  list: SeenListValue,
  seenAt: Date,
) {
  return seenRepository.markSeen({ workspaceId, accountId, list }, seenAt);
}

afterAll(async () => {
  const inWorkspaces = { workspaceId: { in: workspacesWritten } };
  await prismaService.feedbackRequest.deleteMany({ where: inWorkspaces });
  await prismaService.feedback.deleteMany({ where: inWorkspaces });
  await prismaService.kudos.deleteMany({ where: inWorkspaces });
  await prismaService.listSeen.deleteMany({ where: inWorkspaces });
  await prismaService.$disconnect();
});

describe('counting what waits on a Member and what is new to them', () => {
  it('counts every Ask still waiting on them, and none they answered', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const request = await aRequest(workspaceId, ana, 2);
    await request.answer(0);

    const answered = await query.countsFor(workspaceId, request.giver(0));
    const waiting = await query.countsFor(workspaceId, request.giver(1));

    expect(answered.waitingAsks).toBe(0);
    expect(waiting.waitingAsks).toBe(1);
  });

  it('counts Asks from this Workspace only', async () => {
    const workspaceId = aWorkspace();
    const elsewhere = aWorkspace();
    const request = await aRequest(elsewhere, uuidv7(), 1);

    const counts = await query.countsFor(workspaceId, request.giver(0));

    expect(counts.waitingAsks).toBe(0);
  });

  it('counts everything in a kind they have never opened', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const request = await aRequest(workspaceId, ana, 2);
    await request.answer(0);
    await request.answer(1);
    await offeredTo(workspaceId, ana);
    await kudosNaming(workspaceId, ana);
    await kudosNaming(workspaceId);

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts).toEqual({
      waitingAsks: 0,
      newAnswers: 2,
      newOffered: 1,
      newKudos: 1,
      newShared: 0,
    });
  });

  it('counts Feedback somebody selected them to read, and none shared with everyone or with somebody else', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    await sharedWith(workspaceId, ana);
    await sharedWith(workspaceId, ana);
    await sharedWith(workspaceId, uuidv7());
    await forEveryone(workspaceId);
    await sharedWith(aWorkspace(), ana);

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newShared).toBe(2);
  });

  it('counts only what was shared with them after they opened Shared with me', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const before = await sharedWith(workspaceId, ana);
    const seenAt = await writtenAt('feedback', before);
    await opened(workspaceId, ana, 'SHARED_WITH_ME', seenAt);
    await writeLater('feedback', await sharedWith(workspaceId, ana), seenAt);
    await offeredTo(workspaceId, ana);

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newShared).toBe(1);
    expect(counts.newOffered).toBe(1);
  });

  it('counts only what came after they opened a kind, and leaves the other kinds as they were', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const before = await kudosNaming(workspaceId, ana);
    const seenAt = await writtenAt('kudos', before);
    await opened(workspaceId, ana, 'RECEIVED_KUDOS', seenAt);
    const later = await kudosNaming(workspaceId, ana);
    await writeLater('kudos', later, seenAt);
    await offeredTo(workspaceId, ana);

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newKudos).toBe(1);
    expect(counts.newOffered).toBe(1);
  });

  it('counts the answers to their requests since they last opened them, one for each answer', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const request = await aRequest(workspaceId, ana, 3);
    const first = await request.answer(0);
    const seenAt = await writtenAt('feedback', first);
    await opened(workspaceId, ana, 'RECEIVED_REQUESTS', seenAt);
    await writeLater('feedback', await request.answer(1), seenAt);
    await writeLater('feedback', await request.answer(2), seenAt);

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newAnswers).toBe(2);
  });

  it('counts an answer to a request its Requester shared with them under Shared with me', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const request = await aRequest(
      workspaceId,
      uuidv7(),
      2,
      Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds: [ana] }),
    );
    await request.answer(0);
    await request.answer(1);

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newShared).toBe(2);
  });

  it('reads a list opened in another Workspace as nothing opened here', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const kudos = await kudosNaming(workspaceId, ana);
    await opened(
      aWorkspace(),
      ana,
      'RECEIVED_KUDOS',
      await writtenAt('kudos', kudos),
    );

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newKudos).toBe(1);
  });

  it('records a list opened twice at once, as two tabs would, without failing', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const offered = await offeredTo(workspaceId, ana);
    const seenAt = await writtenAt('feedback', offered);

    await Promise.all(
      Array.from({ length: 5 }, () =>
        opened(workspaceId, ana, 'RECEIVED_OFFERED', seenAt),
      ),
    );

    expect((await query.countsFor(workspaceId, ana)).newOffered).toBe(0);
  });

  it('opens a kind again by moving the time it was opened, not by keeping the first', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const first = await offeredTo(workspaceId, ana);
    const second = await offeredTo(workspaceId, ana);
    const firstAt = await writtenAt('feedback', first);
    await writeLater('feedback', second, firstAt);
    await opened(workspaceId, ana, 'RECEIVED_OFFERED', firstAt);
    await opened(
      workspaceId,
      ana,
      'RECEIVED_OFFERED',
      await writtenAt('feedback', second),
    );

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newOffered).toBe(0);
  });

  it('reads what another Member opened as nothing of theirs', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    const offered = await offeredTo(workspaceId, ana);
    await opened(
      workspaceId,
      uuidv7(),
      'RECEIVED_OFFERED',
      await writtenAt('feedback', offered),
    );

    const counts = await query.countsFor(workspaceId, ana);

    expect(counts.newOffered).toBe(1);
  });

  it('never counts a row the list beside it would not show', async () => {
    const workspaceId = aWorkspace();
    const ana = uuidv7();
    await offeredTo(workspaceId, ana);
    await offeredTo(workspaceId, uuidv7());
    await kudosNaming(workspaceId, ana, uuidv7());
    await kudosNaming(workspaceId);
    await sharedWith(workspaceId, ana);
    await sharedWith(workspaceId, uuidv7());
    await forEveryone(workspaceId);
    const request = await aRequest(workspaceId, uuidv7(), 2);
    const giver = request.giver(0);
    const anasRequest = await aRequest(workspaceId, ana, 3);
    await anasRequest.answer(0);
    await anasRequest.answer(2);
    await (await aRequest(workspaceId, uuidv7(), 1)).answer(0);

    const anasCounts = await query.countsFor(workspaceId, ana);
    const giversCounts = await query.countsFor(workspaceId, giver);
    const offered = await requestQuery.offeredItemsTo(
      workspaceId,
      ana,
      FIRST_PAGE,
    );
    const kudos = await kudosQuery.onHome(workspaceId, FIRST_PAGE, ana);
    const sentRequests = await requestQuery.sentRequestItemsBy(
      workspaceId,
      ana,
      FIRST_PAGE,
    );
    const shared = await requestQuery.feedItemsFor(
      workspaceId,
      ana,
      'SHARED_WITH_ME',
      FIRST_PAGE,
    );
    const waiting = await requestQuery.waitingAsksFor(
      workspaceId,
      giver,
      'NEWEST',
      { afterId: null, limit: 20 },
    );

    expect(anasCounts.newOffered).toBe(offered.items.length);
    expect(anasCounts.newKudos).toBe(kudos.items.length);
    expect(anasCounts.newShared).toBe(shared.items.length);
    // My requests lists requests, each holding its answers, and counts the answers in them.
    expect(anasCounts.newAnswers).toBe(
      sentRequests.items
        .flatMap((item) => item.asks)
        .filter((ask) => ask.answer !== null).length,
    );
    expect(giversCounts.waitingAsks).toBe(waiting.items.length);
  });
});
