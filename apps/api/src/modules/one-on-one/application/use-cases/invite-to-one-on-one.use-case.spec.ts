import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import {
  FakeOneOnOneRepository,
  FakeOneOnOneTemplateRepository,
} from '@test/support/one-on-one.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  OneOnOneInviteNoteTooLongError,
  OneOnOneTemplateUnknownError,
} from '../../domain/one-on-one.errors';
import {
  OneOnOneAlreadyExistsError,
  OneOnOnePersonNotFoundError,
} from '../one-on-one.errors';
import { OneOnOneTemplateCatalogService } from '../service/one-on-one-template-catalog.service';
import { InviteToOneOnOneUseCase } from './invite-to-one-on-one.use-case';

const WORKSPACE_ID = 'workspace-acme';
const KRIT = 'account-krit';
const MINT = 'account-mint';
const OUTSIDER = 'account-outsider';
const NOW = new Date('2026-11-26T03:00:00.000Z');
const SCHEDULE = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 600,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
};

function setUp(now: Date = NOW) {
  const oneOnOneRepository = new FakeOneOnOneRepository();
  const invite = new InviteToOneOnOneUseCase(
    oneOnOneRepository,
    new OneOnOneTemplateCatalogService(new FakeOneOnOneTemplateRepository()),
    new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, KRIT, MINT),
    new FakeIdGenerator('one-on-one-1', 'one-on-one-2'),
    new FakeUnitOfWork(),
    new FakeClock(now),
  );
  return { oneOnOneRepository, invite };
}

describe('a Member inviting a teammate to a 1:1', () => {
  it('stores the invitation, from the caller, with its schedule and note', async () => {
    const { oneOnOneRepository, invite } = setUp();

    const { id } = await invite.execute({
      workspaceId: WORKSPACE_ID,
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: SCHEDULE,
      note: 'How the launch went',
    });

    const snapshot = oneOnOneRepository.saved(id)?.snapshot();
    expect(snapshot?.status).toBe('INVITED');
    expect(snapshot?.startedByAccountId).toBe(KRIT);
    expect(snapshot?.invitedAccountId).toBe(MINT);
    expect(snapshot?.schedule.startsOn).toBe('2026-11-26');
    expect(snapshot?.inviteNote).toBe('How the launch went');
  });

  it('is refused for somebody outside the Workspace', async () => {
    const { oneOnOneRepository, invite } = setUp();

    await expect(
      invite.execute({
        workspaceId: WORKSPACE_ID,
        startedByAccountId: KRIT,
        invitedAccountId: OUTSIDER,
        schedule: SCHEDULE,
        note: null,
      }),
    ).rejects.toThrow(OneOnOnePersonNotFoundError);
    expect(oneOnOneRepository.count).toBe(0);
  });

  it('is refused with a template Thrive does not have', async () => {
    const { invite } = setUp();

    await expect(
      invite.execute({
        workspaceId: WORKSPACE_ID,
        startedByAccountId: KRIT,
        invitedAccountId: MINT,
        schedule: { ...SCHEDULE, templateKey: 'quarterly-review' },
        note: null,
      }),
    ).rejects.toThrow(OneOnOneTemplateUnknownError);
  });

  it('is refused with a note over 280 characters', async () => {
    const { oneOnOneRepository, invite } = setUp();

    await expect(
      invite.execute({
        workspaceId: WORKSPACE_ID,
        startedByAccountId: KRIT,
        invitedAccountId: MINT,
        schedule: SCHEDULE,
        note: 'x'.repeat(281),
      }),
    ).rejects.toThrow(OneOnOneInviteNoteTooLongError);
    expect(oneOnOneRepository.count).toBe(0);
  });

  it('is refused when the two already have one, whichever of them sent it', async () => {
    const { invite } = setUp();
    await invite.execute({
      workspaceId: WORKSPACE_ID,
      startedByAccountId: MINT,
      invitedAccountId: KRIT,
      schedule: SCHEDULE,
      note: null,
    });

    await expect(
      invite.execute({
        workspaceId: WORKSPACE_ID,
        startedByAccountId: KRIT,
        invitedAccountId: MINT,
        schedule: SCHEDULE,
        note: null,
      }),
    ).rejects.toThrow(OneOnOneAlreadyExistsError);
  });
});

describe('a 1:1 held just once', () => {
  const ONCE = { ...SCHEDULE, cadence: 'ONCE', startsOn: '2026-12-02' };

  it('stores the day it meets', async () => {
    const { oneOnOneRepository, invite } = setUp();

    const { id } = await invite.execute({
      workspaceId: WORKSPACE_ID,
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: ONCE,
      note: null,
    });

    const schedule = oneOnOneRepository.saved(id)?.snapshot().schedule;
    expect(schedule?.cadence).toBe('ONCE');
    expect(schedule?.startsOn).toBe('2026-12-02');
    expect(schedule?.weekday).toBe(3);
  });

  it('no longer holds the two once it has met, so they can meet again', async () => {
    const { oneOnOneRepository, invite } = setUp();
    const { id } = await invite.execute({
      workspaceId: WORKSPACE_ID,
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: ONCE,
      note: null,
    });
    oneOnOneRepository.saved(id)?.accept(MINT, NOW);
    const afterIt = setUp(new Date('2026-12-03T03:00:00.000Z'));
    afterIt.oneOnOneRepository.with(
      ...[oneOnOneRepository.saved(id)].filter((each) => each !== undefined),
    );

    await expect(
      afterIt.invite.execute({
        workspaceId: WORKSPACE_ID,
        startedByAccountId: MINT,
        invitedAccountId: KRIT,
        schedule: SCHEDULE,
        note: null,
      }),
    ).resolves.toEqual({ id: 'one-on-one-1' });
  });
});
