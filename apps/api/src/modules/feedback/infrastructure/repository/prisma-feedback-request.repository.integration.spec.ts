import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { AskAlreadyAnsweredError } from '../../domain/feedback-request.errors';
import { FeedbackBody } from '../../domain/value-object/feedback-body.vo';
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
function aRequest(
  workspaceId: string,
  requesterAccountId: string,
  visibility: Visibility = Visibility.onlyMe(),
) {
  const id = uuidv7();
  written.push(id);
  return FeedbackRequest.send({
    id,
    workspaceId,
    requesterAccountId,
    topic: Topic.of('my presentation skills'),
    visibility,
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

  it('saves the people a request is shared with and reads them back', async () => {
    const workspaceId = uuidv7();
    const selectedAccountIds = [uuidv7(), uuidv7()].sort();
    const request = aRequest(
      workspaceId,
      uuidv7(),
      Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds }),
    );

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
      selectedAccountIds: [],
      asks: [
        { id: uuidv7(), giverAccountId, status: 'PENDING' },
        { id: uuidv7(), giverAccountId, status: 'PENDING' },
      ],
    });

    await expect(repository.save(duplicate)).rejects.toThrow();
  });

  it('finds a request by an Ask, and only for the Member it waits on', async () => {
    const workspaceId = uuidv7();
    const request = aRequest(workspaceId, uuidv7());
    await repository.save(request);
    const ask = request.snapshot().asks[0];
    if (!ask) {
      throw new Error('The fixture has no Ask.');
    }

    const found = await repository.findByAskOfGiver(
      workspaceId,
      ask.id,
      ask.giverAccountId,
    );
    const foundBySomebodyElse = await repository.findByAskOfGiver(
      workspaceId,
      ask.id,
      uuidv7(),
    );

    expect(found?.snapshot().id).toBe(request.snapshot().id);
    expect(foundBySomebodyElse).toBeNull();
  });

  it('refuses the second answer when one Giver sends two at once', async () => {
    const workspaceId = uuidv7();
    const request = aRequest(workspaceId, uuidv7());
    await repository.save(request);
    const ask = request.snapshot().asks[0];
    if (!ask) {
      throw new Error('The fixture has no Ask.');
    }

    // Two loads of the same row, as two requests from one impatient Giver: neither aggregate
    // can see the other, so only the store can refuse the loser.
    const loads = await Promise.all([
      repository.findByAskOfGiver(workspaceId, ask.id, ask.giverAccountId),
      repository.findByAskOfGiver(workspaceId, ask.id, ask.giverAccountId),
    ]);
    const attempts = loads.map((loaded, attempt) => {
      if (!loaded) {
        throw new Error('The stored request was not found.');
      }
      const feedback = loaded.answerAsk({
        askId: ask.id,
        giverAccountId: ask.giverAccountId,
        feedbackId: uuidv7(),
        body: FeedbackBody.of(`answer ${attempt}`),
      });
      if (!feedback) {
        throw new Error('The loaded request does not hold the Ask.');
      }
      return { loaded, feedback };
    });

    const outcomes = await Promise.allSettled(
      attempts.map(({ loaded, feedback }) =>
        repository.saveAnswer(loaded, feedback),
      ),
    );

    expect(outcomes.filter((one) => one.status === 'fulfilled')).toHaveLength(
      1,
    );
    const refused = outcomes.find((one) => one.status === 'rejected');
    expect((refused as PromiseRejectedResult).reason).toBeInstanceOf(
      AskAlreadyAnsweredError,
    );
    const stored = await prismaService.feedback.count({
      where: { feedbackAskId: ask.id },
    });
    expect(stored).toBe(1);
  });
});
