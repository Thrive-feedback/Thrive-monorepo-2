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
      feedCardAudienceOf({ visibility, receivers: [person('ann')] }).label,
    ).toBe(label);
  });

  it('does not tell a Receiver of several that it was kept to them alone', () => {
    expect(
      feedCardAudienceOf({
        visibility: 'ONLY_ME',
        receivers: [person('ann'), person('ben')],
      }).label,
    ).toBe("Only the people it's for");
  });

  it('keeps the words of a wider audience, however many it was written to', () => {
    expect(
      feedCardAudienceOf({
        visibility: 'EVERYONE',
        receivers: [person('ann'), person('ben')],
      }).label,
    ).toBe('Everyone in the Workspace');
  });
});
