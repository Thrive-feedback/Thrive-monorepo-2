import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import type { NotificationToRecord } from '../../domain/repository/notification-repository.port';
import type { NotificationTypeValue } from '../../domain/value-object/notification-type.vo';
import { PrismaNotificationQuery } from '../query/prisma-notification.query';
import { PrismaNotificationRepository } from './prisma-notification.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const transactionContext = new PrismaTransactionContext(prismaService);
const repository = new PrismaNotificationRepository(transactionContext);
const query = new PrismaNotificationQuery(transactionContext);
const idGenerator = new UuidIdGenerator();

const ONE_PAGE = { page: 1, pageSize: 20 };
const READ_AT = new Date('2026-10-24T09:00:00.000Z');

/** Every id this file wrote, so the run removes exactly what it created and nothing else. */
const writtenWorkspaceIds: string[] = [];

afterAll(async () => {
  await prismaService.notification.deleteMany({
    where: { workspaceId: { in: writtenWorkspaceIds } },
  });
  await prismaService.$disconnect();
});

/**
 * A Workspace nothing else in this file uses, so each test stands alone whatever order they run
 * in and whatever else is in the database.
 */
function aWorkspace(): string {
  const workspaceId = idGenerator.next();
  writtenWorkspaceIds.push(workspaceId);
  return workspaceId;
}

function anAccount(): string {
  return idGenerator.next();
}

function aNotification(
  workspaceId: string,
  recipientAccountId: string,
  overrides: Partial<{
    type: NotificationTypeValue;
    actorAccountId: string;
    subjectId: string;
  }> = {},
): NotificationToRecord {
  return {
    id: idGenerator.next(),
    workspaceId,
    recipientAccountId,
    type: 'ASK_RECEIVED',
    actorAccountId: anAccount(),
    // Derived per row unless a test says otherwise, so two tests cannot collide on the
    // idempotency index and leave a `recordAll` quietly writing nothing.
    subjectId: idGenerator.next(),
    ...overrides,
  };
}

describe('recording what Members are told', () => {
  it('writes one row per recipient of one event, in one call', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const ben = anAccount();
    const subjectId = idGenerator.next();

    await repository.recordAll([
      aNotification(workspaceId, ann, { subjectId }),
      aNotification(workspaceId, ben, { subjectId }),
    ]);

    expect(await query.unreadCountFor(workspaceId, ann)).toBe(1);
    expect(await query.unreadCountFor(workspaceId, ben)).toBe(1);
  });

  it('leaves one line when the same thing is recorded for the same person twice', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const subjectId = idGenerator.next();
    const first = aNotification(workspaceId, ann, { subjectId });

    await repository.recordAll([first]);
    // A different row — its own id, a different actor — naming the same person, the same kind
    // of thing and the same subject. This is a double-submitted form or a retried request, and
    // the unique index is what refuses it; a read beforehand would be a race both writers win.
    await repository.recordAll([
      aNotification(workspaceId, ann, { subjectId }),
    ]);

    const page = await query.forRecipient(workspaceId, ann, ONE_PAGE);
    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe(first.id);
  });

  it('keeps the duplicate from losing the rest of the batch', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const ben = anAccount();
    const subjectId = idGenerator.next();
    await repository.recordAll([
      aNotification(workspaceId, ann, { subjectId }),
    ]);

    await repository.recordAll([
      aNotification(workspaceId, ann, { subjectId }),
      aNotification(workspaceId, ben, { subjectId }),
    ]);

    expect(await query.unreadCountFor(workspaceId, ann)).toBe(1);
    expect(await query.unreadCountFor(workspaceId, ben)).toBe(1);
  });

  it('tells two kinds of thing about one subject apart', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const subjectId = idGenerator.next();

    await repository.recordAll([
      aNotification(workspaceId, ann, { subjectId, type: 'ASK_RECEIVED' }),
      aNotification(workspaceId, ann, { subjectId, type: 'ASK_ANSWERED' }),
    ]);

    expect(await query.unreadCountFor(workspaceId, ann)).toBe(2);
  });

  it('reads back what it was given, newest first', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const written = aNotification(workspaceId, ann, {
      type: 'FEEDBACK_SHARED',
    });

    await repository.recordAll([written]);

    const [line] = (await query.forRecipient(workspaceId, ann, ONE_PAGE)).items;
    expect(line?.id).toBe(written.id);
    expect(line?.type).toBe('FEEDBACK_SHARED');
    expect(line?.actorAccountId).toBe(written.actorAccountId);
    expect(line?.subjectId).toBe(written.subjectId);
    expect(line?.readAt).toBeNull();
    expect(line?.createdAt).toBeInstanceOf(Date);
  });

  it('writes nothing, and asks nothing, when an event has no recipients left', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();

    await repository.recordAll([]);

    expect(await query.unreadCountFor(workspaceId, ann)).toBe(0);
  });
});

describe('marking one thing read', () => {
  it('takes it out of the count, and says it did', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const written = aNotification(workspaceId, ann);
    await repository.recordAll([written]);

    const marked = await repository.markRead(
      {
        notificationId: written.id,
        workspaceId,
        recipientAccountId: ann,
      },
      READ_AT,
    );

    expect(marked).toBe(true);
    expect(await query.unreadCountFor(workspaceId, ann)).toBe(0);
    const [line] = (await query.forRecipient(workspaceId, ann, ONE_PAGE)).items;
    expect(line?.readAt).toEqual(READ_AT);
  });

  it('refuses another Member’s, leaving it unread', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const ben = anAccount();
    const annsOwn = aNotification(workspaceId, ann);
    await repository.recordAll([annsOwn]);

    const marked = await repository.markRead(
      {
        notificationId: annsOwn.id,
        workspaceId,
        recipientAccountId: ben,
      },
      READ_AT,
    );

    expect(marked).toBe(false);
    expect(await query.unreadCountFor(workspaceId, ann)).toBe(1);
  });

  it('answers false for an id that names nothing', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();

    expect(
      await repository.markRead(
        {
          notificationId: idGenerator.next(),
          workspaceId,
          recipientAccountId: ann,
        },
        READ_AT,
      ),
    ).toBe(false);
  });
});

describe('clearing the bell', () => {
  it('marks everything of the caller’s here, and only here', async () => {
    const acme = aWorkspace();
    const globex = aWorkspace();
    const ann = anAccount();
    await repository.recordAll([
      aNotification(acme, ann),
      aNotification(acme, ann),
      aNotification(globex, ann),
    ]);

    await repository.markAllRead(
      { workspaceId: acme, recipientAccountId: ann },
      READ_AT,
    );

    expect(await query.unreadCountFor(acme, ann)).toBe(0);
    // A Member of several Workspaces reads one bell at a time: clearing the one they are
    // looking at may not quietly mark things they have never seen in another as seen.
    expect(await query.unreadCountFor(globex, ann)).toBe(1);
  });

  it('leaves another Member’s rows in the same Workspace alone', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const ben = anAccount();
    await repository.recordAll([
      aNotification(workspaceId, ann),
      aNotification(workspaceId, ben),
    ]);

    await repository.markAllRead(
      { workspaceId, recipientAccountId: ann },
      READ_AT,
    );

    expect(await query.unreadCountFor(workspaceId, ann)).toBe(0);
    expect(await query.unreadCountFor(workspaceId, ben)).toBe(1);
  });

  it('keeps the instant something was first read when the bell is cleared after it', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    const written = aNotification(workspaceId, ann);
    await repository.recordAll([written, aNotification(workspaceId, ann)]);
    await repository.markRead(
      { notificationId: written.id, workspaceId, recipientAccountId: ann },
      READ_AT,
    );

    const later = new Date('2026-10-25T09:00:00.000Z');
    await repository.markAllRead(
      { workspaceId, recipientAccountId: ann },
      later,
    );

    const page = await query.forRecipient(workspaceId, ann, ONE_PAGE);
    const line = page.items.find((item) => item.id === written.id);
    expect(line?.readAt).toEqual(READ_AT);
    expect(await query.unreadCountFor(workspaceId, ann)).toBe(0);
  });
});

describe('counting what has not been read', () => {
  it('counts only the caller’s unread rows in the Workspace asked about', async () => {
    const acme = aWorkspace();
    const globex = aWorkspace();
    const ann = anAccount();
    const ben = anAccount();
    const read = aNotification(acme, ann);
    await repository.recordAll([
      aNotification(acme, ann),
      aNotification(acme, ann),
      read,
      aNotification(acme, ben),
      aNotification(globex, ann),
    ]);
    await repository.markRead(
      { notificationId: read.id, workspaceId: acme, recipientAccountId: ann },
      READ_AT,
    );

    expect(await query.unreadCountFor(acme, ann)).toBe(2);
  });

  it('counts nothing for a Workspace nobody has told the caller anything in', async () => {
    expect(await query.unreadCountFor(aWorkspace(), anAccount())).toBe(0);
  });
});

describe('reading a page of the bell', () => {
  it('answers the caller’s own rows, newest first, and nobody else’s', async () => {
    const workspaceId = aWorkspace();
    const other = aWorkspace();
    const ann = anAccount();
    const ben = anAccount();
    const mine = [
      aNotification(workspaceId, ann),
      aNotification(workspaceId, ann),
    ];
    await repository.recordAll([
      ...mine,
      aNotification(workspaceId, ben),
      aNotification(other, ann),
    ]);

    const page = await query.forRecipient(workspaceId, ann, ONE_PAGE);

    expect(page.total).toBe(2);
    // Written in one statement, so the two share a `createdAt` to the millisecond; the id
    // breaks the tie, and UUIDv7 ids sort by the instant they were minted.
    expect(page.items.map((item) => item.id)).toEqual(
      [...mine].map((item) => item.id).reverse(),
    );
  });

  it('answers one page at a time, and how many there are altogether', async () => {
    const workspaceId = aWorkspace();
    const ann = anAccount();
    await repository.recordAll([
      aNotification(workspaceId, ann),
      aNotification(workspaceId, ann),
      aNotification(workspaceId, ann),
    ]);

    const page = await query.forRecipient(workspaceId, ann, {
      page: 2,
      pageSize: 2,
    });

    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(1);
  });
});
