import { describe, expect, it } from 'bun:test';
import {
  InvitationEmail,
  type InvitationEmailDetails,
} from './invitation-email.vo';

const NOW = new Date('2026-10-10T03:00:00Z');
const SEVEN_DAYS_LATER = new Date('2026-10-17T03:00:00Z');
const ACCEPT_URL =
  'https://thrive.test/invitations/0199a0f0-0000-7000-8000-000000000001';

function anInvitation(
  overrides: Partial<InvitationEmailDetails> = {},
): InvitationEmailDetails {
  return {
    inviterName: 'Somchai',
    workspaceName: 'Acme',
    invitedEmail: 'ann@acme.co',
    acceptUrl: ACCEPT_URL,
    expiresAt: SEVEN_DAYS_LATER,
    now: NOW,
    ...overrides,
  };
}

describe('the email that delivers an Invitation', () => {
  it('names the Workspace in its subject', () => {
    expect(InvitationEmail.compose(anInvitation()).content().subject).toBe(
      'Your ticket to join Acme is ready!',
    );
  });

  it('says who reserved the spot, and in which Workspace, its name in orange', () => {
    const email = InvitationEmail.compose(anInvitation()).content();

    expect(email.text).toContain(
      'Somchai has reserved a spot for you on the Acme workspace.',
    );
    expect(email.html).toContain(
      'Somchai has reserved a spot for you on the <span style="color:#ac502e;">Acme</span> workspace.',
    );
  });

  it('joins with a button as wide as the card', () => {
    const { html } = InvitationEmail.compose(anInvitation()).content();

    expect(html).toMatch(
      /<td align="center" style="padding-top:24px;">\n<table role="presentation" width="100%" cellpadding="0"[^>]*>(?:(?!<\/table>)[\s\S])*>Join this workspace<\/a>/,
    );
  });

  it('links to the Invitation from the button and the copyable link, and in the plain text', () => {
    const email = InvitationEmail.compose(anInvitation()).content();

    expect(email.html).toMatch(
      /<a href="https:\/\/thrive\.test\/invitations\/0199a0f0-0000-7000-8000-000000000001"[^>]*>Join this workspace<\/a>/,
    );
    expect(email.html).toContain(`>${ACCEPT_URL}</a>`);
    expect(email.text).toContain(`Here is your access pass: ${ACCEPT_URL}`);
  });

  it('carries no pictures, so nothing waits on a reader allowing them', () => {
    expect(
      InvitationEmail.compose(anInvitation()).content().html,
    ).not.toContain('<img');
  });

  it('says how many days it lasts and which address must sign in', () => {
    const email = InvitationEmail.compose(anInvitation()).content();

    for (const body of [email.html, email.text]) {
      expect(body).toContain(
        'This invitation expires in 7 days. Sign in with ann@acme.co to accept it.',
      );
    }
  });

  it('says one day, not "1 days"', () => {
    expect(
      InvitationEmail.compose(
        anInvitation({ expiresAt: new Date('2026-10-11T03:00:00Z') }),
      ).content().text,
    ).toContain('This invitation expires in 1 day.');
  });

  it('keeps Thai names as they were typed', () => {
    const email = InvitationEmail.compose(
      anInvitation({ inviterName: 'สมชาย', workspaceName: 'บริษัท เอ' }),
    ).content();

    expect(email.subject).toBe('Your ticket to join บริษัท เอ is ready!');
    expect(email.html).toContain(
      'สมชาย has reserved a spot for you on the <span style="color:#ac502e;">บริษัท เอ</span> workspace.',
    );
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
});
