import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FeedbackSummary } from '../../domain/entity/feedback-summary.entity';
import { SummaryPeriod } from '../../domain/value-object/summary-period.vo';
import { SummarySection } from '../../domain/value-object/summary-section.vo';
import { PrismaFeedbackSummaryRepository } from './prisma-feedback-summary.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const transactionContext = new PrismaTransactionContext(prismaService);
const repository = new PrismaFeedbackSummaryRepository(transactionContext);
const idGenerator = new UuidIdGenerator();

const PERIOD = SummaryPeriod.of('2026-Q4');
const GENERATED_AT = new Date('2026-11-08T09:00:00.000Z');
const WATERMARK = new Date('2026-10-20T00:00:00.000Z');
/** One message a point was read from, stored exactly as it is read back. */
const SOURCE = { id: 'one', kind: 'FEEDBACK' } as const;

/** Every id this file wrote, so the run removes exactly what it created and nothing else. */
const writtenWorkspaceIds: string[] = [];

afterAll(async () => {
  await prismaService.feedbackSummary.deleteMany({
    where: { workspaceId: { in: writtenWorkspaceIds } },
  });
  await prismaService.$disconnect();
});

function aWorkspace(): string {
  const workspaceId = idGenerator.next();
  writtenWorkspaceIds.push(workspaceId);
  return workspaceId;
}

function aSummary(
  accountId: string,
  workspaceId: string,
  overrides: {
    readonly theme?: string;
    readonly sourceCount?: number;
    readonly period?: SummaryPeriod;
  } = {},
): FeedbackSummary {
  return FeedbackSummary.written({
    id: idGenerator.next(),
    accountId,
    workspaceId,
    period: overrides.period ?? PERIOD,
    language: 'en',
    sections: [
      SummarySection.of('themes', [
        {
          point: overrides.theme ?? 'Clear in review',
          sources: [SOURCE],
        },
      ]),
    ],
    sourceCount: overrides.sourceCount ?? 3,
    sourceWatermark: WATERMARK,
    promptVersion: 1,
    generatedAt: GENERATED_AT,
  });
}

describe('storing one Member’s summary', () => {
  it('reads back what was written, sections and all', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();

    await repository.save(aSummary(accountId, workspaceId));
    const read = await repository.find(accountId, workspaceId, '2026-Q4');

    expect(read?.language).toBe('en');
    expect(read?.sections.themes).toEqual([
      { point: 'Clear in review', sources: [SOURCE] },
    ]);
    expect(read?.sections.strengths).toEqual([]);
    expect(read?.sourceWatermark).toEqual(WATERMARK);
  });

  it('keeps one summary per period, replacing the one that stood there', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();

    await repository.save(aSummary(accountId, workspaceId));
    await repository.save(
      aSummary(accountId, workspaceId, {
        theme: 'Written again',
        sourceCount: 7,
      }),
    );

    const read = await repository.find(accountId, workspaceId, '2026-Q4');
    expect(read?.sections.themes).toEqual([
      { point: 'Written again', sources: [SOURCE] },
    ]);
    expect(read?.sourceCount).toBe(7);
    expect(
      await prismaService.feedbackSummary.count({ where: { workspaceId } }),
    ).toBe(1);
  });

  it('keeps each period apart, which is what lets history cost nothing', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();

    await repository.save(aSummary(accountId, workspaceId));
    await repository.save(
      aSummary(accountId, workspaceId, {
        period: SummaryPeriod.of('2026-Q3'),
        theme: 'Last quarter',
      }),
    );

    expect(
      (await repository.find(accountId, workspaceId, '2026-Q3'))?.sections
        .themes,
    ).toEqual([{ point: 'Last quarter', sources: [SOURCE] }]);
    expect(
      (await repository.find(accountId, workspaceId, '2026-Q4'))?.sections
        .themes,
    ).toEqual([{ point: 'Clear in review', sources: [SOURCE] }]);
  });

  it('answers nothing for another Member in the same Workspace', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();

    await repository.save(aSummary(accountId, workspaceId));

    expect(
      await repository.find(idGenerator.next(), workspaceId, '2026-Q4'),
    ).toBeNull();
  });

  it('answers nothing for the same Member in another Workspace', async () => {
    const workspaceId = aWorkspace();
    const accountId = idGenerator.next();

    await repository.save(aSummary(accountId, workspaceId));

    expect(
      await repository.find(accountId, aWorkspace(), '2026-Q4'),
    ).toBeNull();
  });
});
