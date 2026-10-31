import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Kudos } from '../../domain/entity/kudos.entity';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import {
  KudosCard,
  type KudosCardSnapshot,
} from '../../domain/value-object/kudos-card.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
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

    const page = await query.publicIn(workspaceId, {
      afterId: null,
      limit: 20,
    });
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

    const page = await query.publicIn(workspaceId, {
      afterId: null,
      limit: 20,
    });
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

    const first = await query.publicIn(workspaceId, {
      afterId: null,
      limit: 2,
    });
    const second = await query.publicIn(workspaceId, {
      afterId: first.items.at(-1)?.id ?? null,
      limit: 2,
    });

    expect([...first.items, ...second.items].map((row) => row.id)).toEqual(
      [...ids].reverse(),
    );
    expect(first.hasMore).toBe(true);
    expect(second.hasMore).toBe(false);
  });
});
