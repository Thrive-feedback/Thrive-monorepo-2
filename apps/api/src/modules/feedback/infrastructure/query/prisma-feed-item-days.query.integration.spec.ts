import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import type { FeedItemShow } from '../../application/types/feedback-request.types';
import type { FeedPosition } from '../../application/types/kudos.types';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { Kudos } from '../../domain/entity/kudos.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import type { InstantRange } from '../../domain/value-object/calendar-clock.vo';
import {
  CalendarDay,
  type FeedbackMoment,
  RecentDays,
} from '../../domain/value-object/calendar-day.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRepository } from '../repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from '../repository/prisma-feedback-request.repository';
import { PrismaKudosRepository } from '../repository/prisma-kudos.repository';
import { PrismaFeedbackRequestQuery } from './prisma-feedback-request.query';
import { PrismaKudosQuery } from './prisma-kudos.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const feedbackRepository = new PrismaFeedbackRepository(context);
const requestRepository = new PrismaFeedbackRequestRepository(context);
const kudosRepository = new PrismaKudosRepository(context);
const feedbackQuery = new PrismaFeedbackRequestQuery(context);
const kudosQuery = new PrismaKudosQuery(context);

const WORKSPACE_ID = uuidv7();
const OTHER_WORKSPACE_ID = uuidv7();
const ANA = uuidv7();
const BEN = uuidv7();
const CARA = uuidv7();
const DAN = uuidv7();
const SHOWS: readonly FeedItemShow[] = ['ALL', 'EVERYONE', 'SHARED_WITH_ME'];

const feedbackWritten: string[] = [];
const requestsWritten: string[] = [];
const kudosWritten: string[] = [];

/** A small page, so the list has to be read across several of them, as Home reads it. */
const PAGE_SIZE = 2;

const everyone = () =>
  Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] });
const selected = (...selectedAccountIds: string[]) =>
  Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds });

/** Today and the six days before it, as the use case counts them. */
const lastWeek = RecentDays.endingOn(CalendarDay.containing(new Date()), 7);
const within: InstantRange = lastWeek.range();

/** An instant some whole days before now, at the hour now is. */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function moveFeedback(id: string, createdAt: Date) {
  await prismaService.feedback.update({ where: { id }, data: { createdAt } });
}

/** Offered Feedback from Ben to someone, given `daysBack` days ago. */
async function given(
  visibility: Visibility,
  daysBack: number,
  people: { readonly receiver?: string; readonly workspaceId?: string } = {},
) {
  const id = uuidv7();
  feedbackWritten.push(id);
  await feedbackRepository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId: people.workspaceId ?? WORKSPACE_ID,
      giverAccountId: BEN,
      receiverAccountIds: [people.receiver ?? CARA],
      visibility,
      message: FeedbackMessage.of(`Given ${daysBack} days ago.`),
    }),
  );
  await moveFeedback(id, daysAgo(daysBack));
}

/** Cara asks Ben, shares what comes back with Ana, and Ben answers `daysBack` days ago. */
async function givenAnAnswerSharedWithAna(daysBack: number) {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const askForBen = uuidv7();
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: CARA,
    message: RequestMessage.of('How clear was the plan?'),
    visibility: selected(ANA),
    tags: BoundTags.none(),
    givers: [{ askId: askForBen, giverAccountId: BEN }],
  });
  await requestRepository.save(request);
  const answer = request.answerAsk({
    askId: askForBen,
    giverAccountId: BEN,
    feedbackId: uuidv7(),
    message: FeedbackMessage.of('It was clear.'),
    tags: BoundTags.none(),
  });
  if (!answer) {
    throw new Error('The request does not hold the Ask for Ben.');
  }
  await requestRepository.saveAnswer(request, answer);
  await moveFeedback(answer.snapshot().id, daysAgo(daysBack));
}

async function givenKudos(daysBack: number, workspaceId = WORKSPACE_ID) {
  const id = uuidv7();
  kudosWritten.push(id);
  await kudosRepository.save(
    Kudos.give({
      id,
      workspaceId,
      giverAccountId: BEN,
      message: KudosMessage.of(`Kudos from ${daysBack} days ago`),
      tags: BoundTags.none(),
      card: null,
    }),
  );
  await prismaService.kudos.update({
    where: { id },
    data: { createdAt: daysAgo(daysBack) },
  });
}

/** Every page of the list, read the way Home reads it, and the kept rows' moments. */
async function theWholeList(show: FeedItemShow) {
  const feedback: FeedbackMoment[] = [];
  let after: FeedPosition | null = null;
  for (;;) {
    const page = await feedbackQuery.feedItemsFor(WORKSPACE_ID, ANA, show, {
      after,
      limit: PAGE_SIZE,
    });
    feedback.push(
      ...page.items.map(({ origin, createdAt }) => ({ origin, createdAt })),
    );
    const last = page.items.at(-1);
    if (!page.hasMore || last === undefined) {
      break;
    }
    after = { id: last.id, createdAt: last.createdAt };
  }
  const kudos: Date[] = [];
  if (show !== 'SHARED_WITH_ME') {
    let kudosAfter: FeedPosition | null = null;
    for (;;) {
      const page = await kudosQuery.onHome(
        WORKSPACE_ID,
        { after: kudosAfter, limit: PAGE_SIZE },
        null,
      );
      kudos.push(...page.items.map((row) => row.createdAt));
      const last = page.items.at(-1);
      if (!page.hasMore || last === undefined) {
        break;
      }
      kudosAfter = { id: last.id, createdAt: last.createdAt };
    }
  }
  return { feedback, kudos };
}

beforeAll(async () => {
  await given(everyone(), 0);
  await given(everyone(), 2, { receiver: ANA });
  await given(selected(ANA), 1);
  await givenAnAnswerSharedWithAna(3);
  // Outside the week: in the list, never in the count.
  await given(everyone(), 9);
  // Never on Ana's Home, so never in her count.
  await given(selected(DAN), 1);
  await given(Visibility.onlyMe(), 1, { receiver: ANA });
  await given(everyone(), 1, { workspaceId: OTHER_WORKSPACE_ID });
  await givenKudos(0);
  await givenKudos(5);
  await givenKudos(8);
  await givenKudos(0, OTHER_WORKSPACE_ID);
});

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({
    where: { workspaceId: { in: [WORKSPACE_ID, OTHER_WORKSPACE_ID] } },
  });
  await prismaService.kudos.deleteMany({ where: { id: { in: kudosWritten } } });
  await prismaService.$disconnect();
});

describe("counting Home's last seven days", () => {
  for (const show of SHOWS) {
    it(`counts exactly the list's rows under ${show}, day by day`, async () => {
      const list = await theWholeList(show);
      const [feedback, kudos] = await Promise.all([
        feedbackQuery.feedItemMomentsIn(WORKSPACE_ID, ANA, show, within),
        show === 'SHARED_WITH_ME'
          ? Promise.resolve([])
          : kudosQuery.onHomeMomentsIn(WORKSPACE_ID, within),
      ]);

      expect(lastWeek.count(feedback, kudos)).toEqual(
        lastWeek.count(list.feedback, list.kudos),
      );
    });
  }

  it('reads only the days asked for, in this Workspace, that the reader may read', async () => {
    const feedback = await feedbackQuery.feedItemMomentsIn(
      WORKSPACE_ID,
      ANA,
      'ALL',
      within,
    );
    const kudos = await kudosQuery.onHomeMomentsIn(WORKSPACE_ID, within);

    expect(feedback.map((moment) => moment.origin).sort()).toEqual([
      'OFFERED',
      'OFFERED',
      'OFFERED',
      'REQUESTED',
    ]);
    expect(kudos).toHaveLength(2);
  });
});
