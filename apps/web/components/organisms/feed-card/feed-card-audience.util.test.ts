import { describe, expect, it } from 'vitest';
import { feedCardAudienceOf } from './feed-card-audience.util';

const person = (accountId: string) => ({
  accountId,
  name: accountId,
  photoUrl: null,
  inactive: false,
});

describe('feedCardAudienceOf', () => {
  it.each([
    ['EVERYONE', 'Everyone in the Workspace'],
    ['SELECTED_PEOPLE', 'Selected people'],
    ['ONLY_ME', 'Only me'],
  ] as const)('names %s for one Receiver', (visibility, label) => {
    expect(
      feedCardAudienceOf(
        { visibility, giver: person('ben'), receivers: [person('ann')] },
        'ann',
      ).label,
    ).toBe(label);
  });

  it('does not tell a Receiver of several that it was kept to them alone', () => {
    expect(
      feedCardAudienceOf(
        {
          visibility: 'ONLY_ME',
          giver: person('cara'),
          receivers: [person('ann'), person('ben')],
        },
        'ann',
      ).label,
    ).toBe("Only the people it's for");
  });

  it('keeps the words of a wider audience, however many it was written to', () => {
    expect(
      feedCardAudienceOf(
        {
          visibility: 'EVERYONE',
          giver: person('cara'),
          receivers: [person('ann'), person('ben')],
        },
        'ann',
      ).label,
    ).toBe('Everyone in the Workspace');
  });

  it('tells the Giver of a private piece it stayed with the person it was for', () => {
    expect(
      feedCardAudienceOf(
        {
          visibility: 'ONLY_ME',
          giver: person('ann'),
          receivers: [person('ben')],
        },
        'ann',
      ).label,
    ).toBe('Only them');
  });

  it('says the same of several, which is the word the Giver chose', () => {
    expect(
      feedCardAudienceOf(
        {
          visibility: 'ONLY_ME',
          giver: person('ann'),
          receivers: [person('ben'), person('cara')],
        },
        'ann',
      ).label,
    ).toBe('Only them');
  });
});
