import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { Topic } from '../../domain/value-object/topic.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRequestRepository } from './prisma-feedback-request.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const repository = new PrismaFeedbackRequestRepository(
  new PrismaTransactionContext(prismaService),
);

const written: string[] = [];

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
function aRequest(workspaceId: string, requesterAccountId: string) {
  const id = uuidv7();
  written.push(id);
  return FeedbackRequest.send({
    id,
    workspaceId,
    requesterAccountId,
    topic: Topic.of('my presentation skills'),
    visibility: Visibility.onlyMe(),
    givers: [{ askId: uuidv7(), giverAccountId: uuidv7() }],
  });
}

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: written } },
  });
  await prismaService.$disconnect();
});

describe('storing a Feedback Request', () => {
  it('saves the request with its Asks and reads both back', async () => {
    const workspaceId = uuidv7();
    const request = aRequest(workspaceId, uuidv7());

    await repository.save(request);

    const found = await repository.findInWorkspace(
      workspaceId,
      request.snapshot().id,
    );
    expect(found?.snapshot()).toEqual(request.snapshot());
  });

  it("does not find a request through another Workspace's id", async () => {
    const request = aRequest(uuidv7(), uuidv7());
    await repository.save(request);

    const found = await repository.findInWorkspace(
      uuidv7(),
      request.snapshot().id,
    );

    expect(found).toBeNull();
  });

  it('refuses the same Giver twice in one request, in the database too', async () => {
    const workspaceId = uuidv7();
    const giverAccountId = uuidv7();
    const id = uuidv7();
    written.push(id);
    // The aggregate refuses this before it is built, so the duplicate is written past it to
    // prove the unique index behind that rule is really there.
    const duplicate = FeedbackRequest.restore({
      id,
      workspaceId,
      requesterAccountId: uuidv7(),
      topic: 'my presentation skills',
      visibility: 'ONLY_ME',
      asks: [
        { id: uuidv7(), giverAccountId, status: 'PENDING' },
        { id: uuidv7(), giverAccountId, status: 'PENDING' },
      ],
    });

    await expect(repository.save(duplicate)).rejects.toThrow();
  });
});
