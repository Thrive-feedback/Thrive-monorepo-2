import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackBody } from '../../domain/value-object/feedback-body.vo';
import { Topic } from '../../domain/value-object/topic.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRepository } from '../repository/prisma-feedback.repository';
import { PrismaFeedbackRequestQuery } from './prisma-feedback-request.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaFeedbackRepository(context);
const query = new PrismaFeedbackRequestQuery(context);
const ONE_PAGE = { page: 1, pageSize: 20 };

const WORKSPACE_ID = uuidv7();
const OTHER_WORKSPACE_ID = uuidv7();
const ANA = uuidv7();
const BEN = uuidv7();
const CARA = uuidv7();

const written: string[] = [];

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
async function given(
  workspaceId: string,
  giverAccountId: string,
  receiverAccountId: string,
  topic: string,
  visibility: Visibility,
): Promise<string> {
  const id = uuidv7();
  written.push(id);
  await repository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId,
      giverAccountId,
      receiverAccountId,
      topic: Topic.of(topic),
      visibility,
      body: FeedbackBody.of('You kept the room with you.'),
    }),
  );
  return id;
}

let toBen: string;
let toCara: string;

beforeAll(async () => {
  toBen = await given(
    WORKSPACE_ID,
    ANA,
    BEN,
    'how Ben runs the planning meeting',
    Visibility.onlyMe(),
  );
  toCara = await given(
    WORKSPACE_ID,
    ANA,
    CARA,
    'the customer demo',
    Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] }),
  );
  await given(
    WORKSPACE_ID,
    BEN,
    ANA,
    'how Ana writes release notes',
    Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] }),
  );
  await given(
    OTHER_WORKSPACE_ID,
    ANA,
    BEN,
    'a Workspace this one is not',
    Visibility.onlyMe(),
  );
});

afterAll(async () => {
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading the Feedback a Member has given', () => {
  it('returns every piece they wrote in the Workspace, newest first, whatever its Visibility', async () => {
    const given = await query.givenBy(WORKSPACE_ID, ANA, ONE_PAGE);

    expect(given.total).toBe(2);
    expect(given.items.map((feedback) => feedback.id)).toEqual([toCara, toBen]);
    expect(given.items[0]).toEqual({
      id: toCara,
      origin: 'OFFERED',
      feedbackRequestId: null,
      topic: 'the customer demo',
      topicTags: { workspaceGoals: [], mentions: [] },
      giverAccountId: ANA,
      receiverAccountId: CARA,
      body: 'You kept the room with you.',
      tags: { workspaceGoals: [], mentions: [] },
      createdAt: expect.any(Date),
    });
  });

  it('leaves out what was written to them, and what they wrote in another Workspace', async () => {
    const given = await query.givenBy(WORKSPACE_ID, ANA, ONE_PAGE);

    expect(given.items.map((feedback) => feedback.topic)).not.toContain(
      'how Ana writes release notes',
    );
    expect(given.items.map((feedback) => feedback.topic)).not.toContain(
      'a Workspace this one is not',
    );
  });

  it('pages through what they wrote in order', async () => {
    const second = await query.givenBy(WORKSPACE_ID, ANA, {
      page: 2,
      pageSize: 1,
    });

    expect(second.total).toBe(2);
    expect(second.items.map((feedback) => feedback.id)).toEqual([toBen]);
  });
});
