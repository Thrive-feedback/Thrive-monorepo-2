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

/** No Account and no Workspace is created first, as in the Received suite. */
async function feedbackFrom(
  workspaceId: string,
  giverAccountId: string,
  message: string,
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId,
      giverAccountId,
      receiverAccountIds: [uuidv7()],
      visibility: Visibility.onlyMe(),
      message: FeedbackMessage.of(message),
    }),
  );
  return id;
}

/** A request keeping what comes back to its Requester, which two Givers answer and a third has not. */
async function answersFrom(
  workspaceId: string,
  visibility = Visibility.onlyMe(),
) {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const giver = uuidv7();
  const other = uuidv7();
  const waiting = uuidv7();
  const askForGiver = uuidv7();
  const askForOther = uuidv7();
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId,
    requesterAccountId: uuidv7(),
    message: RequestMessage.of('How clear was the plan?'),
    visibility,
    tags: BoundTags.none(),
    givers: [
      { askId: askForGiver, giverAccountId: giver },
      { askId: askForOther, giverAccountId: other },
      { askId: uuidv7(), giverAccountId: waiting },
    ],
  });
  await requestRepository.save(request);
  for (const [askId, giverAccountId] of [
    [askForGiver, giver],
    [askForOther, other],
  ] as const) {
    const answer = request.answerAsk({
      askId,
      giverAccountId,
      feedbackId: uuidv7(),
      message: FeedbackMessage.of('The order of the steps was clear.'),
      tags: BoundTags.none(),
    });
    if (!answer) {
      throw new Error('The request does not hold the Ask.');
    }
    await requestRepository.saveAnswer(request, answer);
    written.push(answer.snapshot().id);
  }
  return { giver, other, waiting };
}

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading what a Member gave', () => {
  it('holds what they wrote, newest first, private Feedback among it', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const first = await feedbackFrom(workspaceId, ana, 'First.');
    const second = await feedbackFrom(workspaceId, ana, 'Second.');

    const page = await query.givenItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items.map((item) => item.id)).toEqual([second, first]);
    expect(page.items[0]?.visibility).toBe('ONLY_ME');
    expect(page.hasMore).toBe(false);
  });

  it('holds nothing somebody else wrote, or written in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await feedbackFrom(workspaceId, uuidv7(), 'From somebody else.');
    await feedbackFrom(uuidv7(), ana, 'Elsewhere.');

    const page = await query.givenItemsBy(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toEqual([]);
  });

  it('says of each Ask who may read its answer, once there is one', async () => {
    const workspaceId = uuidv7();
    const { giver, other, waiting } = await answersFrom(workspaceId);

    const page = await query.givenItemsBy(workspaceId, giver, FIRST_PAGE);

    expect(
      page.items[0]?.request?.asks.map((ask) => [
        ask.giverAccountId,
        ask.answerAudience,
      ]),
    ).toEqual([
      [giver, { visibility: 'ONLY_ME', selectedAccountIds: [] }],
      [other, { visibility: 'ONLY_ME', selectedAccountIds: [] }],
      [waiting, null],
    ]);
  });

  it('says who was chosen, for an answer shared with selected people', async () => {
    const workspaceId = uuidv7();
    const chosen = uuidv7();
    const { giver } = await answersFrom(
      workspaceId,
      Visibility.of({
        value: 'SELECTED_PEOPLE',
        selectedAccountIds: [chosen],
      }),
    );

    const page = await query.givenItemsBy(workspaceId, giver, FIRST_PAGE);

    expect(page.items[0]?.request?.asks[1]?.answerAudience).toEqual({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [chosen],
    });
  });

  it('reads past a place, repeating and skipping nothing', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const first = await feedbackFrom(workspaceId, ana, 'First.');
    const second = await feedbackFrom(workspaceId, ana, 'Second.');
    const third = await feedbackFrom(workspaceId, ana, 'Third.');

    const page = await query.givenItemsBy(workspaceId, ana, {
      after: await query.feedbackPositionOf(workspaceId, third),
      limit: 1,
    });
    const last = await query.givenItemsBy(workspaceId, ana, {
      after: await query.feedbackPositionOf(workspaceId, second),
      limit: 1,
    });

    expect(page.items.map((item) => item.id)).toEqual([second]);
    expect(page.hasMore).toBe(true);
    expect(last.items.map((item) => item.id)).toEqual([first]);
    expect(last.hasMore).toBe(false);
  });
});
