import { describe, expect, it } from 'bun:test';
import { type BoundMention, BoundTags } from '../value-object/bound-tags.vo';
import { KudosCard } from '../value-object/kudos-card.vo';
import { KudosMessage } from '../value-object/kudos-message.vo';
import { Kudos } from './kudos.entity';

const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';

function mentionOf(accountId: string, slug: string): BoundMention {
  return { accountId, slug, displayName: slug };
}

function giving(...mentions: BoundMention[]) {
  return givingOn(null, ...mentions);
}

function givingOn(card: KudosCard | null, ...mentions: BoundMention[]) {
  return Kudos.give({
    id: 'kudos-1',
    workspaceId: 'workspace-1',
    giverAccountId: ANN,
    message: KudosMessage.of('Thanks, team.'),
    tags: BoundTags.of({ workspaceGoals: [], mentions }),
    card,
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

  it('keeps the card it was written on', () => {
    const card = {
      templateKey: 'mint-breeze',
      textStyle: {
        font: 'modern',
        sizeStep: 3,
        align: 'center',
        ink: 'forest',
      },
      stickers: [],
    } as const;

    const kudos = givingOn(KudosCard.of(card), mentionOf(BEN, 'ben'));

    expect(kudos.snapshot().card).toEqual(card);
  });

  it('has no card when it was not written on one', () => {
    const kudos = giving(mentionOf(BEN, 'ben'));

    expect(kudos.snapshot().card).toBeNull();
  });

  it('is for the whole Workspace when it mentions nobody', () => {
    expect(giving().snapshot().recipientAccountIds).toEqual([]);
  });

  it('is for the whole Workspace when the only person it mentions is its Giver', () => {
    const kudos = giving(mentionOf(ANN, 'ann'));

    expect(kudos.snapshot().recipientAccountIds).toEqual([]);
    expect(kudos.snapshot().mentions).toHaveLength(1);
  });
});
