import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
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
const ONE_PAGE = { page: 1, pageSize: 20 };

const WORKSPACE_ID = uuidv7();
const OTHER_WORKSPACE_ID = uuidv7();
const BEN = uuidv7();
const CARA = uuidv7();
const DAN = uuidv7();

const written: string[] = [];
const requestsWritten: string[] = [];

const everyone = () =>
  Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] });

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
async function given(
  workspaceId: string,
  message: string,
  visibility: Visibility,
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId,
      giverAccountId: BEN,
      receiverAccountIds: [CARA],
      visibility,
      message: FeedbackMessage.of(message),
    }),
  );
  return id;
}

let olderPublic: string;
let newerPublic: string;

beforeAll(async () => {
  olderPublic = await given(WORKSPACE_ID, 'the planning meeting', everyone());
  newerPublic = await given(WORKSPACE_ID, 'the customer demo', everyone());
  await given(WORKSPACE_ID, 'the release notes', Visibility.onlyMe());
  await given(
    WORKSPACE_ID,
    'onboarding the new designers',
    Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds: [DAN] }),
  );
  await given(OTHER_WORKSPACE_ID, 'another Workspace entirely', everyone());
});

/**
 * A request set to Everyone asking Cara and then Dan, answered by Cara alone: the answer is what
 * reaches the feed, and it names everyone the request asked.
 */
async function givenAnAnsweredRequest(workspaceId: string): Promise<string> {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const askForCara = uuidv7();
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId,
    requesterAccountId: BEN,
    message: RequestMessage.of('the planning meeting'),
    visibility: everyone(),
    tags: BoundTags.none(),
    givers: [
      { askId: askForCara, giverAccountId: CARA },
      { askId: uuidv7(), giverAccountId: DAN },
    ],
  });
  await requestRepository.save(request);
  const answer = request.answerAsk({
    askId: askForCara,
    giverAccountId: CARA,
    feedbackId: uuidv7(),
    message: FeedbackMessage.of('You kept everyone with you.'),
    tags: BoundTags.none(),
  });
  if (!answer) {
    throw new Error('The request does not hold the Ask for Cara.');
  }
  await requestRepository.saveAnswer(request, answer);
  return answer.snapshot().id;
}

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading the Workspace feed', () => {
  it('returns everything set to Everyone, newest first, with both people', async () => {
    const feed = await query.publicIn(WORKSPACE_ID, ONE_PAGE);

    expect(feed.total).toBe(2);
    expect(feed.items.map((feedback) => feedback.id)).toEqual([
      newerPublic,
      olderPublic,
    ]);
    expect(feed.items[0]).toEqual({
      id: newerPublic,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: BEN,
      receiverAccountIds: [CARA],
      message: 'the customer demo',
      tags: { workspaceGoals: [], mentions: [] },
      createdAt: expect.any(Date),
      request: null,
    });
  });

  it('gives an answer the request it responds to, naming everyone asked in the order they were asked', async () => {
    const workspaceId = uuidv7();
    const answerId = await givenAnAnsweredRequest(workspaceId);

    const feed = await query.publicIn(workspaceId, ONE_PAGE);

    expect(
      feed.items.map((feedback) => [feedback.id, feedback.request]),
    ).toEqual([
      [
        answerId,
        {
          message: 'the planning meeting',
          tags: { workspaceGoals: [], mentions: [] },
          requesterAccountId: BEN,
          askedAccountIds: [CARA, DAN],
        },
      ],
    ]);
  });

  it('leaves out Only me and Selected people, whoever asked', async () => {
    const feed = await query.publicIn(WORKSPACE_ID, ONE_PAGE);

    const messages = feed.items.map((feedback) => feedback.message);
    expect(messages).not.toContain('the release notes');
    expect(messages).not.toContain('onboarding the new designers');
  });

  it('leaves out another Workspace’s feed', async () => {
    const feed = await query.publicIn(WORKSPACE_ID, ONE_PAGE);

    expect(feed.items.map((feedback) => feedback.message)).not.toContain(
      'another Workspace entirely',
    );
  });

  it('is empty in a Workspace where nothing was shared with everyone', async () => {
    const feed = await query.publicIn(uuidv7(), ONE_PAGE);

    expect(feed).toEqual({ items: [], total: 0 });
  });

  it('counts the whole feed, and pages through it in order', async () => {
    const first = await query.publicIn(WORKSPACE_ID, { page: 1, pageSize: 1 });
    const second = await query.publicIn(WORKSPACE_ID, { page: 2, pageSize: 1 });

    expect([first.total, second.total]).toEqual([2, 2]);
    expect(first.items.map((feedback) => feedback.id)).toEqual([newerPublic]);
    expect(second.items.map((feedback) => feedback.id)).toEqual([olderPublic]);
  });
});
