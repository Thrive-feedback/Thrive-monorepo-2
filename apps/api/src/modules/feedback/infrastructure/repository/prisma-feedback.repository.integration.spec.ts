import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackBody } from '../../domain/value-object/feedback-body.vo';
import { Topic } from '../../domain/value-object/topic.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRequestQuery } from '../query/prisma-feedback-request.query';
import { PrismaFeedbackRepository } from './prisma-feedback.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaFeedbackRepository(context);
const query = new PrismaFeedbackRequestQuery(context);
const ONE_PAGE = { page: 1, pageSize: 20 };

const written: string[] = [];

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
function offered(
  workspaceId: string,
  receiverAccountId: string,
  visibility = Visibility.onlyMe(),
) {
  const id = uuidv7();
  written.push(id);
  return Feedback.offer({
    id,
    workspaceId,
    giverAccountId: uuidv7(),
    receiverAccountId,
    topic: Topic.of('the customer demo'),
    visibility,
    body: FeedbackBody.of('You kept the room with you.'),
  });
}

afterAll(async () => {
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('storing Offered Feedback', () => {
  it('saves it with no request, and its Receiver reads it as given without being asked', async () => {
    const workspaceId = uuidv7();
    const receiverAccountId = uuidv7();
    const feedback = offered(workspaceId, receiverAccountId);

    await repository.save(feedback);

    const received = await query.receivedBy(
      workspaceId,
      receiverAccountId,
      ONE_PAGE,
    );
    const snapshot = feedback.snapshot();
    expect(received.items).toEqual([
      {
        id: snapshot.id,
        origin: 'OFFERED',
        feedbackRequestId: null,
        topic: 'the customer demo',
        giverAccountId: snapshot.giverAccountId,
        body: 'You kept the room with you.',
        createdAt: expect.any(Date),
      },
    ]);
  });

  it('keeps the Visibility and the people selected, for one piece to be opened by', async () => {
    const workspaceId = uuidv7();
    const selected = [uuidv7(), uuidv7()].sort();
    const feedback = offered(
      workspaceId,
      uuidv7(),
      Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds: selected }),
    );

    await repository.save(feedback);

    const opened = await query.feedbackInWorkspace(
      workspaceId,
      feedback.snapshot().id,
    );
    expect(opened).toMatchObject({
      origin: 'OFFERED',
      feedbackRequestId: null,
      topic: 'the customer demo',
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: selected,
    });
  });
});
