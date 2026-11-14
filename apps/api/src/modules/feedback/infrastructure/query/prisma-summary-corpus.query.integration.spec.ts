import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { SummaryPeriod } from '../../domain/value-object/summary-period.vo';
import { PrismaSummaryCorpusQuery } from './prisma-summary-corpus.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const query = new PrismaSummaryCorpusQuery(
  new PrismaTransactionContext(prismaService),
);
const idGenerator = new UuidIdGenerator();

const QUARTER = SummaryPeriod.of('2026-Q4').range();
const IN_THE_QUARTER = new Date('2026-10-15T00:00:00.000Z');
/** The instant before the quarter starts, for proving the range is half-open at the bottom. */
const BEFORE_THE_QUARTER = new Date('2026-09-30T23:59:59.999Z');
const PLENTY = 200;

const writtenWorkspaceIds: string[] = [];

afterAll(async () => {
  await prismaService.feedback.deleteMany({
    where: { workspaceId: { in: writtenWorkspaceIds } },
  });
  await prismaService.kudos.deleteMany({
    where: { workspaceId: { in: writtenWorkspaceIds } },
  });
  await prismaService.$disconnect();
});

function aWorkspace(): string {
  const workspaceId = idGenerator.next();
  writtenWorkspaceIds.push(workspaceId);
  return workspaceId;
}

async function giveFeedback(details: {
  readonly workspaceId: string;
  readonly toAccountId: string;
  readonly message: string;
  readonly createdAt?: Date;
}): Promise<string> {
  const id = idGenerator.next();
  await prismaService.feedback.create({
    data: {
      id,
      workspaceId: details.workspaceId,
      giverAccountId: idGenerator.next(),
      message: details.message,
      origin: 'OFFERED',
      visibility: 'ONLY_ME',
      createdAt: details.createdAt ?? IN_THE_QUARTER,
      receivers: { create: [{ accountId: details.toAccountId, position: 0 }] },
    },
  });
  return id;
}

async function giveKudos(details: {
  readonly workspaceId: string;
  readonly toAccountId: string;
  readonly message: string;
  readonly createdAt?: Date;
}): Promise<string> {
  const id = idGenerator.next();
  await prismaService.kudos.create({
    data: {
      id,
      workspaceId: details.workspaceId,
      giverAccountId: idGenerator.next(),
      message: details.message,
      createdAt: details.createdAt ?? IN_THE_QUARTER,
      recipients: { create: [{ accountId: details.toAccountId }] },
    },
  });
  return id;
}

describe('the corpus one summary is written from', () => {
  it('holds the Feedback and the Kudos written to this Member, oldest first', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();
    await giveFeedback({
      workspaceId,
      toAccountId: accountId,
      message: 'second',
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
    });
    await giveKudos({
      workspaceId,
      toAccountId: accountId,
      message: 'first',
      createdAt: new Date('2026-10-02T00:00:00.000Z'),
    });

    const corpus = await query.writtenTo(
      workspaceId,
      accountId,
      QUARTER,
      PLENTY,
    );

    expect(corpus.map((source) => source.message)).toEqual(['first', 'second']);
    expect(corpus.map((source) => source.kind)).toEqual(['KUDOS', 'FEEDBACK']);
  });

  it('never reaches another Workspace, even for the same Member', async () => {
    const workspaceId = aWorkspace();
    const elsewhere = aWorkspace();
    const accountId = idGenerator.next();
    await giveFeedback({
      workspaceId,
      toAccountId: accountId,
      message: 'ours',
    });
    await giveFeedback({
      workspaceId: elsewhere,
      toAccountId: accountId,
      message: 'theirs',
    });
    await giveKudos({
      workspaceId: elsewhere,
      toAccountId: accountId,
      message: 'theirs too',
    });

    const corpus = await query.writtenTo(
      workspaceId,
      accountId,
      QUARTER,
      PLENTY,
    );

    expect(corpus.map((source) => source.message)).toEqual(['ours']);
  });

  it('never reaches another Member of the same Workspace', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();
    await giveFeedback({
      workspaceId,
      toAccountId: accountId,
      message: 'mine',
    });
    await giveFeedback({
      workspaceId,
      toAccountId: idGenerator.next(),
      message: 'somebody else’s',
    });

    const corpus = await query.writtenTo(
      workspaceId,
      accountId,
      QUARTER,
      PLENTY,
    );

    expect(corpus.map((source) => source.message)).toEqual(['mine']);
  });

  it('leaves out what was written before the period began', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();
    await giveFeedback({ workspaceId, toAccountId: accountId, message: 'in' });
    await giveFeedback({
      workspaceId,
      toAccountId: accountId,
      message: 'out',
      createdAt: BEFORE_THE_QUARTER,
    });

    const corpus = await query.writtenTo(
      workspaceId,
      accountId,
      QUARTER,
      PLENTY,
    );

    expect(corpus.map((source) => source.message)).toEqual(['in']);
  });

  it('keeps the newest when there is more than one generation may read', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();
    for (const day of [1, 2, 3, 4]) {
      await giveFeedback({
        workspaceId,
        toAccountId: accountId,
        message: `day ${day}`,
        createdAt: new Date(`2026-10-0${day}T00:00:00.000Z`),
      });
    }

    const corpus = await query.writtenTo(workspaceId, accountId, QUARTER, 2);

    // The two newest, still oldest first — a summary is about where somebody is now.
    expect(corpus.map((source) => source.message)).toEqual(['day 3', 'day 4']);
  });

  it('counts and dates the newest without reading a word of it', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();
    await giveFeedback({
      workspaceId,
      toAccountId: accountId,
      message: 'older',
      createdAt: new Date('2026-10-02T00:00:00.000Z'),
    });
    const newest = await giveKudos({
      workspaceId,
      toAccountId: accountId,
      message: 'newer',
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
    });

    const freshness = await query.freshnessOf(workspaceId, accountId, QUARTER);

    expect(freshness.count).toBe(2);
    expect(freshness.newest?.id).toBe(newest);
  });

  it('says a Member nothing was written to has nothing', async () => {
    const workspaceId = aWorkspace();

    const freshness = await query.freshnessOf(
      workspaceId,
      idGenerator.next(),
      QUARTER,
    );

    expect(freshness).toEqual({ count: 0, newest: null });
  });
});
