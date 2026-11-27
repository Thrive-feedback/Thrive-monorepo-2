import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import { OneOnOneMeeting } from '../../domain/entity/one-on-one-meeting.entity';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { PrismaOneOnOneQuery } from '../query/prisma-one-on-one.query';
import { PrismaOneOnOneMeetingQuery } from '../query/prisma-one-on-one-meeting.query';
import { PrismaOneOnOneRepository } from './prisma-one-on-one.repository';
import { PrismaOneOnOneMeetingRepository } from './prisma-one-on-one-meeting.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const oneOnOnes = new PrismaOneOnOneRepository(context);
const meetings = new PrismaOneOnOneMeetingRepository(context);
const query = new PrismaOneOnOneMeetingQuery(context);
const oneOnOneQuery = new PrismaOneOnOneQuery(context);
const NOW = new Date('2026-11-26T03:00:00.000Z');
const workspaces: string[] = [];

/** A running 1:1 between Ann and Ben in a fresh Workspace id, held without a foreign key. */
async function aRunningOneOnOne() {
  const workspaceId = uuidv7();
  workspaces.push(workspaceId);
  const oneOnOne = OneOnOne.invite({
    id: uuidv7(),
    workspaceId,
    startedByAccountId: 'ann',
    invitedAccountId: 'ben',
    schedule: OneOnOneSchedule.plan(
      {
        cadence: 'WEEKLY',
        weekday: 4,
        templateKey: 'weekly-check-in',
      },
      NOW,
    ),
    note: null,
  });
  oneOnOne.accept('ben', NOW);
  await oneOnOnes.save(oneOnOne);
  return { workspaceId, oneOnOneId: oneOnOne.snapshot().id };
}

function opened(workspaceId: string, oneOnOneId: string) {
  const meeting = OneOnOneMeeting.open({
    id: uuidv7(),
    workspaceId,
    oneOnOneId,
    carried: ['Launch retro'],
    newTopicId: () => uuidv7(),
  });
  meeting.useTemplate({
    templateKey: 'weekly-check-in',
    questions: ['What went well this week?'],
    newTopicId: () => uuidv7(),
  });
  return meeting;
}

afterAll(async () => {
  await prismaService.oneOnOne.deleteMany({
    where: { workspaceId: { in: workspaces } },
  });
  await prismaService.$disconnect();
});

describe('storing meetings', () => {
  it('reads back a meeting whole, agenda included, as it changes', async () => {
    const { workspaceId, oneOnOneId } = await aRunningOneOnOne();
    const meeting = opened(workspaceId, oneOnOneId);
    await meetings.save(meeting);
    const [first, second] = meeting.snapshot().topics;
    meeting.addTopic(uuidv7(), 'ben', 'Career path');
    meeting.removeTopic(first?.id ?? '', 'ann');
    meeting.start('ann', NOW, NOW);
    meeting.writeTopicNote(second?.id ?? '', 'ben', 'Went well', null, NOW);
    await meetings.save(meeting);

    const found = await meetings.findById(
      workspaceId,
      oneOnOneId,
      meeting.snapshot().id,
    );

    expect(found?.snapshot()).toEqual(meeting.snapshot());
    expect(await meetings.findLive(workspaceId, oneOnOneId)).not.toBeNull();
  });

  it('knows the live meeting from the last finished one', async () => {
    const { workspaceId, oneOnOneId } = await aRunningOneOnOne();
    const meeting = opened(workspaceId, oneOnOneId);
    meeting.start('ann', NOW, NOW);
    meeting.finish('ben', NOW);
    await meetings.save(meeting);

    expect(await meetings.findLive(workspaceId, oneOnOneId)).toBeNull();
    expect(
      (await meetings.findLastFinished(workspaceId, oneOnOneId))?.snapshot().id,
    ).toBe(meeting.snapshot().id);
  });
});

describe('a note written to the millisecond', () => {
  it('reads back the very instant it was written, which a stale write is checked against', async () => {
    const { workspaceId, oneOnOneId } = await aRunningOneOnOne();
    const meeting = opened(workspaceId, oneOnOneId);
    const written = new Date('2026-11-26T03:05:07.123Z');
    meeting.start('ann', NOW, NOW);
    const topicId = meeting.snapshot().topics[0]?.id ?? '';
    meeting.writeTopicNote(topicId, 'ben', 'Went well', null, written);
    await meetings.save(meeting);

    const stored = await meetings.findById(
      workspaceId,
      oneOnOneId,
      meeting.snapshot().id,
    );
    const live = await query.findLive(workspaceId, oneOnOneId);

    expect(stored?.snapshot().topics[0]?.notesUpdatedAt?.toISOString()).toBe(
      written.toISOString(),
    );
    expect(live?.topics[0]?.notesUpdatedAt?.toISOString()).toBe(
      written.toISOString(),
    );
  });
});

describe('a 1:1 read with its meeting in progress', () => {
  it('says a meeting is in progress only from its start until its finish', async () => {
    const { workspaceId, oneOnOneId } = await aRunningOneOnOne();
    const inProgress = async () =>
      (await oneOnOneQuery.findFor(workspaceId, oneOnOneId, 'ann'))
        ?.meetingInProgress;
    const meeting = opened(workspaceId, oneOnOneId);
    await meetings.save(meeting);
    expect(await inProgress()).toBe(false);

    meeting.start('ann', NOW, NOW);
    await meetings.save(meeting);
    expect(await inProgress()).toBe(true);

    meeting.finish('ben', NOW);
    await meetings.save(meeting);
    expect(await inProgress()).toBe(false);
  });
});

describe('reading meetings back', () => {
  it('lists finished meetings newest first', async () => {
    const { workspaceId, oneOnOneId } = await aRunningOneOnOne();
    const finishedIds: string[] = [];
    for (const _ of [1, 2]) {
      const meeting = opened(workspaceId, oneOnOneId);
      meeting.start('ann', NOW, NOW);
      meeting.finish('ben', NOW);
      await meetings.save(meeting);
      finishedIds.push(meeting.snapshot().id);
    }

    const page = await query.listFinished(workspaceId, oneOnOneId, {
      afterId: null,
      limit: 10,
    });

    expect(page.items.map((meeting) => meeting.id)).toEqual(
      [...finishedIds].reverse(),
    );
  });

  it("never finds another Workspace's meeting", async () => {
    const { workspaceId, oneOnOneId } = await aRunningOneOnOne();
    const meeting = opened(workspaceId, oneOnOneId);
    await meetings.save(meeting);

    expect(
      await meetings.findById(uuidv7(), oneOnOneId, meeting.snapshot().id),
    ).toBeNull();
  });
});
