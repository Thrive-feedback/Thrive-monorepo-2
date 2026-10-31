import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRequestRepository } from '../repository/prisma-feedback-request.repository';
import { PrismaFeedbackRequestQuery } from './prisma-feedback-request.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const requestRepository = new PrismaFeedbackRequestRepository(context);
const query = new PrismaFeedbackRequestQuery(context);

const ANA = uuidv7();
const BEN = uuidv7();

const workspacesWritten: string[] = [];
const requestsWritten: string[] = [];

/** Ana asks Ben, one request after another, so each Ask is newer than the last. */
async function givenAnAsk(workspaceId: string, message: string) {
  const id = uuidv7();
  requestsWritten.push(id);
  const askId = uuidv7();
  const request = FeedbackRequest.send({
    id,
    workspaceId,
    requesterAccountId: ANA,
    message: RequestMessage.of(message),
    visibility: Visibility.of({ value: 'ONLY_ME', selectedAccountIds: [] }),
    tags: BoundTags.none(),
    givers: [{ askId, giverAccountId: BEN }],
  });
  await requestRepository.save(request);
  return {
    askId,
    answer: async () => {
      const answer = request.answerAsk({
        askId,
        giverAccountId: BEN,
        feedbackId: uuidv7(),
        message: FeedbackMessage.of('Answered.'),
        tags: BoundTags.none(),
      });
      if (!answer) {
        throw new Error('The request does not hold this Ask.');
      }
      await requestRepository.saveAnswer(request, answer);
    },
  };
}

/** Four Asks in a Workspace of their own, First the oldest. */
async function fourAsks() {
  const workspaceId = uuidv7();
  workspacesWritten.push(workspaceId);
  const first = await givenAnAsk(workspaceId, 'First');
  const second = await givenAnAsk(workspaceId, 'Second');
  const third = await givenAnAsk(workspaceId, 'Third');
  const fourth = await givenAnAsk(workspaceId, 'Fourth');
  return { workspaceId, first, second, third, fourth };
}

const page = (
  workspaceId: string,
  afterId: string | null,
  sort: 'NEWEST' | 'OLDEST' = 'NEWEST',
  limit = 2,
) => query.waitingAsksFor(workspaceId, BEN, sort, { afterId, limit });

const messagesOf = (read: Awaited<ReturnType<typeof page>>) =>
  read.items.map((ask) => ask.message);

afterAll(async () => {
  await prismaService.feedback.deleteMany({
    where: { workspaceId: { in: workspacesWritten } },
  });
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.$disconnect();
});

describe('PrismaFeedbackRequestQuery.waitingAsksFor', () => {
  it('reads newest first, and says another page follows', async () => {
    const { workspaceId } = await fourAsks();

    const read = await page(workspaceId, null);

    expect(messagesOf(read)).toEqual(['Fourth', 'Third']);
    expect(read.hasMore).toBe(true);
  });

  it('starts after the cursor, and ends on the last page', async () => {
    const { workspaceId, third } = await fourAsks();

    const read = await page(workspaceId, third.askId);

    expect(messagesOf(read)).toEqual(['Second', 'First']);
    expect(read.hasMore).toBe(false);
  });

  it('reads oldest first when asked, and starts after the cursor in that order', async () => {
    const { workspaceId, second } = await fourAsks();

    const read = await page(workspaceId, null, 'OLDEST');
    const next = await page(workspaceId, second.askId, 'OLDEST');

    expect(messagesOf(read)).toEqual(['First', 'Second']);
    expect(read.hasMore).toBe(true);
    expect(messagesOf(next)).toEqual(['Third', 'Fourth']);
    expect(next.hasMore).toBe(false);
  });

  it('loses no Ask when the one the cursor names was answered meanwhile', async () => {
    const { workspaceId, third } = await fourAsks();
    await third.answer();

    const read = await page(workspaceId, third.askId);

    expect(messagesOf(read)).toEqual(['Second', 'First']);
  });

  it('loses no Ask in oldest first either', async () => {
    const { workspaceId, first } = await fourAsks();
    await first.answer();

    const read = await page(workspaceId, first.askId, 'OLDEST');

    expect(messagesOf(read)).toEqual(['Second', 'Third']);
    expect(read.hasMore).toBe(true);
  });

  it('leaves out what was answered', async () => {
    const { workspaceId, fourth, second } = await fourAsks();
    await fourth.answer();
    await second.answer();

    expect(messagesOf(await page(workspaceId, null, 'NEWEST', 10))).toEqual([
      'Third',
      'First',
    ]);
  });

  it('holds only what waits in this Workspace', async () => {
    const { workspaceId } = await fourAsks();
    const another = uuidv7();
    workspacesWritten.push(another);
    await givenAnAsk(another, 'Elsewhere');

    expect(messagesOf(await page(another, null))).toEqual(['Elsewhere']);
    expect(messagesOf(await page(workspaceId, null, 'NEWEST', 10))).toEqual([
      'Fourth',
      'Third',
      'Second',
      'First',
    ]);
  });
});
