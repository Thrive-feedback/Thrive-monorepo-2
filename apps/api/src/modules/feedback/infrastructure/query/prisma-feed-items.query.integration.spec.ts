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
const FIRST_PAGE = { afterId: null, limit: 20 };

const WORKSPACE_ID = uuidv7();
const OTHER_WORKSPACE_ID = uuidv7();
const ANA = uuidv7();
const BEN = uuidv7();
const CARA = uuidv7();
const DAN = uuidv7();

const written: string[] = [];
const requestsWritten: string[] = [];

const everyone = () =>
  Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] });
const selected = (...selectedAccountIds: string[]) =>
  Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds });

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
async function given(
  message: string,
  visibility: Visibility,
  people: {
    readonly giver?: string;
    readonly receiver?: string;
    readonly workspaceId?: string;
  } = {},
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId: people.workspaceId ?? WORKSPACE_ID,
      giverAccountId: people.giver ?? BEN,
      receiverAccountIds: [people.receiver ?? CARA],
      visibility,
      message: FeedbackMessage.of(message),
    }),
  );
  return id;
}

/** Cara asks Ben and Dan, shares what comes back with Ana, and Ben answers. */
async function givenAnAnswerSharedWithAna(): Promise<string> {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const askForBen = uuidv7();
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: CARA,
    message: RequestMessage.of('How clear was the migration plan?'),
    visibility: selected(ANA),
    tags: BoundTags.none(),
    givers: [
      { askId: askForBen, giverAccountId: BEN },
      { askId: uuidv7(), giverAccountId: DAN },
    ],
  });
  await requestRepository.save(request);
  const answer = request.answerAsk({
    askId: askForBen,
    giverAccountId: BEN,
    feedbackId: uuidv7(),
    message: FeedbackMessage.of('The order of the steps was clear.'),
    tags: BoundTags.none(),
  });
  if (!answer) {
    throw new Error('The request does not hold the Ask for Ben.');
  }
  await requestRepository.saveAnswer(request, answer);
  return answer.snapshot().id;
}

let toEveryone: string;
let aboutAna: string;
let selectsAna: string;
let answerSharedWithAna: string;

beforeAll(async () => {
  toEveryone = await given('the planning meeting', everyone());
  aboutAna = await given('the customer demo', everyone(), { receiver: ANA });
  selectsAna = await given('onboarding the designers', selected(ANA));
  answerSharedWithAna = await givenAnAnswerSharedWithAna();
  // None of these belongs on Ana's Home.
  await given('selected somebody else', selected(DAN));
  await given('written to Ana, for Dan too', selected(DAN), { receiver: ANA });
  await given('written by Ana, for Dan too', selected(DAN), { giver: ANA });
  await given('only them', Visibility.onlyMe(), { receiver: ANA });
  await given('another Workspace', everyone(), {
    workspaceId: OTHER_WORKSPACE_ID,
  });
});

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading Home', () => {
  it('holds Everyone and what selects the reader, newest first, and nothing else', async () => {
    const page = await query.feedItemsFor(WORKSPACE_ID, ANA, 'ALL', FIRST_PAGE);

    expect(page.items.map((item) => item.id)).toEqual([
      answerSharedWithAna,
      selectsAna,
      aboutAna,
      toEveryone,
    ]);
    expect(page.hasMore).toBe(false);
  });

  it('narrows to Everyone', async () => {
    const page = await query.feedItemsFor(
      WORKSPACE_ID,
      ANA,
      'EVERYONE',
      FIRST_PAGE,
    );

    expect(page.items.map((item) => item.id)).toEqual([aboutAna, toEveryone]);
    expect(page.items.map((item) => item.visibility)).toEqual([
      'EVERYONE',
      'EVERYONE',
    ]);
  });

  it('narrows to what the reader was selected for', async () => {
    const page = await query.feedItemsFor(
      WORKSPACE_ID,
      ANA,
      'SHARED_WITH_ME',
      FIRST_PAGE,
    );

    expect(page.items.map((item) => item.id)).toEqual([
      answerSharedWithAna,
      selectsAna,
    ]);
    expect(page.items.map((item) => item.visibility)).toEqual([
      'SELECTED_PEOPLE',
      'SELECTED_PEOPLE',
    ]);
  });

  it('gives an answer its question, who asked and every Ask, through the Ask it answers', async () => {
    const page = await query.feedItemsFor(
      WORKSPACE_ID,
      ANA,
      'SHARED_WITH_ME',
      FIRST_PAGE,
    );

    expect(page.items[0]?.request).toEqual({
      message: 'How clear was the migration plan?',
      tags: { workspaceGoals: [], mentions: [] },
      requesterAccountId: CARA,
      asks: [
        {
          giverAccountId: BEN,
          status: 'ANSWERED',
          answer: {
            message: 'The order of the steps was clear.',
            tags: { workspaceGoals: [], mentions: [] },
            answeredAt: expect.any(Date),
          },
        },
        { giverAccountId: DAN, status: 'PENDING', answer: null },
      ],
    });
    expect(page.items[1]?.request).toBeNull();
  });

  it('holds every answer of a request to one set of readers, so a card can show them all', async () => {
    const requestId = uuidv7();
    requestsWritten.push(requestId);
    const askForBen = uuidv7();
    const askForAna = uuidv7();
    const request = FeedbackRequest.send({
      id: requestId,
      workspaceId: WORKSPACE_ID,
      requesterAccountId: CARA,
      message: RequestMessage.of('How clear was the rollout?'),
      visibility: selected(DAN),
      tags: BoundTags.none(),
      givers: [
        { askId: askForBen, giverAccountId: BEN },
        { askId: askForAna, giverAccountId: ANA },
      ],
    });
    await requestRepository.save(request);
    const answerIds: string[] = [];
    for (const [askId, giverAccountId] of [
      [askForBen, BEN],
      [askForAna, ANA],
    ] as const) {
      const answer = request.answerAsk({
        askId,
        giverAccountId,
        feedbackId: uuidv7(),
        message: FeedbackMessage.of('It was clear.'),
        tags: BoundTags.none(),
      });
      if (!answer) {
        throw new Error('The request does not hold that Ask.');
      }
      await requestRepository.saveAnswer(request, answer);
      answerIds.push(answer.snapshot().id);
    }

    const [first, second] = await Promise.all(
      answerIds.map((id) => query.feedbackInWorkspace(WORKSPACE_ID, id)),
    );

    expect(first?.visibility).toBe('SELECTED_PEOPLE');
    expect(second?.visibility).toBe('SELECTED_PEOPLE');
    expect(first?.selectedAccountIds).toEqual([DAN]);
    expect(second?.selectedAccountIds).toEqual([DAN]);
  });

  it('pages by the row it stopped on, repeating and skipping nothing', async () => {
    const seen: string[] = [];
    let afterId: string | null = null;
    for (;;) {
      const page = await query.feedItemsFor(WORKSPACE_ID, ANA, 'ALL', {
        afterId,
        limit: 3,
      });
      seen.push(...page.items.map((item) => item.id));
      if (!page.hasMore) {
        break;
      }
      afterId = page.items.at(-1)?.id ?? null;
    }

    expect(seen).toEqual([
      answerSharedWithAna,
      selectsAna,
      aboutAna,
      toEveryone,
    ]);
  });

  it('holds nothing of another Workspace', async () => {
    const page = await query.feedItemsFor(
      OTHER_WORKSPACE_ID,
      ANA,
      'SHARED_WITH_ME',
      FIRST_PAGE,
    );

    expect(page.items).toEqual([]);
  });
});
