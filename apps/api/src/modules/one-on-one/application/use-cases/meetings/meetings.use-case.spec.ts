import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeOneOnOneMeetingQuery,
  FakeOneOnOneMeetingRepository,
  FakeOneOnOneQuery,
  FakeOneOnOneRepository,
  FakeOneOnOneTemplateRepository,
} from '@test/support/one-on-one.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { OneOnOne } from '../../../domain/entity/one-on-one.entity';
import {
  OneOnOneNotRunningError,
  OneOnOneTemplateUnknownError,
} from '../../../domain/one-on-one.errors';
import {
  OneOnOneMeetingAlreadyStartedError,
  OneOnOneMeetingNotStartedError,
  OneOnOneTopicChangedError,
  OneOnOneTopicNotYoursError,
} from '../../../domain/one-on-one-meeting.errors';
import { OneOnOneSchedule } from '../../../domain/value-object/one-on-one-schedule.vo';
import {
  OneOnOneMeetingNotFoundError,
  OneOnOneNotFoundError,
} from '../../one-on-one.errors';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';
import { OneOnOneTemplateCatalogService } from '../../service/one-on-one-template-catalog.service';
import { AddTopicUseCase } from './add-topic.use-case';
import { FinishMeetingUseCase } from './finish-meeting.use-case';
import { GetNextMeetingUseCase } from './get-next-meeting.use-case';
import { ListPastMeetingsUseCase } from './list-past-meetings.use-case';
import { OpenMeetingUseCase } from './open-meeting.use-case';
import { RemoveTopicUseCase } from './remove-topic.use-case';
import { StartMeetingUseCase } from './start-meeting.use-case';
import { UpdateTopicUseCase } from './update-topic.use-case';
import { UseTemplateForMeetingUseCase } from './use-template-for-meeting.use-case';

const WORKSPACE_ID = 'workspace-acme';
const ONE_ON_ONE_ID = 'one-on-one-1';
const KRIT = 'account-krit';
const MINT = 'account-mint';
const LEO = 'account-leo';
const NOW = new Date('2026-11-26T03:00:00.000Z');

/** Hands out ids in order, as UUID v7 would: each later than the one before. */
function ids() {
  let next = 0;
  return {
    next: () => {
      next += 1;
      return `id-${String(next).padStart(4, '0')}`;
    },
  };
}

/** A one-time meeting, 10:00 to 10:30 Bangkok time on the day of NOW. */
const ONCE_CHOICE = {
  cadence: 'ONCE',
  weekday: 4,
  templateKey: 'weekly-check-in',
  startsOn: '2026-11-26',
} as const;

/** 10:40 Bangkok time: the one-time meeting's slot has passed. */
/** Midnight in Bangkok as 27 November starts: the day the meeting was on is over. */
const AFTER_THE_SLOT = new Date('2026-11-26T17:00:00.000Z');

function setUp({
  ended = false,
  once = false,
  now = NOW,
}: {
  ended?: boolean;
  once?: boolean;
  now?: Date;
} = {}) {
  const oneOnOne = OneOnOne.invite({
    id: ONE_ON_ONE_ID,
    workspaceId: WORKSPACE_ID,
    startedByAccountId: KRIT,
    invitedAccountId: MINT,
    schedule: OneOnOneSchedule.plan(
      once
        ? ONCE_CHOICE
        : {
            cadence: 'WEEKLY',
            weekday: 4,
            templateKey: 'weekly-check-in',
          },
      NOW,
    ),
    note: null,
  });
  oneOnOne.accept(MINT, NOW);
  if (ended) {
    oneOnOne.end(KRIT, NOW);
  }
  const oneOnOnes = new FakeOneOnOneRepository().with(oneOnOne);
  const meetings = new FakeOneOnOneMeetingRepository();
  const query = new FakeOneOnOneMeetingQuery(meetings);
  const oneOnOneQuery = new FakeOneOnOneQuery(oneOnOnes);
  const clock = new FakeClock(now);
  const idGenerator = ids();
  const unitOfWork = new FakeUnitOfWork();
  const catalog = new OneOnOneTemplateCatalogService(
    new FakeOneOnOneTemplateRepository(),
  );
  const access = new OneOnOneMeetingAccessService(
    oneOnOnes,
    meetings,
    idGenerator,
    clock,
  );
  return {
    oneOnOnes,
    meetings,
    clock,
    next: new GetNextMeetingUseCase(oneOnOneQuery, query, catalog, clock),
    past: new ListPastMeetingsUseCase(oneOnOneQuery, query),
    open: new OpenMeetingUseCase(access, meetings, unitOfWork),
    start: new StartMeetingUseCase(access, meetings, unitOfWork, clock),
    finish: new FinishMeetingUseCase(access, meetings, unitOfWork, clock),
    addTopic: new AddTopicUseCase(access, meetings, unitOfWork, idGenerator),
    updateTopic: new UpdateTopicUseCase(access, meetings, unitOfWork, clock),
    removeTopic: new RemoveTopicUseCase(access, meetings, unitOfWork),
    useTemplate: new UseTemplateForMeetingUseCase(
      access,
      catalog,
      meetings,
      unitOfWork,
      idGenerator,
    ),
  };
}

const as = (accountId: string) => ({
  workspaceId: WORKSPACE_ID,
  oneOnOneId: ONE_ON_ONE_ID,
  accountId,
});

/** The next meeting opened by Krit, who uses the Weekly check-in for it. */
async function prepared(world: ReturnType<typeof setUp>) {
  const opened = await world.open.execute(as(KRIT));
  await world.useTemplate.execute({
    ...as(KRIT),
    meetingId: opened.id,
    templateKey: 'weekly-check-in',
  });
  return opened;
}

/** A meeting opened, started and run by Krit and Mint, with one topic discussed. */
async function aMeetingRun(world: ReturnType<typeof setUp>) {
  const { id: meetingId } = await prepared(world);
  await world.start.execute({ ...as(MINT), meetingId });
  const [first] = world.meetings.saved(meetingId)?.snapshot().topics ?? [];
  await world.updateTopic.execute({
    ...as(KRIT),
    meetingId,
    topicId: first?.id ?? '',
    discussed: true,
    note: { text: 'Shipped on time', readAt: null },
  });
  return meetingId;
}

describe('the next meeting of a 1:1', () => {
  it('shows it opens with no template before anybody writes to it', async () => {
    const world = setUp();

    const next = await world.next.execute(as(MINT));

    expect(next.meeting).toBeNull();
    expect(next.templateName).toBeNull();
    expect(next.templateQuestions).toEqual([]);
  });

  it('opens once, whoever opens it, with no template questions', async () => {
    const world = setUp();

    const first = await world.open.execute(as(KRIT));
    const again = await world.open.execute(as(MINT));

    expect(first.opened).toBe(true);
    expect(again).toEqual({ id: first.id, opened: false });
    expect(world.meetings.all()).toHaveLength(1);
    expect(world.meetings.saved(first.id)?.snapshot().topics).toHaveLength(0);
  });

  it('takes the questions of a template either person uses, named for both', async () => {
    const world = setUp();
    const { id: meetingId } = await prepared(world);

    const next = await world.next.execute(as(MINT));

    expect(next.templateName).toBe('Weekly check-in');
    expect(next.meeting?.topics.map((topic) => topic.source)).toEqual([
      'TEMPLATE',
      'TEMPLATE',
      'TEMPLATE',
    ]);
    await world.useTemplate.execute({
      ...as(MINT),
      meetingId,
      templateKey: 'career-conversation',
    });
    expect(
      (await world.next.execute(as(KRIT))).meeting?.topics[0]?.text,
    ).not.toBe('What went well this week?');
  });

  it('uses no template that is not one somebody may choose', async () => {
    const world = setUp();
    const { id: meetingId } = await world.open.execute(as(KRIT));

    await expect(
      world.useTemplate.execute({
        ...as(KRIT),
        meetingId,
        templateKey: 'no-such-template',
      }),
    ).rejects.toThrow(OneOnOneTemplateUnknownError);
  });

  it('is nobody else’s to read or write', async () => {
    const world = setUp();

    await expect(world.next.execute(as(LEO))).rejects.toThrow(
      OneOnOneNotFoundError,
    );
    await expect(world.open.execute(as(LEO))).rejects.toThrow(
      OneOnOneNotFoundError,
    );
  });

  it('offers no agenda that cannot open, once the 1:1 has ended', async () => {
    const world = setUp({ ended: true });

    const next = await world.next.execute(as(KRIT));

    expect(next).toMatchObject({
      meeting: null,
      carried: [],
      templateQuestions: [],
    });
  });

  it('is not opened once the 1:1 has ended', async () => {
    const world = setUp({ ended: true });

    await expect(world.open.execute(as(KRIT))).rejects.toThrow(
      OneOnOneNotRunningError,
    );
  });

  it('says so of a meeting that is not this 1:1’s', async () => {
    const world = setUp();

    await expect(
      world.start.execute({ ...as(KRIT), meetingId: 'meeting-elsewhere' }),
    ).rejects.toThrow(OneOnOneMeetingNotFoundError);
  });
});

describe('preparing and running a meeting', () => {
  it('lets only the author remove the topic they added', async () => {
    const world = setUp();
    const { id: meetingId } = await prepared(world);
    const { id: topicId } = await world.addTopic.execute({
      ...as(MINT),
      meetingId,
      text: 'Career path',
    });

    await expect(
      world.removeTopic.execute({ ...as(KRIT), meetingId, topicId }),
    ).rejects.toThrow(OneOnOneTopicNotYoursError);
    await world.removeTopic.execute({ ...as(MINT), meetingId, topicId });
    expect(world.meetings.saved(meetingId)?.snapshot().topics).toHaveLength(3);
  });

  it('lets only the author reword the topic they added, and anyone a template one', async () => {
    const world = setUp();
    const { id: meetingId } = await prepared(world);
    const { id: topicId } = await world.addTopic.execute({
      ...as(MINT),
      meetingId,
      text: 'Career path',
    });
    const templateTopicId =
      world.meetings.saved(meetingId)?.snapshot().topics[0]?.id ?? '';

    await expect(
      world.updateTopic.execute({
        ...as(KRIT),
        meetingId,
        topicId,
        text: 'Krit’s words',
      }),
    ).rejects.toThrow(OneOnOneTopicNotYoursError);
    await world.updateTopic.execute({
      ...as(MINT),
      meetingId,
      topicId,
      text: '  Career path, next year  ',
    });
    await world.updateTopic.execute({
      ...as(KRIT),
      meetingId,
      topicId: templateTopicId,
      text: 'What went well?',
    });

    const topics = world.meetings.saved(meetingId)?.snapshot().topics ?? [];
    expect(topics.find((topic) => topic.id === topicId)?.text).toBe(
      'Career path, next year',
    );
    expect(topics[0]?.text).toBe('What went well?');
  });

  it('takes notes only once started, and refuses one that would overwrite the other’s', async () => {
    const world = setUp();
    const { id: meetingId } = await prepared(world);
    const topicId =
      world.meetings.saved(meetingId)?.snapshot().topics[0]?.id ?? '';

    await expect(
      world.updateTopic.execute({
        ...as(KRIT),
        meetingId,
        topicId,
        note: { text: 'Early', readAt: null },
      }),
    ).rejects.toThrow(OneOnOneMeetingNotStartedError);
    await world.start.execute({ ...as(KRIT), meetingId });
    await world.updateTopic.execute({
      ...as(MINT),
      meetingId,
      topicId,
      note: { text: 'Mint wrote', readAt: null },
    });
    await expect(
      world.updateTopic.execute({
        ...as(KRIT),
        meetingId,
        topicId,
        note: { text: 'Krit wrote', readAt: null },
      }),
    ).rejects.toThrow(OneOnOneTopicChangedError);
  });
});

describe('a one-time 1:1', () => {
  it('keeps its open meeting writable after its slot, so a talk that runs over is noted and finished', async () => {
    const before = setUp({ once: true });
    const { id: meetingId } = await prepared(before);
    await before.start.execute({ ...as(KRIT), meetingId });
    const late = setUp({ once: true, now: AFTER_THE_SLOT });
    const saved = before.meetings.saved(meetingId);
    if (!saved) {
      throw new Error('The meeting was not saved.');
    }
    await late.meetings.save(saved);
    const topicId = saved.snapshot().topics[0]?.id ?? '';

    await late.updateTopic.execute({
      ...as(MINT),
      meetingId,
      topicId,
      note: { text: 'Ran over', readAt: null },
      discussed: true,
    });
    await late.finish.execute({ ...as(KRIT), meetingId });

    expect(late.meetings.saved(meetingId)?.state()).toBe('FINISHED');
  });

  it('starts no agenda left unstarted until after its slot, as the 1:1 then reads as met', async () => {
    const before = setUp({ once: true });
    const { id: meetingId } = await before.open.execute(as(KRIT));
    const late = setUp({ once: true, now: AFTER_THE_SLOT });
    const saved = before.meetings.saved(meetingId);
    if (!saved) {
      throw new Error('The meeting was not saved.');
    }
    await late.meetings.save(saved);

    await expect(
      late.start.execute({ ...as(KRIT), meetingId }),
    ).rejects.toThrow(OneOnOneNotRunningError);
  });

  it('changes no agenda left unstarted past its slot, and offers it as the next meeting no more', async () => {
    const before = setUp({ once: true });
    const { id: meetingId } = await before.open.execute(as(KRIT));
    const late = setUp({ once: true, now: AFTER_THE_SLOT });
    const saved = before.meetings.saved(meetingId);
    if (!saved) {
      throw new Error('The meeting was not saved.');
    }
    await late.meetings.save(saved);

    await expect(
      late.addTopic.execute({ ...as(MINT), meetingId, text: 'Too late' }),
    ).rejects.toThrow(OneOnOneNotRunningError);
    expect(await late.next.execute(as(KRIT))).toMatchObject({
      meeting: null,
      carried: [],
      templateQuestions: [],
    });
  });

  it('answers a second Start past the slot with the meeting’s own refusal', async () => {
    const before = setUp({ once: true });
    const { id: meetingId } = await before.open.execute(as(KRIT));
    await before.start.execute({ ...as(KRIT), meetingId });
    const late = setUp({ once: true, now: AFTER_THE_SLOT });
    const saved = before.meetings.saved(meetingId);
    if (!saved) {
      throw new Error('The meeting was not saved.');
    }
    await late.meetings.save(saved);

    await expect(
      late.start.execute({ ...as(MINT), meetingId }),
    ).rejects.toThrow(OneOnOneMeetingAlreadyStartedError);
  });

  it('opens no meeting once its slot has passed, nor a second once one is finished', async () => {
    const late = setUp({ once: true, now: AFTER_THE_SLOT });
    await expect(late.open.execute(as(KRIT))).rejects.toThrow(
      OneOnOneNotRunningError,
    );

    const world = setUp({ once: true });
    const meetingId = await aMeetingRun(world);
    await world.finish.execute({ ...as(KRIT), meetingId });
    await expect(world.open.execute(as(KRIT))).rejects.toThrow(
      OneOnOneNotRunningError,
    );
  });
});

describe('finishing a meeting', () => {
  it('carries what was not reached into the next one', async () => {
    const world = setUp();
    const meetingId = await aMeetingRun(world);
    await world.finish.execute({ ...as(MINT), meetingId });

    const next = await world.next.execute(as(KRIT));

    expect(next.meeting).toBeNull();
    expect(next.carried).toEqual([
      "What's in your way?",
      'What do you need from me?',
    ]);
    expect(next.templateQuestions).toEqual([]);
    const { id } = await world.open.execute(as(KRIT));
    expect(
      world.meetings
        .saved(id)
        ?.snapshot()
        .topics.filter((topic) => topic.source === 'CARRIED'),
    ).toHaveLength(2);
  });

  it('keeps finished meetings to read back, newest first, the same for both', async () => {
    const world = setUp();
    const first = await aMeetingRun(world);
    await world.finish.execute({ ...as(KRIT), meetingId: first });
    const second = await aMeetingRun(world);
    await world.finish.execute({ ...as(KRIT), meetingId: second });

    const forKrit = await world.past.execute({
      ...as(KRIT),
      page: { afterId: null, limit: 10 },
    });
    const forMint = await world.past.execute({
      ...as(MINT),
      page: { afterId: null, limit: 10 },
    });

    expect(forKrit.items.map((meeting) => meeting.id)).toEqual([second, first]);
    expect(forMint.items).toEqual(forKrit.items);
    expect(forKrit.items[0]?.topics[0]?.notes).toBe('Shipped on time');
  });
});
