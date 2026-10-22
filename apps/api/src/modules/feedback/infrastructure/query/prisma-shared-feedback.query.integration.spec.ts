import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
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
const DAN = uuidv7();

const written: string[] = [];

/**
 * No Account and no Workspace is created first: Feedback's tables hold their ids without a
 * foreign key, which is the boundary this suite also proves.
 */
async function given(
  workspaceId: string,
  giverAccountId: string,
  receiverAccountId: string,
  message: string,
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
      visibility,
      message: FeedbackMessage.of(message),
    }),
  );
  return id;
}

const selected = (...accountIds: string[]) =>
  Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds: accountIds });

let sharedWithAna: string;
let sharedWithAnaAndDan: string;

beforeAll(async () => {
  sharedWithAna = await given(
    WORKSPACE_ID,
    CARA,
    BEN,
    'how Ben runs the planning meeting',
    selected(ANA),
  );
  sharedWithAnaAndDan = await given(
    WORKSPACE_ID,
    BEN,
    CARA,
    'the customer demo',
    selected(ANA, DAN),
  );
  await given(
    WORKSPACE_ID,
    CARA,
    DAN,
    'onboarding the new designers',
    selected(BEN),
  );
  await given(
    WORKSPACE_ID,
    CARA,
    DAN,
    'the release notes',
    Visibility.onlyMe(),
  );
  await given(
    WORKSPACE_ID,
    CARA,
    DAN,
    'the retro',
    Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] }),
  );
  await given(
    OTHER_WORKSPACE_ID,
    CARA,
    DAN,
    'a Workspace Ana is not in',
    selected(ANA),
  );
});

afterAll(async () => {
  await prismaService.feedback.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('reading the Feedback shared with a Member', () => {
  it('returns every piece that selected them, newest first, with both people', async () => {
    const shared = await query.sharedWith(WORKSPACE_ID, ANA, ONE_PAGE);

    expect(shared.total).toBe(2);
    expect(shared.items.map((feedback) => feedback.id)).toEqual([
      sharedWithAnaAndDan,
      sharedWithAna,
    ]);
    expect(shared.items[0]).toEqual({
      id: sharedWithAnaAndDan,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: BEN,
      receiverAccountId: CARA,
      message: 'the customer demo',
      tags: { workspaceGoals: [], mentions: [] },
      createdAt: expect.any(Date),
    });
  });

  it('returns nothing to a Member of the same Workspace who was not selected', async () => {
    const shared = await query.sharedWith(WORKSPACE_ID, uuidv7(), ONE_PAGE);

    expect(shared).toEqual({ items: [], total: 0 });
  });

  it('leaves out Only me and Everyone, whatever else may read them', async () => {
    const shared = await query.sharedWith(WORKSPACE_ID, ANA, ONE_PAGE);

    expect(shared.items.map((feedback) => feedback.message)).not.toContain(
      'the release notes',
    );
    expect(shared.items.map((feedback) => feedback.message)).not.toContain(
      'the retro',
    );
  });

  it('leaves out a piece shared with them in another Workspace', async () => {
    const shared = await query.sharedWith(WORKSPACE_ID, ANA, ONE_PAGE);

    expect(shared.items.map((feedback) => feedback.message)).not.toContain(
      'a Workspace Ana is not in',
    );
  });

  it('counts everything shared with them, and pages through it in order', async () => {
    const first = await query.sharedWith(WORKSPACE_ID, ANA, {
      page: 1,
      pageSize: 1,
    });
    const second = await query.sharedWith(WORKSPACE_ID, ANA, {
      page: 2,
      pageSize: 1,
    });

    expect([first.total, second.total]).toEqual([2, 2]);
    expect(first.items.map((feedback) => feedback.id)).toEqual([
      sharedWithAnaAndDan,
    ]);
    expect(second.items.map((feedback) => feedback.id)).toEqual([
      sharedWithAna,
    ]);
  });
});
