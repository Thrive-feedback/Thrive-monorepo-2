import { describe, expect, it } from 'bun:test';
import {
  FakeAccountBySlugPort,
  FakeActiveWorkspaceGoalPort,
  FakeKudosRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  KudosMessageEmptyError,
  KudosNeedsARecipientError,
} from '../../domain/feedback-request.errors';
import { TagsService } from '../service/tags.service';
import { GiveKudosUseCase } from './give-kudos.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const KUDOS_ID = '0199a0f0-0000-7000-8000-0000000000k1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';

function setUp() {
  const kudosRepository = new FakeKudosRepository();
  const unitOfWork = new FakeUnitOfWork();
  const tagsService = new TagsService(
    new FakeActiveWorkspaceGoalPort().with(WORKSPACE_ID, {
      id: 'goal-ownership',
      name: 'ownership',
    }),
    new FakeAccountBySlugPort().with(
      { accountId: ANN, slug: 'ann', displayName: 'Ann' },
      { accountId: BEN, slug: 'ben', displayName: 'Ben' },
      { accountId: CARA, slug: 'cara', displayName: 'Cara' },
      { accountId: DAN, slug: 'dan', displayName: 'Dan' },
    ),
    // Dan has an Account but is in another Workspace.
    new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, ANN, BEN, CARA),
  );
  const useCase = new GiveKudosUseCase(
    kudosRepository,
    tagsService,
    new FakeIdGenerator(KUDOS_ID),
    unitOfWork,
  );
  return { kudosRepository, unitOfWork, useCase };
}

function giving(message: string) {
  return { workspaceId: WORKSPACE_ID, giverAccountId: ANN, message };
}

describe('a Member giving Kudos', () => {
  it('stores one Kudos for everyone it mentions, with a tidied message', async () => {
    const { kudosRepository, useCase } = setUp();

    const given = await useCase.execute(
      giving('  @ben and @cara carried the launch #ownership. '),
    );

    expect(given).toEqual({ id: KUDOS_ID });
    expect(kudosRepository.saved).toEqual([
      {
        id: KUDOS_ID,
        workspaceId: WORKSPACE_ID,
        giverAccountId: ANN,
        recipientAccountIds: [BEN, CARA],
        message: '@ben and @cara carried the launch #ownership.',
        workspaceGoals: [
          { workspaceGoalId: 'goal-ownership', name: 'ownership' },
        ],
        mentions: [
          { accountId: BEN, slug: 'ben', displayName: 'Ben' },
          { accountId: CARA, slug: 'cara', displayName: 'Cara' },
        ],
      },
    ]);
  });

  it('writes inside one unit of work', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(giving('@ben thank you.'));

    expect(unitOfWork.opened).toHaveLength(1);
  });

  it('gives nobody outside the Workspace Kudos, and refuses one that names only them', async () => {
    const { kudosRepository, useCase } = setUp();

    await expect(useCase.execute(giving('@dan thank you.'))).rejects.toThrow(
      KudosNeedsARecipientError,
    );
    expect(kudosRepository.saved).toEqual([]);
  });

  it('refuses a Kudos that only names its Giver', async () => {
    const { useCase } = setUp();

    await expect(useCase.execute(giving('@ann well done me.'))).rejects.toThrow(
      KudosNeedsARecipientError,
    );
  });

  it('refuses an empty Kudos before reading anything', async () => {
    const { useCase } = setUp();

    await expect(useCase.execute(giving('   '))).rejects.toThrow(
      KudosMessageEmptyError,
    );
  });
});
