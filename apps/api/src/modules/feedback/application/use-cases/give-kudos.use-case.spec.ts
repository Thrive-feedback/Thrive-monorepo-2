import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeAccountBySlugPort,
  FakeActiveWorkspaceGoalPort,
  FakeKudosRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeOutbox } from '@test/support/outbox.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  KudosCardInvalidError,
  KudosMessageEmptyError,
} from '../../domain/feedback-request.errors';
import type { KudosCardSnapshot } from '../../domain/value-object/kudos-card.vo';
import { SummaryRefreshService } from '../service/summary-refresh.service';
import { TagsService } from '../service/tags.service';
import { GiveKudosUseCase } from './give-kudos.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const KUDOS_ID = '0199a0f0-0000-7000-8000-0000000000k1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';

/** Fixed, so the period a refresh names does not move with the calendar. */
const NOW = new Date('2026-11-08T09:00:00.000Z');

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
  const outbox = new FakeOutbox();
  const useCase = new GiveKudosUseCase(
    kudosRepository,
    tagsService,
    new FakeIdGenerator(KUDOS_ID),
    unitOfWork,
    outbox,
    new SummaryRefreshService(outbox, new FakeClock(NOW), true),
  );
  return { kudosRepository, unitOfWork, useCase, outbox };
}

const CARD: KudosCardSnapshot = {
  templateKey: 'cobalt-dash',
  textStyle: { font: 'signature', sizeStep: 4, align: 'center', ink: 'paper' },
  stickers: [],
};

function giving(message: string, card: KudosCardSnapshot | null = null) {
  return { workspaceId: WORKSPACE_ID, giverAccountId: ANN, message, card };
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
        card: null,
      },
    ]);
  });

  it('stores the card it was written on', async () => {
    const { kudosRepository, useCase } = setUp();

    await useCase.execute(giving('@ben thank you.', CARD));

    expect(kudosRepository.saved[0]?.card).toEqual(CARD);
  });

  it('refuses a card that does not fit, and stores nothing', async () => {
    const { kudosRepository, useCase } = setUp();

    await expect(
      useCase.execute(
        giving('@ben thank you.', { ...CARD, templateKey: 'Not A Slug' }),
      ),
    ).rejects.toThrow(KudosCardInvalidError);
    expect(kudosRepository.saved).toEqual([]);
  });

  it('writes inside one unit of work', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(giving('@ben thank you.'));

    expect(unitOfWork.opened).toHaveLength(1);
  });

  it('stores a Kudos that names nobody, for the whole Workspace', async () => {
    const { kudosRepository, useCase } = setUp();

    await useCase.execute(giving('Great launch, everyone.'));

    expect(kudosRepository.saved[0]?.recipientAccountIds).toEqual([]);
  });

  it('gives nobody outside the Workspace Kudos: one naming only them is for the whole Workspace', async () => {
    const { kudosRepository, useCase } = setUp();

    await useCase.execute(giving('@dan thank you.'));

    expect(kudosRepository.saved[0]?.recipientAccountIds).toEqual([]);
  });

  it('never gives its Giver their own Kudos: one naming only them is for the whole Workspace', async () => {
    const { kudosRepository, useCase } = setUp();

    await useCase.execute(giving('@ann well done me.'));

    expect(kudosRepository.saved[0]?.recipientAccountIds).toEqual([]);
  });

  it('tells the channel about a Kudos for the whole Workspace too', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(giving('Great launch, everyone.'));

    expect(outbox.ofType('integrations.kudos_given')[0]?.payload).toMatchObject(
      { recipientAccountIds: [] },
    );
  });

  it('refuses an empty Kudos before reading anything', async () => {
    const { useCase } = setUp();

    await expect(useCase.execute(giving('   '))).rejects.toThrow(
      KudosMessageEmptyError,
    );
  });
});

describe('telling the Workspace channel about a Kudos', () => {
  const GIVEN = 'integrations.kudos_given';

  it('enqueues it, with its message (brain ADR-0045)', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(giving('@ben carried the launch #ownership.'));

    expect(outbox.ofType(GIVEN)).toHaveLength(1);
    expect(outbox.ofType(GIVEN)[0]?.payload).toEqual({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANN,
      recipientAccountIds: [BEN],
      message: '@ben carried the launch #ownership.',
      kudosId: KUDOS_ID,
    });
  });

  it('is the one payload that carries words, because a Kudos has no Visibility', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(giving('@ben carried the launch.'));

    // Feedback's payload carries ids only (brain ADR-0040). A Kudos is the stated exception:
    // every Member can already read it, and stripped of its words it announces that praise
    // happened somewhere else (brain ADR-0045).
    expect(JSON.stringify(outbox.ofType(GIVEN)[0]?.payload)).toContain(
      'carried the launch',
    );
  });

  it('names everyone the Kudos is for', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(giving('@ben and @cara carried the launch.'));

    expect(outbox.ofType(GIVEN)[0]?.payload).toMatchObject({
      recipientAccountIds: [BEN, CARA],
    });
  });

  it('keys the message by the Kudos, so a retried request announces once', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(giving('@ben carried the launch.'));

    expect(outbox.ofType(GIVEN)[0]?.idempotencyKey).toBe(
      `${GIVEN}:${KUDOS_ID}`,
    );
  });
});
