import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
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

const WORKSPACE_ID = uuidv7();
const ANA = uuidv7();
const BEN = uuidv7();

const requestsWritten: string[] = [];
const held = new Map<string, FeedbackRequest>();

/** Ana asks Ben, one request after another, so each Ask is newer than the last. */
async function givenAnAsk(message: string): Promise<string> {
  const id = uuidv7();
  requestsWritten.push(id);
  const askId = uuidv7();
  const request = FeedbackRequest.send({
    id,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: ANA,
    message: RequestMessage.of(message),
    visibility: Visibility.of({ value: 'ONLY_ME', selectedAccountIds: [] }),
    tags: BoundTags.none(),
    givers: [{ askId, giverAccountId: BEN }],
  });
  await requestRepository.save(request);
  held.set(askId, request);
  return askId;
}

async function benAnswers(askId: string) {
  const request = held.get(askId);
  const answer = request?.answerAsk({
    askId,
    giverAccountId: BEN,
    feedbackId: uuidv7(),
    message: FeedbackMessage.of('Answered.'),
    tags: BoundTags.none(),
  });
  if (!request || !answer) {
    throw new Error('The test holds no such Ask.');
  }
  await requestRepository.saveAnswer(request, answer);
}

const page = (
  afterId: string | null,
  limit = 2,
  sort: 'NEWEST' | 'OLDEST' = 'NEWEST',
) => query.waitingAsksFor(WORKSPACE_ID, BEN, sort, { afterId, limit });
const messagesOf = (read: Awaited<ReturnType<typeof page>>) =>
  read.items.map((ask) => ask.message);

let first: string;
let second: string;
let third: string;
let fourth: string;

beforeAll(async () => {
  first = await givenAnAsk('First');
  second = await givenAnAsk('Second');
  third = await givenAnAsk('Third');
  fourth = await givenAnAsk('Fourth');
});

afterAll(async () => {
  await prismaService.feedback.deleteMany({
    where: { workspaceId: WORKSPACE_ID },
  });
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.$disconnect();
});

describe('PrismaFeedbackRequestQuery.waitingAsksFor', () => {
  it('reads newest first, and says another page follows', async () => {
    const read = await page(null);

    expect(messagesOf(read)).toEqual(['Fourth', 'Third']);
    expect(read.hasMore).toBe(true);
  });

  it('starts after the cursor, and ends on the last page', async () => {
    const read = await page(third);

    expect(messagesOf(read)).toEqual(['Second', 'First']);
    expect(read.hasMore).toBe(false);
  });

  it('reads oldest first when asked, and starts after the cursor in that order', async () => {
    const read = await page(null, 2, 'OLDEST');
    const next = await page(second, 2, 'OLDEST');

    expect(messagesOf(read)).toEqual(['First', 'Second']);
    expect(read.hasMore).toBe(true);
    expect(messagesOf(next)).toEqual(['Third', 'Fourth']);
    expect(next.hasMore).toBe(false);
  });

  it('loses no Ask when the one the cursor names was answered meanwhile', async () => {
    await benAnswers(third);

    const read = await page(third);

    expect(messagesOf(read)).toEqual(['Second', 'First']);
  });

  it('loses no Ask in oldest first either', async () => {
    await benAnswers(first);

    const read = await page(first, 2, 'OLDEST');

    expect(messagesOf(read)).toEqual(['Second', 'Fourth']);
  });

  it('leaves out what was answered', async () => {
    await benAnswers(fourth);

    expect(messagesOf(await page(null, 10))).toEqual(['Second']);
  });
});
