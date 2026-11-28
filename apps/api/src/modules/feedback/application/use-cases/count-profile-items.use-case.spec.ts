import { describe, expect, it } from 'bun:test';
import {
  ANN,
  BETWEEN_WORKSPACE_ID,
  betweenDanAndAnn,
  DAN,
  onDay,
} from '@test/support/profile-between.fixture';
import { CountProfileItemsUseCase } from './count-profile-items.use-case';

function setUp() {
  const { feedbackRequestQuery, kudosQuery } = betweenDanAndAnn();
  return {
    useCase: new CountProfileItemsUseCase(feedbackRequestQuery, kudosQuery),
  };
}

const DAN_ON_ANNS = {
  workspaceId: BETWEEN_WORKSPACE_ID,
  accountId: ANN,
  readerAccountId: DAN,
  since: null,
} as const;

describe('counting what a Profile shows its reader', () => {
  it('counts the Feedback and Kudos between them together, and every open Ask', async () => {
    const { useCase } = setUp();

    const counts = await useCase.execute(DAN_ON_ANNS);

    expect([counts.betweenUs, counts.openAsks]).toEqual([8, 2]);
  });

  it('counts from `since` on, except the open Asks, which are counted however old', async () => {
    const { useCase } = setUp();

    const counts = await useCase.execute({
      ...DAN_ON_ANNS,
      since: onDay(20),
    });

    expect([counts.betweenUs, counts.openAsks]).toEqual([3, 2]);
  });

  it('counts nothing as the reader’s own on the Member’s own Profile', async () => {
    const { useCase } = setUp();

    const counts = await useCase.execute({
      ...DAN_ON_ANNS,
      readerAccountId: ANN,
    });

    expect([counts.betweenUs, counts.sharedWithMe, counts.openAsks]).toEqual([
      0, 0, 0,
    ]);
  });
});
