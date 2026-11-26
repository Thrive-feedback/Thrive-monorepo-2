import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeOneOnOneRepository,
  FakeOneOnOneTemplateRepository,
} from '@test/support/one-on-one.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import {
  OneOnOneNotRunningError,
  OneOnOneNotYoursToAnswerError,
  OneOnOneNotYoursToChangeError,
  OneOnOneNotYoursToWithdrawError,
} from '../../domain/one-on-one.errors';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { OneOnOneTemplateCatalogService } from '../service/one-on-one-template-catalog.service';
import { AcceptOneOnOneUseCase } from './accept-one-on-one.use-case';
import { DeclineOneOnOneUseCase } from './decline-one-on-one.use-case';
import { EndOneOnOneUseCase } from './end-one-on-one.use-case';
import { RescheduleOneOnOneUseCase } from './reschedule-one-on-one.use-case';
import { SuggestAnotherTimeUseCase } from './suggest-another-time.use-case';

const WORKSPACE_ID = 'workspace-acme';
const KRIT = 'account-krit';
const MINT = 'account-mint';
const LEO = 'account-leo';
const NOW = new Date('2026-11-26T03:00:00.000Z');
const CHOICE = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 600,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
};

function invitation(id: string, from: string, to: string) {
  return OneOnOne.invite({
    id,
    workspaceId: WORKSPACE_ID,
    startedByAccountId: from,
    invitedAccountId: to,
    schedule: OneOnOneSchedule.plan(CHOICE, NOW),
    note: null,
  });
}

function setUp() {
  // Krit invited Mint; Leo invited Krit.
  const oneOnOneRepository = new FakeOneOnOneRepository().with(
    invitation('to-mint', KRIT, MINT),
    invitation('to-krit', LEO, KRIT),
  );
  const clock = new FakeClock(NOW);
  return {
    oneOnOneRepository,
    accept: new AcceptOneOnOneUseCase(
      oneOnOneRepository,
      new FakeUnitOfWork(),
      clock,
    ),
    decline: new DeclineOneOnOneUseCase(
      oneOnOneRepository,
      new FakeUnitOfWork(),
      clock,
    ),
    end: new EndOneOnOneUseCase(
      oneOnOneRepository,
      new FakeUnitOfWork(),
      clock,
    ),
    reschedule: new RescheduleOneOnOneUseCase(
      oneOnOneRepository,
      new OneOnOneTemplateCatalogService(new FakeOneOnOneTemplateRepository()),
      new FakeUnitOfWork(),
      clock,
    ),
    suggest: new SuggestAnotherTimeUseCase(
      oneOnOneRepository,
      new OneOnOneTemplateCatalogService(new FakeOneOnOneTemplateRepository()),
      new FakeUnitOfWork(),
      clock,
    ),
  };
}

function statusOf(repository: FakeOneOnOneRepository, id: string) {
  return repository.saved(id)?.snapshot().status;
}

describe('answering an invitation to a 1:1', () => {
  it('runs it once the person invited accepts it, on the schedule sent', async () => {
    const { oneOnOneRepository, accept } = setUp();

    await accept.execute({
      workspaceId: WORKSPACE_ID,
      accountId: MINT,
      oneOnOneId: 'to-mint',
    });

    expect(statusOf(oneOnOneRepository, 'to-mint')).toBe('ACTIVE');
    expect(
      oneOnOneRepository.saved('to-mint')?.snapshot().schedule.weekday,
    ).toBe(4);
  });

  it('is refused to whoever sent it', async () => {
    const { accept } = setUp();

    await expect(
      accept.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        oneOnOneId: 'to-mint',
      }),
    ).rejects.toThrow(OneOnOneNotYoursToAnswerError);
  });

  it('tells somebody outside it that it does not exist', async () => {
    const { decline } = setUp();

    await expect(
      decline.execute({
        workspaceId: WORKSPACE_ID,
        accountId: LEO,
        oneOnOneId: 'to-mint',
        note: null,
      }),
    ).rejects.toThrow(OneOnOneNotFoundError);
  });

  it('is turned down by the person invited, with their note', async () => {
    const { oneOnOneRepository, decline } = setUp();

    await decline.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      oneOnOneId: 'to-krit',
      note: '  Not this month, sorry.  ',
    });

    expect(statusOf(oneOnOneRepository, 'to-krit')).toBe('DECLINED');
    expect(oneOnOneRepository.saved('to-krit')?.snapshot().answerNote).toBe(
      'Not this month, sorry.',
    );
  });

  it('is withdrawn by whoever sent it', async () => {
    const { oneOnOneRepository, end } = setUp();

    await end.execute({
      workspaceId: WORKSPACE_ID,
      accountId: LEO,
      oneOnOneId: 'to-krit',
    });

    expect(statusOf(oneOnOneRepository, 'to-krit')).toBe('ENDED');
  });

  it('is not withdrawn by the person invited, who declines instead', async () => {
    const { end } = setUp();

    await expect(
      end.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        oneOnOneId: 'to-krit',
      }),
    ).rejects.toThrow(OneOnOneNotYoursToWithdrawError);
  });
});

describe('changing when a 1:1 meets', () => {
  it('is open to either person once it runs', async () => {
    const { oneOnOneRepository, accept, reschedule } = setUp();
    await accept.execute({
      workspaceId: WORKSPACE_ID,
      accountId: MINT,
      oneOnOneId: 'to-mint',
    });

    await reschedule.execute({
      workspaceId: WORKSPACE_ID,
      accountId: MINT,
      oneOnOneId: 'to-mint',
      schedule: { ...CHOICE, weekday: 2 },
    });

    expect(
      oneOnOneRepository.saved('to-mint')?.snapshot().schedule.weekday,
    ).toBe(2);
  });

  it('is the sender’s alone before it is answered', async () => {
    const { reschedule } = setUp();

    await expect(
      reschedule.execute({
        workspaceId: WORKSPACE_ID,
        accountId: MINT,
        oneOnOneId: 'to-mint',
        schedule: { ...CHOICE, weekday: 2 },
      }),
    ).rejects.toThrow(OneOnOneNotYoursToChangeError);
  });

  it('tells somebody outside it that it does not exist', async () => {
    const { reschedule } = setUp();

    await expect(
      reschedule.execute({
        workspaceId: WORKSPACE_ID,
        accountId: LEO,
        oneOnOneId: 'to-mint',
        schedule: CHOICE,
      }),
    ).rejects.toThrow(OneOnOneNotFoundError);
  });
});

describe('a 1:1 that no longer runs', () => {
  it('is not rescheduled once declined or ended', async () => {
    const { decline, end, accept, reschedule } = setUp();
    await decline.execute({
      workspaceId: WORKSPACE_ID,
      accountId: MINT,
      oneOnOneId: 'to-mint',
      note: null,
    });
    await accept.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      oneOnOneId: 'to-krit',
    });
    await end.execute({
      workspaceId: WORKSPACE_ID,
      accountId: LEO,
      oneOnOneId: 'to-krit',
    });

    for (const [accountId, oneOnOneId] of [
      [KRIT, 'to-mint'],
      [KRIT, 'to-krit'],
    ] as const) {
      await expect(
        reschedule.execute({
          workspaceId: WORKSPACE_ID,
          accountId,
          oneOnOneId,
          schedule: { ...CHOICE, weekday: 2 },
        }),
      ).rejects.toThrow(OneOnOneNotRunningError);
    }
  });

  it('is not ended by somebody outside it, who is told it does not exist', async () => {
    const { end } = setUp();

    await expect(
      end.execute({
        workspaceId: WORKSPACE_ID,
        accountId: LEO,
        oneOnOneId: 'to-mint',
      }),
    ).rejects.toThrow(OneOnOneNotFoundError);
  });
});

describe('suggesting another time for an invitation', () => {
  it('sends it back to whoever sent it, on the new time', async () => {
    const { oneOnOneRepository, suggest } = setUp();

    await suggest.execute({
      workspaceId: WORKSPACE_ID,
      accountId: MINT,
      oneOnOneId: 'to-mint',
      schedule: { ...CHOICE, weekday: 2 },
      note: 'Tuesday suits me',
    });

    const snapshot = oneOnOneRepository.saved('to-mint')?.snapshot();
    expect(snapshot?.invitedAccountId).toBe(KRIT);
    expect(snapshot?.schedule.weekday).toBe(2);
    expect(snapshot?.suggestedAt).toEqual(NOW);
  });

  it('is refused to whoever sent it', async () => {
    const { suggest } = setUp();

    await expect(
      suggest.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        oneOnOneId: 'to-mint',
        schedule: CHOICE,
        note: null,
      }),
    ).rejects.toThrow(OneOnOneNotYoursToAnswerError);
  });

  it('tells somebody outside it that it does not exist', async () => {
    const { suggest } = setUp();

    await expect(
      suggest.execute({
        workspaceId: WORKSPACE_ID,
        accountId: LEO,
        oneOnOneId: 'to-mint',
        schedule: CHOICE,
        note: null,
      }),
    ).rejects.toThrow(OneOnOneNotFoundError);
  });
});
