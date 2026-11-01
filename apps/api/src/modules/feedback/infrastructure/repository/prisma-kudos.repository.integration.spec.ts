import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import type { KudosPageRow } from '../../application/query-port/kudos.query-port';
import type { FeedPosition } from '../../application/types/kudos.types';
import { Kudos } from '../../domain/entity/kudos.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import {
  KudosCard,
  type KudosCardSnapshot,
} from '../../domain/value-object/kudos-card.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { KudosMonth } from '../../domain/value-object/kudos-month.vo';
import { PrismaKudosQuery } from '../query/prisma-kudos.query';
import { PrismaKudosRepository } from './prisma-kudos.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaKudosRepository(context);
const query = new PrismaKudosQuery(context);

const written: string[] = [];

const CARD: KudosCardSnapshot = {
  templateKey: 'red-squiggle',
  textStyle: { font: 'classic', sizeStep: 2, align: 'right', ink: 'brick' },
  stickers: [
    {
      stickerKey: 'system/sticker-01-thumbs-up',
      x: 62.5,
      y: 40,
      scale: 1.25,
      rotation: -8,
    },
  ],
};

/**
 * No Account and no Workspace is created first: Kudos' tables hold their ids without a foreign
 * key, as Feedback's do.
 */
function given(workspaceId: string, ...recipientAccountIds: string[]) {
  return givenOn(null, workspaceId, ...recipientAccountIds);
}

function givenOn(
  card: KudosCard | null,
  workspaceId: string,
  ...recipientAccountIds: string[]
) {
  const id = uuidv7();
  written.push(id);
  return Kudos.give({
    id,
    workspaceId,
    giverAccountId: uuidv7(),
    message: KudosMessage.of(`Kudos ${written.length}`),
    tags: BoundTags.of({
      workspaceGoals: [{ workspaceGoalId: uuidv7(), name: 'ownership' }],
      mentions: recipientAccountIds.map((accountId, index) => ({
        accountId,
        slug: `person-${index}`,
        displayName: `Person ${index}`,
      })),
    }),
    card,
  });
}

afterAll(async () => {
  await prismaService.kudos.deleteMany({ where: { id: { in: written } } });
  await prismaService.$disconnect();
});

describe('storing Kudos', () => {
  it('saves it with everyone it is for and what it names, and reads it back the same', async () => {
    const workspaceId = uuidv7();
    const [ben, cara] = [uuidv7(), uuidv7()].sort();
    const kudos = given(workspaceId, ben as string, cara as string);

    await repository.save(kudos);

    const page = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 20 },
      null,
    );
    const snapshot = kudos.snapshot();
    expect(page).toEqual({
      items: [
        {
          id: snapshot.id,
          giverAccountId: snapshot.giverAccountId,
          recipientAccountIds: [ben as string, cara as string],
          message: snapshot.message,
          tags: {
            workspaceGoals: [{ name: 'ownership' }],
            mentions: [
              { slug: 'person-0', displayName: 'Person 0' },
              { slug: 'person-1', displayName: 'Person 1' },
            ],
          },
          card: null,
          createdAt: expect.any(Date),
        },
      ],
      hasMore: false,
    });
  });

  it('reads back the card it was written on, exactly as it was saved', async () => {
    const workspaceId = uuidv7();

    await repository.save(givenOn(KudosCard.of(CARD), workspaceId, uuidv7()));

    const page = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 20 },
      null,
    );
    expect(page.items[0]?.card).toEqual(CARD);
  });
});

describe('paging a Workspace’s Kudos by cursor', () => {
  it('walks every Kudos once, newest first, and only this Workspace’s', async () => {
    const workspaceId = uuidv7();
    const ids: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const kudos = given(workspaceId, uuidv7());
      await repository.save(kudos);
      ids.push(kudos.snapshot().id);
    }
    await repository.save(given(uuidv7(), uuidv7()));

    const first = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 2 },
      null,
    );
    const second = await query.publicIn(
      workspaceId,
      { afterId: first.items.at(-1)?.id ?? null, limit: 2 },
      null,
    );

    expect([...first.items, ...second.items].map((row) => row.id)).toEqual(
      [...ids].reverse(),
    );
    expect(first.hasMore).toBe(true);
    expect(second.hasMore).toBe(false);
  });

  it('still lists a Kudos whose card no longer reads, as one with no card', async () => {
    const workspaceId = uuidv7();
    const kudos = givenOn(KudosCard.of(CARD), workspaceId, uuidv7());
    await repository.save(kudos);
    await prismaService.kudos.update({
      where: { id: kudos.snapshot().id },
      data: {
        card: {
          ...CARD,
          textStyle: { ...CARD.textStyle, ink: 'a-retired-ink' },
        },
      },
    });

    const { items } = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 20 },
      null,
    );

    expect(items.map((row) => row.card)).toEqual([null]);
  });
});

describe('reading a Workspace’s Kudos by month', () => {
  /** A Kudos given at this instant, which only a test can choose. */
  async function givenAt(workspaceId: string, createdAt: string) {
    const kudos = given(workspaceId, uuidv7());
    await repository.save(kudos);
    await prismaService.kudos.update({
      where: { id: kudos.snapshot().id },
      data: { createdAt: new Date(createdAt) },
    });
    return kudos.snapshot().id;
  }

  it('reads the morning of the 1st as that month, on the clock everyone shares', async () => {
    const workspaceId = uuidv7();
    // 06:00 on 1 November at UTC+7 is still 31 October in UTC.
    const november = await givenAt(workspaceId, '2026-10-31T23:00:00.000Z');
    // A second before midnight at UTC+7 is the last of October.
    const october = await givenAt(workspaceId, '2026-10-31T16:59:59.000Z');

    const inNovember = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 20 },
      KudosMonth.of('2026-11').range(),
    );
    const inOctober = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 20 },
      KudosMonth.of('2026-10').range(),
    );

    expect(inNovember.items.map((row) => row.id)).toEqual([november]);
    expect(inOctober.items.map((row) => row.id)).toEqual([october]);
  });

  it('counts each month the same way the filter reads it, newest first', async () => {
    const workspaceId = uuidv7();
    await givenAt(workspaceId, '2026-10-31T23:00:00.000Z');
    await givenAt(workspaceId, '2026-11-02T03:00:00.000Z');
    await givenAt(workspaceId, '2026-10-31T16:59:59.000Z');
    await givenAt(uuidv7(), '2026-09-02T03:00:00.000Z');

    expect(await query.monthsIn(workspaceId)).toEqual([
      { month: '2026-11', count: 2 },
      { month: '2026-10', count: 1 },
    ]);
  });

  it('pages inside a month by the same cursor', async () => {
    const workspaceId = uuidv7();
    await givenAt(workspaceId, '2026-09-02T03:00:00.000Z');
    const older = await givenAt(workspaceId, '2026-10-02T03:00:00.000Z');
    const newer = await givenAt(workspaceId, '2026-10-03T03:00:00.000Z');
    const october = KudosMonth.of('2026-10').range();

    const first = await query.publicIn(
      workspaceId,
      { afterId: null, limit: 1 },
      october,
    );
    const second = await query.publicIn(
      workspaceId,
      { afterId: first.items.at(-1)?.id ?? null, limit: 1 },
      october,
    );

    expect(first.items.map((row) => row.id)).toEqual([newer]);
    expect(first.hasMore).toBe(true);
    expect(second.items.map((row) => row.id)).toEqual([older]);
    expect(second.hasMore).toBe(false);
  });
});

describe('reading a Workspace’s Kudos on Home', () => {
  async function givenWith(
    workspaceId: string,
    createdAt: string,
    ...recipients: string[]
  ) {
    const kudos = given(workspaceId, ...recipients);
    await repository.save(kudos);
    await prismaService.kudos.update({
      where: { id: kudos.snapshot().id },
      data: { createdAt: new Date(createdAt) },
    });
    return kudos.snapshot().id;
  }

  it('walks past a place, a tie included, repeating and skipping nothing', async () => {
    const workspaceId = uuidv7();
    const oldest = await givenWith(workspaceId, '2026-10-01T03:00:00.000Z');
    const tied = [
      await givenWith(workspaceId, '2026-10-02T03:00:00.000Z'),
      await givenWith(workspaceId, '2026-10-02T03:00:00.000Z'),
    ].sort();

    const seen: string[] = [];
    let after: FeedPosition | null = null;
    for (;;) {
      const page: KudosPageRow = await query.onHome(
        workspaceId,
        { after, limit: 1 },
        null,
      );
      seen.push(...page.items.map((row) => row.id));
      if (!page.hasMore) {
        break;
      }
      after = page.items.at(-1) ?? null;
    }

    expect(seen).toEqual([tied[1] as string, tied[0] as string, oldest]);
  });

  it('narrows to the Kudos that name someone', async () => {
    const workspaceId = uuidv7();
    const ben = uuidv7();
    const namesBen = await givenWith(
      workspaceId,
      '2026-10-02T03:00:00.000Z',
      ben,
    );
    await givenWith(workspaceId, '2026-10-02T03:00:00.000Z', uuidv7());
    await givenWith(workspaceId, '2026-10-02T03:00:00.000Z');

    const { items } = await query.onHome(
      workspaceId,
      { after: null, limit: 20 },
      ben,
    );

    expect(items.map((row) => row.id)).toEqual([namesBen]);
  });

  it('knows where a Kudos sits, and only in its own Workspace', async () => {
    const workspaceId = uuidv7();
    const id = await givenWith(workspaceId, '2026-10-02T03:00:00.000Z');

    expect(await query.positionOf(workspaceId, id)).toEqual({
      id,
      createdAt: new Date('2026-10-02T03:00:00.000Z'),
    });
    expect(await query.positionOf(uuidv7(), id)).toBeNull();
  });
});
