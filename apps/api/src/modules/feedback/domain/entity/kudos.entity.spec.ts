import { describe, expect, it } from 'bun:test';
import { KudosNeedsARecipientError } from '../feedback-request.errors';
import { type BoundMention, BoundTags } from '../value-object/bound-tags.vo';
import { KudosMessage } from '../value-object/kudos-message.vo';
import { Kudos } from './kudos.entity';

const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';

function mentionOf(accountId: string, slug: string): BoundMention {
  return { accountId, slug, displayName: slug };
}

function giving(...mentions: BoundMention[]) {
  return Kudos.give({
    id: 'kudos-1',
    workspaceId: 'workspace-1',
    giverAccountId: ANN,
    message: KudosMessage.of('Thanks, team.'),
    tags: BoundTags.of({ workspaceGoals: [], mentions }),
  });
}

describe('giving Kudos', () => {
  it('is for every teammate the message mentions', () => {
    const kudos = giving(mentionOf(BEN, 'ben'), mentionOf(CARA, 'cara'));

    expect(kudos.snapshot().recipientAccountIds).toEqual([BEN, CARA]);
  });

  it('is never for its own Giver, who may still be mentioned', () => {
    const kudos = giving(mentionOf(ANN, 'ann'), mentionOf(BEN, 'ben'));

    expect(kudos.snapshot().recipientAccountIds).toEqual([BEN]);
    expect(kudos.snapshot().mentions).toHaveLength(2);
  });

  it('is refused when it mentions nobody', () => {
    expect(() => giving()).toThrow(KudosNeedsARecipientError);
  });

  it('is refused when the only person it mentions is its Giver', () => {
    expect(() => giving(mentionOf(ANN, 'ann'))).toThrow(
      KudosNeedsARecipientError,
    );
  });
});
