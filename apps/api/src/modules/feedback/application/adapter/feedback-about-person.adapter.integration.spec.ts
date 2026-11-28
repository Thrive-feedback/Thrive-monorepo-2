import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { Kudos } from '../../domain/entity/kudos.entity';
import type { ProfileItemKind } from '../../domain/port/feedback-about-person.port';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import {
  Visibility,
  type VisibilityValue,
} from '../../domain/value-object/visibility.vo';
import { PrismaFeedbackRequestQuery } from '../../infrastructure/query/prisma-feedback-request.query';
import { PrismaKudosQuery } from '../../infrastructure/query/prisma-kudos.query';
import { PrismaFeedbackRepository } from '../../infrastructure/repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from '../../infrastructure/repository/prisma-feedback-request.repository';
import { PrismaKudosRepository } from '../../infrastructure/repository/prisma-kudos.repository';
import { FeedbackAboutPersonAdapter } from './feedback-about-person.adapter';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const feedbackRepository = new PrismaFeedbackRepository(context);
const requestRepository = new PrismaFeedbackRequestRepository(context);
const kudosRepository = new PrismaKudosRepository(context);
const port = new FeedbackAboutPersonAdapter(
  new PrismaFeedbackRequestQuery(context),
  new PrismaKudosQuery(context),
);

const feedbackWritten: string[] = [];
const requestsWritten: string[] = [];
const kudosWritten: string[] = [];

afterAll(async () => {
  await prismaService.feedbackRequest.deleteMany({
    where: { id: { in: requestsWritten } },
  });
  await prismaService.feedback.deleteMany({
    where: { id: { in: feedbackWritten } },
  });
  await prismaService.kudos.deleteMany({ where: { id: { in: kudosWritten } } });
  await prismaService.$disconnect();
});

/**
 * Two people in a 1:1 and somebody else, in a Workspace of their own. No Account and no Workspace is
 * created first: Feedback's tables hold their ids without a foreign key.
 */
function aWorkspace() {
  return {
    workspaceId: uuidv7(),
    krit: uuidv7(),
    mint: uuidv7(),
    nok: uuidv7(),
  };
}

function visibilityOf(
  value: VisibilityValue,
  selected: readonly string[] = [uuidv7()],
): Visibility {
  return Visibility.of({
    value,
    selectedAccountIds: value === 'SELECTED_PEOPLE' ? [...selected] : [],
  });
}

async function offered(details: {
  readonly workspaceId: string;
  readonly giver: string;
  readonly to: readonly string[];
  readonly visibility: VisibilityValue;
  readonly selected?: readonly string[];
}): Promise<string> {
  const id = uuidv7();
  feedbackWritten.push(id);
  await feedbackRepository.save(
    Feedback.offer({
      tags: BoundTags.none(),
      id,
      workspaceId: details.workspaceId,
      giverAccountId: details.giver,
      receiverAccountIds: [...details.to],
      visibility: visibilityOf(details.visibility, details.selected),
      message: FeedbackMessage.of('The demo was clear.'),
    }),
  );
  return id;
}

/** `requester` asks `giver`, and is answered unless `answer` is false; the Ask's id comes back. */
async function asked(details: {
  readonly workspaceId: string;
  readonly requester: string;
  readonly giver: string;
  readonly answer: boolean;
}): Promise<string> {
  const requestId = uuidv7();
  requestsWritten.push(requestId);
  const ask = { askId: uuidv7(), giverAccountId: details.giver };
  const request = FeedbackRequest.send({
    id: requestId,
    workspaceId: details.workspaceId,
    requesterAccountId: details.requester,
    message: RequestMessage.of('How did the onboarding doc land?'),
    visibility: visibilityOf('ONLY_ME'),
    tags: BoundTags.none(),
    givers: [ask],
  });
  await requestRepository.save(request);
  if (details.answer) {
    const answer = request.answerAsk({
      ...ask,
      feedbackId: uuidv7(),
      message: FeedbackMessage.of('The setup section saved me a day.'),
      tags: BoundTags.none(),
    });
    if (!answer) {
      throw new Error('The request does not hold the Ask.');
    }
    await requestRepository.saveAnswer(request, answer);
    feedbackWritten.push(answer.snapshot().id);
  }
  return ask.askId;
}

async function kudos(
  workspaceId: string,
  giver: string,
  ...naming: string[]
): Promise<string> {
  const id = uuidv7();
  kudosWritten.push(id);
  await kudosRepository.save(
    Kudos.give({
      id,
      workspaceId,
      giverAccountId: giver,
      message: KudosMessage.of('Thank you for staying late.'),
      tags: BoundTags.of({
        workspaceGoals: [],
        mentions: naming.map((accountId, index) => ({
          accountId,
          slug: `person-${index}`,
          displayName: `Person ${index}`,
        })),
      }),
      card: null,
    }),
  );
  return id;
}

function isOnMintsProfileForKrit(
  world: ReturnType<typeof aWorkspace>,
  kind: ProfileItemKind,
  id: string,
) {
  return port.isOnProfileFor({
    workspaceId: world.workspaceId,
    readerAccountId: world.krit,
    aboutAccountId: world.mint,
    kind,
    id,
  });
}

describe('whether an item is on a Member’s Profile for one reader', () => {
  it('finds what everyone sees, what was shared with the reader, and what is between the two', async () => {
    const world = aWorkspace();
    const { workspaceId, krit, mint, nok } = world;
    const items: [ProfileItemKind, string][] = [
      [
        'FEEDBACK',
        await offered({
          workspaceId,
          giver: nok,
          to: [mint],
          visibility: 'EVERYONE',
        }),
      ],
      [
        'FEEDBACK',
        await offered({
          workspaceId,
          giver: nok,
          to: [mint],
          visibility: 'SELECTED_PEOPLE',
          selected: [krit],
        }),
      ],
      [
        'FEEDBACK',
        await offered({
          workspaceId,
          giver: krit,
          to: [mint],
          visibility: 'ONLY_ME',
        }),
      ],
      [
        'FEEDBACK',
        await offered({
          workspaceId,
          giver: mint,
          to: [krit],
          visibility: 'ONLY_ME',
        }),
      ],
      [
        'FEEDBACK',
        await offered({
          workspaceId,
          giver: nok,
          to: [krit, mint],
          visibility: 'ONLY_ME',
        }),
      ],
      ['KUDOS', await kudos(workspaceId, nok, mint)],
      ['KUDOS', await kudos(workspaceId, mint, krit)],
      [
        'ASK',
        await asked({
          workspaceId,
          requester: mint,
          giver: krit,
          answer: false,
        }),
      ],
      [
        'ASK',
        await asked({
          workspaceId,
          requester: krit,
          giver: mint,
          answer: false,
        }),
      ],
    ];

    const found = await Promise.all(
      items.map(([kind, id]) => isOnMintsProfileForKrit(world, kind, id)),
    );

    expect(found).toEqual(items.map(() => true));
  });

  it('never finds what somebody else kept from the reader, an answered Ask, or an id of another kind', async () => {
    const world = aWorkspace();
    const { workspaceId, mint, nok } = world;
    const keptToMint = await offered({
      workspaceId,
      giver: nok,
      to: [mint],
      visibility: 'ONLY_ME',
    });
    const sharedWithSomebodyElse = await offered({
      workspaceId,
      giver: nok,
      to: [mint],
      visibility: 'SELECTED_PEOPLE',
      selected: [uuidv7()],
    });
    const mintToNok = await offered({
      workspaceId,
      giver: mint,
      to: [nok],
      visibility: 'EVERYONE',
    });
    const forTheWorkspace = await kudos(workspaceId, nok);
    const answeredAsk = await asked({
      workspaceId,
      requester: mint,
      giver: world.krit,
      answer: true,
    });
    const askOfSomebodyElse = await asked({
      workspaceId,
      requester: mint,
      giver: nok,
      answer: false,
    });

    const found = await Promise.all([
      isOnMintsProfileForKrit(world, 'FEEDBACK', keptToMint),
      isOnMintsProfileForKrit(world, 'FEEDBACK', sharedWithSomebodyElse),
      isOnMintsProfileForKrit(world, 'FEEDBACK', mintToNok),
      isOnMintsProfileForKrit(world, 'KUDOS', forTheWorkspace),
      isOnMintsProfileForKrit(world, 'ASK', answeredAsk),
      isOnMintsProfileForKrit(world, 'ASK', askOfSomebodyElse),
      isOnMintsProfileForKrit(world, 'KUDOS', keptToMint),
    ]);

    expect(found).toEqual([false, false, false, false, false, false, false]);
  });

  it('finds nothing of one Workspace from another', async () => {
    const world = aWorkspace();
    const elsewhere = await offered({
      workspaceId: uuidv7(),
      giver: world.krit,
      to: [world.mint],
      visibility: 'EVERYONE',
    });

    expect(await isOnMintsProfileForKrit(world, 'FEEDBACK', elsewhere)).toBe(
      false,
    );
  });
});
