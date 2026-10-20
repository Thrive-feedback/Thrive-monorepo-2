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
const BEN = uuidv7();
const CARA = uuidv7();
const DAN = uuidv7();

const written: string[] = [];

const everyone = () =>
  Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] });

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
async function given(
  workspaceId: string,
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
      giverAccountId: BEN,
      receiverAccountId: CARA,
      topic: Topic.of(topic),
      visibility,
      body: FeedbackBody.of('You kept the room with you.'),
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

afterAll(async () => {
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
      topic: 'the customer demo',
      topicTags: { workspaceGoals: [], mentions: [] },
      giverAccountId: BEN,
      receiverAccountId: CARA,
      body: 'You kept the room with you.',
      tags: { workspaceGoals: [], mentions: [] },
      createdAt: expect.any(Date),
    });
  });

  it('leaves out Only me and Selected people, whoever asked', async () => {
    const feed = await query.publicIn(WORKSPACE_ID, ONE_PAGE);

    const topics = feed.items.map((feedback) => feedback.topic);
    expect(topics).not.toContain('the release notes');
    expect(topics).not.toContain('onboarding the new designers');
  });

  it('leaves out another Workspace’s feed', async () => {
    const feed = await query.publicIn(WORKSPACE_ID, ONE_PAGE);

    expect(feed.items.map((feedback) => feedback.topic)).not.toContain(
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
