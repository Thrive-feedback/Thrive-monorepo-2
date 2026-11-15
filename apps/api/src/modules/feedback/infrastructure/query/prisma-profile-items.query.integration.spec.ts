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
import {
  Visibility,
  type VisibilityValue,
} from '../../domain/value-object/visibility.vo';
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
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId,
      giverAccountId: uuidv7(),
      receiverAccountIds: [...receiverAccountIds],
      visibility: visibilityOf(visibility, selected),
      message: FeedbackMessage.of('The demo was clear.'),
    }),
  );
  return id;
}

/** `requester` asks one person, keeping what comes back as `visibility`, and is answered. */
async function answeredRequestOf(
  workspaceId: string,
  requester: string,
  visibility: VisibilityValue,
  selected?: readonly string[],
): Promise<string> {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const giver = { askId: uuidv7(), giverAccountId: uuidv7() };
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

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading the Feedback a Profile shows', () => {
  it('holds the Feedback everyone reads, offered or answering their request, newest first', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const offered = await offeredTo(workspaceId, [ana], 'EVERYONE');
    const answer = await answeredRequestOf(workspaceId, ana, 'EVERYONE');

    const page = await query.everyoneFeedbackTo(workspaceId, ana, FIRST_PAGE);

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

    const page = await query.everyoneFeedbackTo(workspaceId, ana, FIRST_PAGE);

    expect(page.items).toEqual([]);
  });

  it('holds Feedback for several people that names them second, and nothing for somebody else', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    const forBoth = await offeredTo(workspaceId, [uuidv7(), ana], 'EVERYONE');
    await offeredTo(workspaceId, [uuidv7()], 'EVERYONE');
    await offeredTo(uuidv7(), [ana], 'EVERYONE');

    const page = await query.everyoneFeedbackTo(workspaceId, ana, FIRST_PAGE);

    expect(page.items.map((item) => item.id)).toEqual([forBoth]);
  });

  it('says another page follows when there is one', async () => {
    const workspaceId = uuidv7();
    const ana = uuidv7();
    await offeredTo(workspaceId, [ana], 'EVERYONE');
    const newest = await offeredTo(workspaceId, [ana], 'EVERYONE');

    const page = await query.everyoneFeedbackTo(workspaceId, ana, {
      after: null,
      limit: 1,
    });

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
    );

    expect(page.items).toEqual([]);
  });
});
