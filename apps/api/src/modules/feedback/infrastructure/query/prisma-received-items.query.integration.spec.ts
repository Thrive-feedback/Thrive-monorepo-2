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

/** `requester` asks two people, keeping what comes back to themselves, and the first answers. */
async function answerTo(workspaceId: string, requester: string) {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const askForGiver = uuidv7();
  const giver = uuidv7();
  const other = uuidv7();
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId,
    requesterAccountId: requester,
    message: RequestMessage.of('How clear was the plan?'),
    visibility: Visibility.onlyMe(),
    tags: BoundTags.none(),
    givers: [
      { askId: askForGiver, giverAccountId: giver },
      { askId: uuidv7(), giverAccountId: other },
    ],
  });
  await requestRepository.save(request);
  const answer = request.answerAsk({
    askId: askForGiver,
    giverAccountId: giver,
    feedbackId: uuidv7(),
    message: FeedbackMessage.of('The order of the steps was clear.'),
    tags: BoundTags.none(),
  });
  if (!answer) {
    throw new Error('The request does not hold the Ask.');
  }
  await requestRepository.saveAnswer(request, answer);
  written.push(answer.snapshot().id);
  return { id: answer.snapshot().id, giver, other };
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

    const page = await query.receivedItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items.map((item) => item.id)).toEqual([second, first]);
    expect(page.items[0]?.visibility).toBe('ONLY_ME');
    expect(page.hasMore).toBe(false);
  });

  it('holds nothing written to somebody else, or in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await feedbackTo(workspaceId, uuidv7(), 'To somebody else.');
    await feedbackTo(uuidv7(), ana, 'Elsewhere.');

    const page = await query.receivedItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toEqual([]);
  });

  it('gives an answer its question and every Ask, through the Ask it answers', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const answer = await answerTo(workspaceId, ana);

    const page = await query.receivedItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: answer.id,
      origin: 'REQUESTED',
      postcard: null,
      request: {
        message: 'How clear was the plan?',
        requesterAccountId: ana,
        postcard: null,
        answerPostcard: null,
        asks: [
          {
            giverAccountId: answer.giver,
            answer: { message: 'The order of the steps was clear.' },
          },
          { giverAccountId: answer.other, answer: null },
        ],
      },
    });
  });

  it('reads past a place, repeating and skipping nothing', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const first = await feedbackTo(workspaceId, ana, 'First.');
    const second = await feedbackTo(workspaceId, ana, 'Second.');
    const third = await feedbackTo(workspaceId, ana, 'Third.');

    const page = await query.receivedItemsBy(workspaceId, ana, {
      after: await query.feedbackPositionOf(workspaceId, third),
      limit: 1,
    });
    const last = await query.receivedItemsBy(workspaceId, ana, {
      after: await query.feedbackPositionOf(workspaceId, second),
      limit: 1,
    });

    expect(page.items.map((item) => item.id)).toEqual([second]);
    expect(page.hasMore).toBe(true);
    expect(last.items.map((item) => item.id)).toEqual([first]);
    expect(last.hasMore).toBe(false);
  });
});
