import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRepository } from '../repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from '../repository/prisma-feedback-request.repository';
import { PrismaFeedbackRequestQuery } from './prisma-feedback-request.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaFeedbackRepository(context);
const requestRepository = new PrismaFeedbackRequestRepository(context);
const query = new PrismaFeedbackRequestQuery(context);

const FIRST_PAGE = { after: null, limit: 20 };

const written: string[] = [];
const requestsWritten: string[] = [];

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a foreign
 * key. Every test takes a Workspace of its own, so it reads only what it wrote.
 */
async function feedbackTo(
  workspaceId: string,
  receiverAccountId: string,
  message: string,
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId,
      giverAccountId: uuidv7(),
      receiverAccountIds: [receiverAccountId],
      visibility: Visibility.onlyMe(),
      message: FeedbackMessage.of(message),
    }),
  );
  return id;
}

/** `requester` asks `count` people, keeping what comes back to themselves. */
async function sendRequest(
  workspaceId: string,
  requester: string,
  count: number,
  message = 'How clear was the plan?',
) {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const givers = Array.from({ length: count }, () => ({
    askId: uuidv7(),
    giverAccountId: uuidv7(),
  }));
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId,
    requesterAccountId: requester,
    message: RequestMessage.of(message),
    visibility: Visibility.onlyMe(),
    tags: BoundTags.none(),
    givers,
  });
  await requestRepository.save(request);
  return { request, givers };
}

/** The `place`th person a request asked answers it, now. */
async function answer(
  { request, givers }: Awaited<ReturnType<typeof sendRequest>>,
  place: number,
  message = 'The order of the steps was clear.',
): Promise<string> {
  const giver = givers[place];
  if (!giver) {
    throw new Error('The request did not ask that many people.');
  }
  const answered = request.answerAsk({
    ...giver,
    feedbackId: uuidv7(),
    message: FeedbackMessage.of(message),
    tags: BoundTags.none(),
  });
  if (!answered) {
    throw new Error('The request does not hold the Ask.');
  }
  await requestRepository.saveAnswer(request, answered);
  written.push(answered.snapshot().id);
  return answered.snapshot().id;
}

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading what a Member received', () => {
  it('holds what was written to them, newest first, private Feedback among it', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const first = await feedbackTo(workspaceId, ana, 'First.');
    const second = await feedbackTo(workspaceId, ana, 'Second.');

    const page = await query.offeredItemsTo(workspaceId, ana, FIRST_PAGE);

    expect(page.items.map((item) => item.id)).toEqual([second, first]);
    expect(page.items[0]?.visibility).toBe('ONLY_ME');
    expect(page.hasMore).toBe(false);
  });

  it('holds nothing written to somebody else, or in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await feedbackTo(workspaceId, uuidv7(), 'To somebody else.');
    await feedbackTo(uuidv7(), ana, 'Elsewhere.');

    const page = await query.offeredItemsTo(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toEqual([]);
  });

  it('leaves out an answer to their own request, which is inside the request', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await answer(await sendRequest(workspaceId, ana, 2), 0);

    const page = await query.offeredItemsTo(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toEqual([]);
  });

  it('reads past a place, repeating and skipping nothing', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const first = await feedbackTo(workspaceId, ana, 'First.');
    const second = await feedbackTo(workspaceId, ana, 'Second.');
    const third = await feedbackTo(workspaceId, ana, 'Third.');

    const page = await query.offeredItemsTo(workspaceId, ana, {
      after: await query.feedbackPositionOf(workspaceId, third),
      limit: 1,
    });
    const last = await query.offeredItemsTo(workspaceId, ana, {
      after: await query.feedbackPositionOf(workspaceId, second),
      limit: 1,
    });

    expect(page.items.map((item) => item.id)).toEqual([second]);
    expect(page.hasMore).toBe(true);
    expect(last.items.map((item) => item.id)).toEqual([first]);
    expect(last.hasMore).toBe(false);
  });
});

describe('reading the requests a Member sent, in their Received', () => {
  it('holds a request nobody has answered, at when it was sent, every Ask Pending', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const sent = await sendRequest(workspaceId, ana, 2);

    const page = await query.sentRequestItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toHaveLength(1);
    const [item] = page.items;
    expect(item).toMatchObject({
      id: sent.request.snapshot().id,
      message: 'How clear was the plan?',
      visibility: 'ONLY_ME',
      postcard: null,
      asks: sent.givers.map(({ giverAccountId }) => ({
        giverAccountId,
        status: 'PENDING',
        answer: null,
      })),
    });
    expect(item?.latestActivityAt).toEqual(item?.createdAt);
  });

  it('holds what some answered and that the rest are Pending, at its newest answer', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const sent = await sendRequest(workspaceId, ana, 3);
    await answer(sent, 0, 'First.');
    const newest = await answer(sent, 2, 'Third.');

    const page = await query.sentRequestItemsBy(workspaceId, ana, FIRST_PAGE);

    const [item] = page.items;
    expect(item?.asks.map((ask) => ask.status)).toEqual([
      'ANSWERED',
      'PENDING',
      'ANSWERED',
    ]);
    const third = item?.asks[2]?.answer;
    expect(third).toMatchObject({ id: newest, message: 'Third.' });
    expect(item?.latestActivityAt).toEqual(third?.answeredAt);
  });

  it('holds every answer once everybody has answered', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const sent = await sendRequest(workspaceId, ana, 2);
    await answer(sent, 0);
    await answer(sent, 1);

    const page = await query.sentRequestItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items[0]?.asks.every((ask) => ask.answer !== null)).toBe(true);
  });

  it('holds nothing somebody else asked, or asked in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await sendRequest(workspaceId, uuidv7(), 1);
    await sendRequest(uuidv7(), ana, 1);

    const page = await query.sentRequestItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toEqual([]);
  });

  it('puts a request answered since above one sent after it', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const older = await sendRequest(workspaceId, ana, 1, 'Older.');
    await sendRequest(workspaceId, ana, 1, 'Newer.');
    await answer(older, 0);

    const page = await query.sentRequestItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items.map((item) => item.message)).toEqual([
      'Older.',
      'Newer.',
    ]);
  });

  it('reads past the place a page ended, though a request read there has moved up since', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await sendRequest(workspaceId, ana, 1, 'First.');
    const second = await sendRequest(workspaceId, ana, 1, 'Second.');
    await sendRequest(workspaceId, ana, 1, 'Third.');

    const page = await query.sentRequestItemsBy(workspaceId, ana, {
      after: null,
      limit: 2,
    });
    const last = page.items.at(-1);
    if (!last) {
      throw new Error('The first page is empty.');
    }
    await answer(second, 0);
    const rest = await query.sentRequestItemsBy(workspaceId, ana, {
      after: { createdAt: last.latestActivityAt, id: last.id },
      limit: 2,
    });

    expect(page.items.map((item) => item.message)).toEqual([
      'Third.',
      'Second.',
    ]);
    expect(page.hasMore).toBe(true);
    expect(rest.items.map((item) => item.message)).toEqual(['First.']);
    expect(rest.hasMore).toBe(false);
  });
});
