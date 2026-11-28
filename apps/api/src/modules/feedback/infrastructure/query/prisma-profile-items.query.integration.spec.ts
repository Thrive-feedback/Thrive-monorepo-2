import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaClient } from '@app/infrastructure/database/generated/client';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaPg } from '@prisma/adapter-pg';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { Kudos } from '../../domain/entity/kudos.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import {
  Visibility,
  type VisibilityValue,
} from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRepository } from '../repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from '../repository/prisma-feedback-request.repository';
import { PrismaKudosRepository } from '../repository/prisma-kudos.repository';
import { PrismaFeedbackRequestQuery } from './prisma-feedback-request.query';
import { PrismaKudosQuery } from './prisma-kudos.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaFeedbackRepository(context);
const requestRepository = new PrismaFeedbackRequestRepository(context);
const query = new PrismaFeedbackRequestQuery(context);

const FIRST_PAGE = { after: null, limit: 20 };

const kudosRepository = new PrismaKudosRepository(context);
const kudosQuery = new PrismaKudosQuery(context);

const written: string[] = [];
const requestsWritten: string[] = [];
const kudosWritten: string[] = [];

/** A Visibility, with somebody picked for Selected people: `selected`, or a stranger. */
function visibilityOf(
  value: VisibilityValue,
  selected: readonly string[] = [uuidv7()],
): Visibility {
  return Visibility.of({
    value,
    selectedAccountIds: value === 'SELECTED_PEOPLE' ? [...selected] : [],
  });
}

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a foreign
 * key. Every test takes a Workspace of its own, so it reads only what it wrote.
 */
async function offeredTo(
  workspaceId: string,
  receiverAccountIds: readonly string[],
  visibility: VisibilityValue,
  selected?: readonly string[],
  giverAccountId: string = uuidv7(),
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId,
      giverAccountId,
      receiverAccountIds: [...receiverAccountIds],
      visibility: visibilityOf(visibility, selected),
      message: FeedbackMessage.of('The demo was clear.'),
    }),
  );
  return id;
}

/** `requester` asks one person, keeping what comes back as `visibility`; the Ask waits. */
async function askedOf(
  workspaceId: string,
  requester: string,
  visibility: VisibilityValue,
  selected?: readonly string[],
  giverAccountId: string = uuidv7(),
) {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const giver = { askId: uuidv7(), giverAccountId };
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId,
    requesterAccountId: requester,
    message: RequestMessage.of('How clear was the plan?'),
    visibility: visibilityOf(visibility, selected),
    tags: BoundTags.none(),
    givers: [giver],
  });
  await requestRepository.save(request);
  return { request, giver };
}

/** `requester` asks one person, keeping what comes back as `visibility`, and is answered. */
async function answeredRequestOf(
  workspaceId: string,
  requester: string,
  visibility: VisibilityValue,
  selected?: readonly string[],
  giverAccountId: string = uuidv7(),
): Promise<string> {
  const { request, giver } = await askedOf(
    workspaceId,
    requester,
    visibility,
    selected,
    giverAccountId,
  );
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
  written.push(answered.snapshot().id);
  return answered.snapshot().id;
}

/** `giver` gives a Kudos naming `recipients`. */
async function kudosFrom(
  workspaceId: string,
  giverAccountId: string,
  ...recipientAccountIds: string[]
): Promise<string> {
  const id = uuidv7();
  kudosWritten.push(id);
  await kudosRepository.save(
    Kudos.give({
      id,
      workspaceId,
      giverAccountId,
      message: KudosMessage.of('Thank you for the launch.'),
      tags: BoundTags.of({
        workspaceGoals: [],
        mentions: recipientAccountIds.map((accountId, index) => ({
          accountId,
          slug: `person-${index}`,
          displayName: `Person ${index}`,
        })),
      }),
      card: null,
    }),
  );
  return id;
}

/** Moves a piece of Feedback back to an instant, which only a test can choose. */
async function writtenAt(feedbackId: string, createdAt: string) {
  await prismaService.feedback.update({
    where: { id: feedbackId },
    data: { createdAt: new Date(createdAt) },
  });
}

/** Counts the queries one read sends, through a client that logs them. */
async function queriesOf(read: () => Promise<unknown>): Promise<number> {
  const counting = new PrismaClient({
    adapter: new PrismaPg({ connectionString: configuration.database.url }),
    log: [{ emit: 'event', level: 'query' }],
  });
  let queries = 0;
  counting.$on('query', () => {
    queries += 1;
  });
  await context.within(counting, read);
  await counting.$disconnect();
  return queries;
}

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.kudos.deleteMany({ where: { id: { in: kudosWritten } } });
  await prismaService.$disconnect();
});

describe('reading the Feedback a Profile shows', () => {
  it('holds the Feedback everyone reads, offered or answering their request, newest first', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const offered = await offeredTo(workspaceId, [ana], 'EVERYONE');
    const answer = await answeredRequestOf(workspaceId, ana, 'EVERYONE');

    const page = await query.everyoneFeedbackTo(
      workspaceId,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items.map((item) => [item.id, item.origin])).toEqual([
      [answer, 'REQUESTED'],
      [offered, 'OFFERED'],
    ]);
  });

  it('holds nothing kept to Only me or to Selected people', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await offeredTo(workspaceId, [ana], 'ONLY_ME');
    await offeredTo(workspaceId, [ana], 'SELECTED_PEOPLE');
    await answeredRequestOf(workspaceId, ana, 'ONLY_ME');
    await answeredRequestOf(workspaceId, ana, 'SELECTED_PEOPLE');

    const page = await query.everyoneFeedbackTo(
      workspaceId,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items).toEqual([]);
  });

  it('holds Feedback for several people that names them second, and nothing for somebody else', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const forBoth = await offeredTo(workspaceId, [uuidv7(), ana], 'EVERYONE');
    await offeredTo(workspaceId, [uuidv7()], 'EVERYONE');
    await offeredTo(uuidv7(), [ana], 'EVERYONE');

    const page = await query.everyoneFeedbackTo(
      workspaceId,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items.map((item) => item.id)).toEqual([forBoth]);
  });

  it('says another page follows when there is one', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await offeredTo(workspaceId, [ana], 'EVERYONE');
    const newest = await offeredTo(workspaceId, [ana], 'EVERYONE');

    const page = await query.everyoneFeedbackTo(
      workspaceId,
      ana,
      {
        after: null,
        limit: 1,
      },
      null,
    );

    expect([page.items.map((item) => item.id), page.hasMore]).toEqual([
      [newest],
      true,
    ]);
  });
});

describe('reading the Feedback a Profile shows as shared with its reader', () => {
  it('holds what somebody selected the reader to read, offered or answering a request, newest first', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    const offered = await offeredTo(workspaceId, [ana], 'SELECTED_PEOPLE', [
      reader,
    ]);
    const answer = await answeredRequestOf(
      workspaceId,
      ana,
      'SELECTED_PEOPLE',
      [reader],
    );

    const page = await query.sharedFeedbackTo(
      workspaceId,
      ana,
      reader,
      FIRST_PAGE,
      null,
    );

    expect(page.items.map((item) => [item.id, item.origin])).toEqual([
      [answer, 'REQUESTED'],
      [offered, 'OFFERED'],
    ]);
  });

  it('holds nothing everyone reads, nothing kept to Only me, and nothing that selects somebody else', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    await offeredTo(workspaceId, [ana], 'EVERYONE');
    await offeredTo(workspaceId, [ana], 'ONLY_ME');
    await offeredTo(workspaceId, [ana], 'SELECTED_PEOPLE', [uuidv7()]);
    await offeredTo(workspaceId, [uuidv7()], 'SELECTED_PEOPLE', [reader]);

    const page = await query.sharedFeedbackTo(
      workspaceId,
      ana,
      reader,
      FIRST_PAGE,
      null,
    );

    expect(page.items).toEqual([]);
  });
});

describe('reading the Feedback between a Profile’s reader and its Member', () => {
  it('holds what each wrote the other at every Visibility, answers among it, and what somebody wrote to both, newest first', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    const toAna = await offeredTo(
      workspaceId,
      [ana],
      'ONLY_ME',
      undefined,
      reader,
    );
    const toReader = await offeredTo(
      workspaceId,
      [uuidv7(), reader],
      'SELECTED_PEOPLE',
      undefined,
      ana,
    );
    const toBoth = await offeredTo(workspaceId, [reader, ana], 'EVERYONE');
    const readersAnswer = await answeredRequestOf(
      workspaceId,
      ana,
      'ONLY_ME',
      undefined,
      reader,
    );

    const page = await query.feedbackBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items.map((item) => item.id)).toEqual([
      readersAnswer,
      toBoth,
      toReader,
      toAna,
    ]);
  });

  it('holds nothing written to only one of them by somebody else, between others, or in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    await offeredTo(workspaceId, [ana], 'EVERYONE');
    await offeredTo(workspaceId, [reader], 'ONLY_ME');
    await offeredTo(workspaceId, [uuidv7()], 'EVERYONE', undefined, reader);
    await offeredTo(uuidv7(), [ana], 'EVERYONE', undefined, reader);

    const page = await query.feedbackBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items).toEqual([]);
  });

  it('says who may read the answer beside the reader’s own', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    await answeredRequestOf(workspaceId, ana, 'ONLY_ME', undefined, reader);

    const page = await query.feedbackBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(
      page.items[0]?.request?.asks.map((ask) => ask.answerAudience?.visibility),
    ).toEqual(['ONLY_ME']);
  });

  it('reads a page of one piece and a page of many in the same number of queries', async () => {
    const counting = new PrismaClient({
      adapter: new PrismaPg({ connectionString: configuration.database.url }),
      log: [{ emit: 'event', level: 'query' }],
    });
    let queries = 0;
    counting.$on('query', () => {
      queries += 1;
    });
    const queriesFor = async (pieces: number) => {
      const workspaceId = uuidv7();
      const ana = uuidv7();
      const reader = uuidv7();
      for (let piece = 0; piece < pieces; piece += 1) {
        await answeredRequestOf(
          workspaceId,
          ana,
          'EVERYONE',
          undefined,
          reader,
        );
      }
      queries = 0;
      await context.within(counting, () =>
        query.feedbackBetween(workspaceId, reader, ana, FIRST_PAGE, null),
      );
      return queries;
    };

    const [one, many] = [await queriesFor(1), await queriesFor(8)];
    await counting.$disconnect();

    expect(many).toBe(one);
  });
});

describe('reading the Asks waiting between a Profile’s reader and its Member', () => {
  it('holds the Asks either of them sent the other that still wait, newest first', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    const anaAsked = await askedOf(
      workspaceId,
      ana,
      'ONLY_ME',
      undefined,
      reader,
    );
    const readerAsked = await askedOf(
      workspaceId,
      reader,
      'EVERYONE',
      undefined,
      ana,
    );

    const page = await query.pendingAsksBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
    );

    expect(
      page.items.map((item) => [
        item.id,
        item.requesterAccountId,
        item.giverAccountId,
      ]),
    ).toEqual([
      [readerAsked.giver.askId, reader, ana],
      [anaAsked.giver.askId, ana, reader],
    ]);
  });

  it('holds no Ask once answered, none somebody else sent, and none in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    await answeredRequestOf(workspaceId, ana, 'EVERYONE', undefined, reader);
    await askedOf(workspaceId, uuidv7(), 'EVERYONE', undefined, ana);
    await askedOf(uuidv7(), ana, 'EVERYONE', undefined, reader);

    const page = await query.pendingAsksBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
    );

    expect(page.items).toEqual([]);
  });

  it('still finds where an Ask sits once it has been answered', async () => {
    const workspaceId = uuidv7();
    const { request, giver } = await askedOf(workspaceId, uuidv7(), 'EVERYONE');
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
    written.push(answered.snapshot().id);

    const position = await query.askPositionOf(workspaceId, giver.askId);

    expect(position?.id).toBe(giver.askId);
  });
});

describe('reading the Kudos between a Profile’s reader and its Member', () => {
  it('holds the Kudos either gave the other, and those somebody gave naming both, newest first', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    const toAna = await kudosFrom(workspaceId, reader, ana);
    const toReader = await kudosFrom(workspaceId, ana, reader, uuidv7());
    const toBoth = await kudosFrom(workspaceId, uuidv7(), reader, ana);

    const page = await kudosQuery.kudosBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items.map((item) => item.id)).toEqual([
      toBoth,
      toReader,
      toAna,
    ]);
  });

  it('holds no Kudos naming only one of them by somebody else, none between others, and none in another Workspace', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    await kudosFrom(workspaceId, uuidv7(), ana);
    await kudosFrom(workspaceId, reader, uuidv7());
    await kudosFrom(uuidv7(), reader, ana);

    const page = await kudosQuery.kudosBetween(
      workspaceId,
      reader,
      ana,
      FIRST_PAGE,
      null,
    );

    expect(page.items).toEqual([]);
  });

  it('reads a page of one Kudos and a page of many in the same number of queries', async () => {
    const queriesFor = async (pieces: number) => {
      const workspaceId = uuidv7();
      const ana = uuidv7();
      const reader = uuidv7();
      for (let piece = 0; piece < pieces; piece += 1) {
        await kudosFrom(workspaceId, reader, ana);
      }
      return queriesOf(() =>
        kudosQuery.kudosBetween(workspaceId, reader, ana, FIRST_PAGE, null),
      );
    };

    const [one, many] = [await queriesFor(1), await queriesFor(8)];

    expect(many).toBe(one);
  });
});

describe('reading a Profile’s lists from an instant on', () => {
  it('keeps what was written at or after the instant, between the two and to everyone alike', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    const before = await offeredTo(
      workspaceId,
      [ana],
      'EVERYONE',
      undefined,
      reader,
    );
    await writtenAt(before, '2026-01-01T00:00:00.000Z');
    const after = await offeredTo(
      workspaceId,
      [ana],
      'EVERYONE',
      undefined,
      reader,
    );
    const since = new Date('2026-06-01T00:00:00.000Z');

    const [between, everyone] = await Promise.all([
      query.feedbackBetween(workspaceId, reader, ana, FIRST_PAGE, since),
      query.everyoneFeedbackTo(workspaceId, ana, FIRST_PAGE, since),
    ]);

    expect([
      between.items.map((item) => item.id),
      everyone.items.map((item) => item.id),
    ]).toEqual([[after], [after]]);
  });
});

describe('counting a Profile’s lists', () => {
  it('counts each list as it reads, from an instant on, and every Ask still open', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const reader = uuidv7();
    const old = await offeredTo(
      workspaceId,
      [ana],
      'ONLY_ME',
      undefined,
      reader,
    );
    await writtenAt(old, '2026-01-01T00:00:00.000Z');
    await offeredTo(workspaceId, [ana], 'EVERYONE', undefined, reader);
    await offeredTo(workspaceId, [ana], 'SELECTED_PEOPLE', [reader]);
    await askedOf(workspaceId, ana, 'ONLY_ME', undefined, reader);
    await kudosFrom(workspaceId, reader, ana);
    const since = new Date('2026-06-01T00:00:00.000Z');

    const [feedback, kudos] = await Promise.all([
      query.profileCounts(workspaceId, reader, ana, since),
      kudosQuery.profileCounts(workspaceId, reader, ana, since),
    ]);

    expect([feedback, kudos]).toEqual([
      {
        everyoneFeedback: 1,
        sharedFeedback: 1,
        feedbackBetween: 1,
        openAsks: 1,
      },
      { naming: 1, between: 1 },
    ]);
  });

  it('counts only what everyone sees when there is no reader to count for', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await offeredTo(workspaceId, [ana], 'EVERYONE');
    await askedOf(workspaceId, ana, 'ONLY_ME');

    const counts = await query.profileCounts(workspaceId, null, ana, null);

    expect(counts).toEqual({
      everyoneFeedback: 1,
      sharedFeedback: 0,
      feedbackBetween: 0,
      openAsks: 0,
    });
  });
});
