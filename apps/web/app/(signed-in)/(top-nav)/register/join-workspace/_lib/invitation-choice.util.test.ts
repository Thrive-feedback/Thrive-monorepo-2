import { describe, expect, it } from 'vitest';
import { toInvitationChoice } from './invitation-choice.util';

const NOW = new Date('2026-10-12T09:00:00Z');

function invitedTo(name: string, memberCount: number, invitedAt: Date = NOW) {
  return {
    invitationId: '0199a0f0-0000-7000-8000-000000000001',
    workspace: { name, memberCount },
    invitedAt,
  };
}

describe('an Invitation as a choice', () => {
  it('names the Workspace, its size and how long ago the Invitation came', () => {
    expect(
      toInvitationChoice(
        invitedTo('acme corp', 3, new Date('2026-10-10T08:00:00Z')),
        NOW,
      ),
    ).toEqual({
      invitationId: '0199a0f0-0000-7000-8000-000000000001',
      workspaceName: 'acme corp',
      initial: 'A',
      detail: '3 members · Invited 2 days ago',
    });
  });

  it('says one member and today, not "1 members" and "0 days ago"', () => {
    expect(toInvitationChoice(invitedTo('Acme', 1), NOW).detail).toBe(
      '1 member · Invited today',
    );
  });

  it('says one day, not "1 days", for an Invitation a day old', () => {
    expect(
      toInvitationChoice(
        invitedTo('Acme', 2, new Date('2026-10-11T08:00:00Z')),
        NOW,
      ).detail,
    ).toBe('2 members · Invited 1 day ago');
  });

  it('takes a Thai name’s first character whole', () => {
    expect(toInvitationChoice(invitedTo('บริษัท เอ', 2), NOW).initial).toBe('บ');
  });

  it('takes a name’s first character whole when it is a joined emoji', () => {
    expect(toInvitationChoice(invitedTo('👩‍💻 Devs', 2), NOW).initial).toBe(
      '👩‍💻',
    );
  });
});
