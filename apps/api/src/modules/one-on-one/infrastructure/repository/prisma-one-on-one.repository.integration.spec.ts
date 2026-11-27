import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { PrismaOneOnOneQuery } from '../query/prisma-one-on-one.query';
import { PrismaOneOnOneRepository } from './prisma-one-on-one.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaOneOnOneRepository(context);
const query = new PrismaOneOnOneQuery(context);
const NOW = new Date('2026-11-26T03:00:00.000Z');
const FIRST_PAGE = { afterId: null, limit: 20 };
const LONG_AGO = new Date('2000-01-01T00:00:00.000Z');

const workspaces: string[] = [];

/** A fresh Workspace id with no Workspace behind it: the table holds it without a foreign key. */
function aWorkspaceId(): string {
  const workspaceId = uuidv7();
  workspaces.push(workspaceId);
  return workspaceId;
}

const SCHEDULE = OneOnOneSchedule.plan(
  {
    cadence: 'EVERY_TWO_WEEKS',
    weekday: 2,
    templateKey: 'career-conversation',
  },
  NOW,
);

function invited(
  workspaceId: string,
  startedByAccountId: string,
  invitedAccountId: string,
  note: string | null = null,
): OneOnOne {
  return OneOnOne.invite({
    id: uuidv7(),
    workspaceId,
    startedByAccountId,
    invitedAccountId,
    schedule: SCHEDULE,
    note,
  });
}

afterAll(async () => {
  await prismaService.oneOnOne.deleteMany({
    where: { workspaceId: { in: workspaces } },
  });
  await prismaService.$disconnect();
});

describe('storing 1:1s', () => {
  it('reads back what was saved, and what it became once accepted', async () => {
    const workspaceId = aWorkspaceId();
    const oneOnOne = invited(workspaceId, 'sender', 'invitee');
    await repository.save(oneOnOne);
    oneOnOne.accept('invitee', NOW);
    await repository.save(oneOnOne);

    const found = await repository.findById(
      workspaceId,
      oneOnOne.snapshot().id,
    );

    expect(found?.snapshot()).toEqual(oneOnOne.snapshot());
  });

  it('keeps the note sent with the invitation', async () => {
    const workspaceId = aWorkspaceId();
    const oneOnOne = invited(workspaceId, 'sender', 'invitee', 'Career advice');
    await repository.save(oneOnOne);

    const found = await repository.findById(
      workspaceId,
      oneOnOne.snapshot().id,
    );

    expect(found?.snapshot().inviteNote).toBe('Career advice');
    expect(found?.snapshot().schedule).toEqual(SCHEDULE.snapshot());
  });

  it('keeps who it waits on and when another time was suggested', async () => {
    const workspaceId = aWorkspaceId();
    const oneOnOne = invited(workspaceId, 'sender', 'invitee');
    await repository.save(oneOnOne);
    oneOnOne.suggestAnother('invitee', SCHEDULE, 'Tuesday?', NOW);
    await repository.save(oneOnOne);

    const found = await repository.findById(
      workspaceId,
      oneOnOne.snapshot().id,
    );

    expect(found?.snapshot()).toEqual(oneOnOne.snapshot());
    expect(found?.snapshot().invitedAccountId).toBe('sender');
  });

  it('does not count a one-time meeting that is over as open', async () => {
    const workspaceId = aWorkspaceId();
    const oneOnOne = OneOnOne.invite({
      id: uuidv7(),
      workspaceId,
      startedByAccountId: 'ann',
      invitedAccountId: 'ben',
      schedule: OneOnOneSchedule.plan(
        {
          cadence: 'ONCE',
          weekday: 3,
          templateKey: 'weekly-check-in',
          startsOn: '2026-12-02',
        },
        NOW,
      ),
      note: null,
    });
    oneOnOne.accept('ben', NOW);
    await repository.save(oneOnOne);

    expect(
      await repository.existsOpenBetween(workspaceId, 'ann', 'ben', NOW),
    ).toBe(true);
    expect(
      await repository.existsOpenBetween(
        workspaceId,
        'ann',
        'ben',
        new Date('2026-12-03T00:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it("never finds another Workspace's 1:1", async () => {
    const oneOnOne = invited(aWorkspaceId(), 'sender', 'invitee');
    await repository.save(oneOnOne);

    expect(
      await repository.findById(aWorkspaceId(), oneOnOne.snapshot().id),
    ).toBeNull();
  });

  it('knows two people have one open, whichever of them sent it, until it ends', async () => {
    const workspaceId = aWorkspaceId();
    const oneOnOne = invited(workspaceId, 'ann', 'ben');
    await repository.save(oneOnOne);

    expect(
      await repository.existsOpenBetween(workspaceId, 'ben', 'ann', NOW),
    ).toBe(true);
    oneOnOne.end('ann', NOW);
    await repository.save(oneOnOne);
    expect(
      await repository.existsOpenBetween(workspaceId, 'ann', 'ben', NOW),
    ).toBe(false);
  });
});

describe('listing a person’s 1:1s', () => {
  it('lists those they sent and were invited to, ended ones too, and leaves out other people’s', async () => {
    const workspaceId = aWorkspaceId();
    const sent = invited(workspaceId, 'ann', 'ben');
    const received = invited(workspaceId, 'cara', 'ann');
    const others = invited(workspaceId, 'cara', 'dev');
    const ended = invited(workspaceId, 'ann', 'dev');
    ended.end('ann', NOW);
    for (const oneOnOne of [sent, received, others, ended]) {
      await repository.save(oneOnOne);
    }

    const page = await query.listFor(workspaceId, 'ann', FIRST_PAGE, LONG_AGO);

    expect(page.items.map((row) => row.id)).toEqual([
      sent.snapshot().id,
      received.snapshot().id,
      ended.snapshot().id,
    ]);
    expect(page.items[0]?.schedule).toEqual(SCHEDULE.snapshot());
  });

  it('keeps one turned down for whoever sent it, and only while it is recent', async () => {
    const workspaceId = aWorkspaceId();
    const declined = invited(workspaceId, 'ann', 'ben');
    declined.decline('ben', NOW, null);
    await repository.save(declined);

    expect(
      (await query.listFor(workspaceId, 'ann', FIRST_PAGE, LONG_AGO)).items,
    ).toHaveLength(1);
    expect(
      (await query.listFor(workspaceId, 'ben', FIRST_PAGE, LONG_AGO)).items,
    ).toHaveLength(0);
    expect(
      (
        await query.listFor(
          workspaceId,
          'ann',
          FIRST_PAGE,
          new Date(NOW.getTime() + 1),
        )
      ).items,
    ).toHaveLength(0);
  });

  it('pages in the order they were started', async () => {
    const workspaceId = aWorkspaceId();
    const first = invited(workspaceId, 'ann', 'ben');
    const second = invited(workspaceId, 'ann', 'cara');
    await repository.save(first);
    await repository.save(second);

    const page = await query.listFor(
      workspaceId,
      'ann',
      { afterId: null, limit: 1 },
      LONG_AGO,
    );
    const next = await query.listFor(
      workspaceId,
      'ann',
      { afterId: page.nextAfterId, limit: 1 },
      LONG_AGO,
    );

    expect(page.items.map((row) => row.id)).toEqual([first.snapshot().id]);
    expect(next.items.map((row) => row.id)).toEqual([second.snapshot().id]);
    expect(next.nextAfterId).toBeNull();
  });

  it('finds one for somebody in it, and for nobody else', async () => {
    const workspaceId = aWorkspaceId();
    const oneOnOne = invited(workspaceId, 'ann', 'ben');
    await repository.save(oneOnOne);
    const { id } = oneOnOne.snapshot();

    expect((await query.findFor(workspaceId, id, 'ben'))?.id).toBe(id);
    expect(await query.findFor(workspaceId, id, 'cara')).toBeNull();
  });
});
