import { describe, expect, it } from 'bun:test';
import {
  InvitationEmail,
  type InvitationEmailDetails,
} from './invitation-email.vo';

const NOW = new Date('2026-10-10T03:00:00Z');
const SEVEN_DAYS_LATER = new Date('2026-10-17T03:00:00Z');

function anInvitation(
  overrides: Partial<InvitationEmailDetails> = {},
): InvitationEmailDetails {
  return {
    inviterName: 'Somchai Jaidee',
    workspaceName: 'Acme',
    invitedEmail: 'ann@acme.co',
    acceptUrl:
      'https://thrive.test/invitations/0199a0f0-0000-7000-8000-000000000001',
    expiresAt: SEVEN_DAYS_LATER,
    now: NOW,
    ...overrides,
  };
}

describe('the email that delivers an Invitation', () => {
  it('names who invited and to which Workspace in its subject', () => {
    expect(InvitationEmail.compose(anInvitation()).content().subject).toBe(
      'Somchai Jaidee invited you to join Acme on Thrive',
    );
  });

  it('links to the Invitation, in the HTML and the plain text alike', () => {
    const email = InvitationEmail.compose(anInvitation()).content();

    expect(email.html).toMatch(
      /<a href="https:\/\/thrive\.test\/invitations\/0199a0f0-0000-7000-8000-000000000001"[^>]*>Accept invitation<\/a>/,
    );
    expect(email.text).toContain(
      'Accept invitation: https://thrive.test/invitations/0199a0f0-0000-7000-8000-000000000001',
    );
  });

  it('says which address must sign in to accept it', () => {
    expect(InvitationEmail.compose(anInvitation()).content().text).toContain(
      'Sign in with this email address (ann@acme.co) to accept it.',
    );
  });

  it('says how many days it lasts, rather than a date in some timezone', () => {
    expect(InvitationEmail.compose(anInvitation()).content().text).toContain(
      'This invitation expires in 7 days.',
    );
  });

  it('keeps Thai names as they were typed', () => {
    const email = InvitationEmail.compose(
      anInvitation({ inviterName: 'สมชาย ใจดี', workspaceName: 'บริษัท เอ' }),
    ).content();

    expect(email.subject).toBe(
      'สมชาย ใจดี invited you to join บริษัท เอ on Thrive',
    );
    expect(email.html).toContain('สมชาย ใจดี invited you to join บริษัท เอ');
    expect(email.html).toContain('<meta charset="utf-8">');
  });

  it('escapes markup in a name, so a Workspace name cannot inject HTML', () => {
    const email = InvitationEmail.compose(
      anInvitation({ workspaceName: '<a href="https://evil.test">Acme</a>' }),
    ).content();

    expect(email.html).not.toContain('<a href="https://evil.test">');
    expect(email.html).toContain(
      '&lt;a href=&quot;https://evil.test&quot;&gt;Acme&lt;/a&gt;',
    );
  });

  it('names the address that must sign in, in the HTML too', () => {
    expect(InvitationEmail.compose(anInvitation()).content().html).toContain(
      'ann@acme.co',
    );
  });

  it('keeps the link readable for a client that hides the button', () => {
    const { html } = InvitationEmail.compose(anInvitation()).content();

    expect(html).toContain("If the button doesn't work, open this link:");
  });
});
