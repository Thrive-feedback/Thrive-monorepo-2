import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import { OneOnOneMeeting } from '../../domain/entity/one-on-one-meeting.entity';
import {
  OneOnOneTemplate,
  type OneOnOneTemplateScope,
} from '../../domain/entity/one-on-one-template.entity';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneTemplateContent } from '../../domain/value-object/one-on-one-template-content.vo';
import { PrismaOneOnOneQuery } from '../query/prisma-one-on-one.query';
import { PrismaOneOnOneTemplateQuery } from '../query/prisma-one-on-one-template.query';
import { PrismaOneOnOneRepository } from './prisma-one-on-one.repository';
import { PrismaOneOnOneMeetingRepository } from './prisma-one-on-one-meeting.repository';
import { PrismaOneOnOneTemplateRepository } from './prisma-one-on-one-template.repository';

const prismaService = new PrismaService(loadConfiguration().database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaOneOnOneTemplateRepository(context);
const query = new PrismaOneOnOneTemplateQuery(context);
const oneOnOnes = new PrismaOneOnOneRepository(context);
const oneOnOneQuery = new PrismaOneOnOneQuery(context);
const meetings = new PrismaOneOnOneMeetingRepository(context);
const NOW = new Date('2026-11-26T03:00:00.000Z');
const KRIT = uuidv7();
const MINT = uuidv7();

const workspaces: string[] = [];

/** A fresh Workspace id with no Workspace behind it: the table holds it without a foreign key. */
function aWorkspaceId(): string {
  const workspaceId = uuidv7();
  workspaces.push(workspaceId);
  return workspaceId;
}

function kept(
  workspaceId: string,
  scope: OneOnOneTemplateScope,
  accountId: string,
  name: string,
): OneOnOneTemplate {
  return OneOnOneTemplate.keep({
    id: uuidv7(),
    workspaceId,
    scope,
    by: { accountId, isAdmin: true },
    content: OneOnOneTemplateContent.of({
      name,
      suggestedWhen: 'Whenever',
      questions: [`${name}: first?`, `${name}: second?`],
    }),
  });
}

afterAll(async () => {
  await prismaService.oneOnOne.deleteMany({
    where: { workspaceId: { in: workspaces } },
  });
  await prismaService.oneOnOneTemplate.deleteMany({
    where: { workspaceId: { in: workspaces } },
  });
  await prismaService.$disconnect();
});

describe('PrismaOneOnOneTemplateRepository', () => {
  it('stores a template with its questions in order, and finds it only in its Workspace', async () => {
    const workspaceId = aWorkspaceId();
    const template = kept(workspaceId, 'PERSONAL', KRIT, 'Sprint retro');

    await repository.save(template);

    const found = await repository.findById(
      workspaceId,
      template.snapshot().id,
    );
    expect(found?.snapshot()).toEqual(template.snapshot());
    expect(
      await repository.findById(aWorkspaceId(), template.snapshot().id),
    ).toBeNull();
  });

  it('answers one layer without what it removed, and still finds a removed one by id', async () => {
    const workspaceId = aWorkspaceId();
    const kept1 = kept(workspaceId, 'PERSONAL', KRIT, 'Kept');
    const removed = kept(workspaceId, 'PERSONAL', KRIT, 'Removed');
    removed.remove({ accountId: KRIT, isAdmin: false }, NOW);
    await repository.save(kept1);
    await repository.save(removed);
    await repository.save(kept(workspaceId, 'PERSONAL', MINT, 'Mint’s'));
    await repository.save(kept(workspaceId, 'WORKSPACE', KRIT, 'Ours'));

    const layer = await repository.keptIn(workspaceId, {
      scope: 'PERSONAL',
      ownerAccountId: KRIT,
    });

    expect(layer.map((each) => each.snapshot().name)).toEqual(['Kept']);
    expect(
      (
        await repository.findById(workspaceId, removed.snapshot().id)
      )?.isRemoved(),
    ).toBe(true);
  });
});

describe('PrismaOneOnOneTemplateQuery', () => {
  it("lists the Workspace's then the reader's own, each by name, never another Member's or a removed one", async () => {
    const workspaceId = aWorkspaceId();
    const removed = kept(workspaceId, 'PERSONAL', KRIT, 'Aaa removed');
    removed.remove({ accountId: KRIT, isAdmin: false }, NOW);
    for (const template of [
      kept(workspaceId, 'PERSONAL', KRIT, 'Zebra'),
      kept(workspaceId, 'PERSONAL', KRIT, 'Apple'),
      kept(workspaceId, 'WORKSPACE', MINT, 'Team health'),
      kept(workspaceId, 'PERSONAL', MINT, 'Mint’s'),
      removed,
    ]) {
      await repository.save(template);
    }

    const listed = await query.listSeenBy(workspaceId, KRIT);

    expect(listed.map((row) => [row.scope, row.name])).toEqual([
      ['WORKSPACE', 'Team health'],
      ['PERSONAL', 'Apple'],
      ['PERSONAL', 'Zebra'],
    ]);
  });
});

describe('PrismaOneOnOneQuery, naming the template', () => {
  it("names a 1:1's kept template for both people, and one of Thrive's from code", async () => {
    const workspaceId = aWorkspaceId();
    const own = kept(workspaceId, 'PERSONAL', KRIT, 'Sprint retro');
    await repository.save(own);
    const fromKept = OneOnOne.invite({
      id: uuidv7(),
      workspaceId,
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: OneOnOneSchedule.plan(
        {
          cadence: 'WEEKLY',
          weekday: 4,
          startMinute: 600,
          lengthMinutes: 30,
          templateKey: own.snapshot().id,
        },
        NOW,
      ),
      note: null,
    });
    await oneOnOnes.save(fromKept);

    const forMint = await oneOnOneQuery.findFor(
      workspaceId,
      fromKept.snapshot().id,
      MINT,
    );
    const page = await oneOnOneQuery.listFor(
      workspaceId,
      KRIT,
      { afterId: null, limit: 20 },
      new Date('2000-01-01T00:00:00.000Z'),
    );

    expect(forMint?.templateName).toBe('Sprint retro');
    expect(page.items.map((row) => row.templateName)).toEqual(['Sprint retro']);
  });
});

describe('A 1:1 from a kept template, stored', () => {
  function weekly(templateKey: string) {
    return OneOnOneSchedule.plan(
      {
        cadence: 'WEEKLY',
        weekday: 4,
        startMinute: 600,
        lengthMinutes: 30,
        templateKey,
      },
      NOW,
    );
  }

  it('holds the kept id in its own column, for the 1:1 and its meeting, and clears it on going back to Thrive', async () => {
    const workspaceId = aWorkspaceId();
    const own = kept(workspaceId, 'PERSONAL', KRIT, 'Sprint retro');
    await repository.save(own);
    const keptId = own.snapshot().id;
    const oneOnOne = OneOnOne.invite({
      id: uuidv7(),
      workspaceId,
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: weekly(keptId),
      note: null,
    });
    oneOnOne.accept(MINT, NOW);
    await oneOnOnes.save(oneOnOne);
    const oneOnOneId = oneOnOne.snapshot().id;
    const meeting = OneOnOneMeeting.open({
      id: uuidv7(),
      workspaceId,
      oneOnOneId,
      templateKey: keptId,
      carried: [],
      templateQuestions: own.snapshot().questions,
      newTopicId: () => uuidv7(),
    });
    await meetings.save(meeting);

    const stored = await prismaService.oneOnOne.findUniqueOrThrow({
      where: { id: oneOnOneId },
      select: { templateKey: true, templateId: true },
    });
    const storedMeeting = await prismaService.oneOnOneMeeting.findUniqueOrThrow(
      {
        where: { id: meeting.snapshot().id },
        select: { templateKey: true, templateId: true },
      },
    );
    expect(stored).toEqual({ templateKey: null, templateId: keptId });
    expect(storedMeeting).toEqual({ templateKey: null, templateId: keptId });
    expect(
      (await oneOnOnes.findById(workspaceId, oneOnOneId))?.snapshot().schedule
        .templateKey,
    ).toBe(keptId);
    expect(
      (
        await meetings.findById(workspaceId, oneOnOneId, meeting.snapshot().id)
      )?.snapshot().templateKey,
    ).toBe(keptId);

    oneOnOne.reschedule(MINT, weekly('career-conversation'), NOW);
    await oneOnOnes.save(oneOnOne);

    expect(
      await prismaService.oneOnOne.findUniqueOrThrow({
        where: { id: oneOnOneId },
        select: { templateKey: true, templateId: true },
      }),
    ).toEqual({ templateKey: 'career-conversation', templateId: null });
    expect(
      (await oneOnOneQuery.findFor(workspaceId, oneOnOneId, KRIT))
        ?.templateName,
    ).toBe('Career conversation');
  });

  it('refuses deleting a kept template a 1:1 still names', async () => {
    const workspaceId = aWorkspaceId();
    const own = kept(workspaceId, 'PERSONAL', KRIT, 'Named');
    await repository.save(own);
    await oneOnOnes.save(
      OneOnOne.invite({
        id: uuidv7(),
        workspaceId,
        startedByAccountId: KRIT,
        invitedAccountId: MINT,
        schedule: weekly(own.snapshot().id),
        note: null,
      }),
    );

    // A Prisma query is lazy, so it is run inside a real promise for `rejects` to await.
    await expect(
      (async () =>
        prismaService.oneOnOneTemplate.delete({
          where: { id: own.snapshot().id },
        }))(),
    ).rejects.toThrow();
  });
});
