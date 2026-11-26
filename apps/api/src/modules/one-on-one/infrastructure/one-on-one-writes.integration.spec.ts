import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { FakeClock } from '@test/support/clock.fake';
import { v7 as uuidv7 } from 'uuid';
import { oneOnOneKey } from '../application/service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../application/service/one-on-one-meeting-access.service';
import { OneOnOneTemplateCatalogService } from '../application/service/one-on-one-template-catalog.service';
import { AcceptOneOnOneUseCase } from '../application/use-cases/accept-one-on-one.use-case';
import { OpenMeetingUseCase } from '../application/use-cases/meetings/open-meeting.use-case';
import { OneOnOne } from '../domain/entity/one-on-one.entity';
import { OneOnOneSchedule } from '../domain/value-object/one-on-one-schedule.vo';
import { PrismaOneOnOneRepository } from './repository/prisma-one-on-one.repository';
import { PrismaOneOnOneMeetingRepository } from './repository/prisma-one-on-one-meeting.repository';
import { PrismaOneOnOneTemplateRepository } from './repository/prisma-one-on-one-template.repository';

const prismaService = new PrismaService(loadConfiguration().database);
const context = new PrismaTransactionContext(prismaService);
const unitOfWork = new PrismaUnitOfWork(prismaService, context);
const oneOnOnes = new PrismaOneOnOneRepository(context);
const meetings = new PrismaOneOnOneMeetingRepository(context);
const NOW = new Date('2026-11-26T03:00:00.000Z');
const clock = new FakeClock(NOW);
const access = new OneOnOneMeetingAccessService(
  oneOnOnes,
  meetings,
  new OneOnOneTemplateCatalogService(
    new PrismaOneOnOneTemplateRepository(context),
  ),
  { next: () => uuidv7() },
  clock,
);
const accept = new AcceptOneOnOneUseCase(oneOnOnes, unitOfWork, clock);
const openMeeting = new OpenMeetingUseCase(access, meetings, unitOfWork);
const workspaces: string[] = [];

/** An invitation from Ann to Ben in a fresh Workspace id, held without a foreign key. */
async function anInvitation(): Promise<OneOnOne> {
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
        startMinute: 600,
        lengthMinutes: 30,
        templateKey: 'weekly-check-in',
      },
      NOW,
    ),
    note: null,
  });
  await oneOnOnes.save(oneOnOne);
  return oneOnOne;
}

/**
 * Resolves once Postgres shows someone waiting on this key's advisory lock, as the unit of work
 * takes it (`pg_advisory_xact_lock(hashtext(key))`). Only this key counts, so a waiter from another
 * run on the same database never satisfies it; and it gives up, saying so, rather than hang.
 */
async function untilSomeoneWaitsOn(key: string): Promise<void> {
  // Under bun's 5 s test timeout, so this says what went wrong rather than the timeout.
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const rows = await prismaService.$queryRaw<{ waiting: number }[]>`
      SELECT count(*)::int AS waiting FROM pg_locks
      WHERE locktype = 'advisory' AND NOT granted
        AND ((classid::bigint << 32) | objid::bigint) = hashtext(${key})::bigint`;
    if ((rows[0]?.waiting ?? 0) > 0) {
      return;
    }
    await Bun.sleep(10);
  }
  throw new Error(`Nobody waited on the lock for ${key} within 3 seconds.`);
}

/** Holds one 1:1's key in a unit of work until released, as a slow write to it would. */
function holdTheKeyOf(oneOnOneId: string) {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = () => {};
  const isHeld = new Promise<void>((resolve) => {
    held = resolve;
  });
  const holder = unitOfWork.run(
    async () => {
      held();
      await released;
    },
    { serializeOn: oneOnOneKey(oneOnOneId) },
  );
  return { isHeld, release, holder };
}

afterAll(async () => {
  await prismaService.oneOnOne.deleteMany({
    where: { workspaceId: { in: workspaces } },
  });
  await prismaService.$disconnect();
});

describe('writes to one 1:1', () => {
  it('answer an invitation only after another write to it has finished', async () => {
    const oneOnOne = await anInvitation();
    const { id, workspaceId } = oneOnOne.snapshot();
    const { isHeld, release, holder } = holdTheKeyOf(id);
    await isHeld;

    const accepting = accept.execute({
      workspaceId,
      accountId: 'ben',
      oneOnOneId: id,
    });
    await untilSomeoneWaitsOn(oneOnOneKey(id));
    const whileHeld = (await oneOnOnes.findById(workspaceId, id))?.snapshot();
    release();
    await Promise.all([holder, accepting]);

    expect(whileHeld?.status).toBe('INVITED');
    expect((await oneOnOnes.findById(workspaceId, id))?.snapshot().status).toBe(
      'ACTIVE',
    );
  });

  it('open a meeting under the same key as the 1:1, so none opens on one being ended', async () => {
    const oneOnOne = await anInvitation();
    oneOnOne.accept('ben', NOW);
    await oneOnOnes.save(oneOnOne);
    const { id, workspaceId } = oneOnOne.snapshot();
    const { isHeld, release, holder } = holdTheKeyOf(id);
    await isHeld;

    const opening = openMeeting.execute({
      workspaceId,
      accountId: 'ann',
      oneOnOneId: id,
    });
    await untilSomeoneWaitsOn(oneOnOneKey(id));
    const liveWhileHeld = await meetings.findLive(workspaceId, id);
    release();
    await Promise.all([holder, opening]);

    expect(liveWhileHeld).toBeNull();
    expect(await meetings.findLive(workspaceId, id)).not.toBeNull();
  });
});
