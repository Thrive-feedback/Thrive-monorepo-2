import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { Postcard } from '../../domain/value-object/postcard.vo';
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
  tags = BoundTags.none(),
) {
  const id = uuidv7();
  written.push(id);
  return Feedback.offer({
    tags,
    id,
    workspaceId,
    giverAccountId: uuidv7(),
    receiverAccountIds: [receiverAccountId],
    visibility,
    message: FeedbackMessage.of('You kept the room with you.'),
  });
}

afterAll(async () => {
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('storing Offered Feedback', () => {
  it('saves the postcard it was written on, and one piece reads it back equal', async () => {
    const workspaceId = uuidv7();
    const card = {
      templateKey: 'system/postcard_template_2',
      tone: 'sage',
      textStyle: { font: 'classic', sizeStep: 3, align: 'center', ink: 'navy' },
      stamps: [
        {
          stampKey: 'system/stamp-02-ocean',
          side: 'front',
          x: 62.5,
          y: 40,
          scale: 1.25,
          rotation: -8,
        },
      ],
    } as const;
    const id = uuidv7();
    written.push(id);
    await repository.save(
      Feedback.offer({
        tags: BoundTags.none(),
        id,
        workspaceId,
        giverAccountId: uuidv7(),
        receiverAccountIds: [uuidv7()],
        visibility: Visibility.onlyMe(),
        message: FeedbackMessage.of('You kept the room with you.'),
        postcard: Postcard.of(card),
      }),
    );

    const opened = await query.feedbackInWorkspace(workspaceId, id);

    expect(opened?.postcard).toEqual(card);
  });

  it('reads no postcard for Feedback that was not written on one', async () => {
    const workspaceId = uuidv7();
    const feedback = offered(workspaceId, uuidv7());
    await repository.save(feedback);

    const opened = await query.feedbackInWorkspace(
      workspaceId,
      feedback.snapshot().id,
    );

    expect(opened?.postcard).toBeNull();
  });

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
        giverAccountId: snapshot.giverAccountId,
        receiverAccountIds: [receiverAccountId],
        message: 'You kept the room with you.',
        tags: { workspaceGoals: [], mentions: [] },
        createdAt: expect.any(Date),
      },
    ]);
  });

  it('saves every Receiver in the order chosen, and each of them reads it', async () => {
    const workspaceId = uuidv7();
    const [first, second] = [uuidv7(), uuidv7()];
    const feedback = Feedback.offer({
      tags: BoundTags.none(),
      id: uuidv7(),
      workspaceId,
      giverAccountId: uuidv7(),
      receiverAccountIds: [second, first],
      visibility: Visibility.onlyMe(),
      message: FeedbackMessage.of('You two kept the demo calm.'),
    });
    written.push(feedback.snapshot().id);

    await repository.save(feedback);

    for (const reader of [first, second]) {
      const received = await query.receivedBy(workspaceId, reader, ONE_PAGE);
      expect(received.items.map((item) => item.receiverAccountIds)).toEqual([
        [second, first],
      ]);
    }
  });

  it('saves what its Giver named, which its Feedback message is read with', async () => {
    const workspaceId = uuidv7();
    const receiverAccountId = uuidv7();
    const named = {
      workspaceGoals: [{ name: 'ownership' }],
      mentions: [{ slug: 'cara.lee', displayName: 'Cara' }],
    };
    await repository.save(
      offered(
        workspaceId,
        receiverAccountId,
        Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] }),
        BoundTags.of({
          workspaceGoals: [{ workspaceGoalId: uuidv7(), name: 'ownership' }],
          mentions: [
            { accountId: uuidv7(), slug: 'cara.lee', displayName: 'Cara' },
          ],
        }),
      ),
    );

    const received = await query.receivedBy(
      workspaceId,
      receiverAccountId,
      ONE_PAGE,
    );
    expect(received.items[0]).toMatchObject({ tags: named });
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
      message: 'You kept the room with you.',
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: selected,
    });
  });
});
