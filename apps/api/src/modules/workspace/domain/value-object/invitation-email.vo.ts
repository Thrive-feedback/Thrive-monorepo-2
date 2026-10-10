const DAY_MS = 24 * 60 * 60 * 1000;

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Names are typed by people, so every one is escaped before it reaches the HTML. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => HTML_ESCAPES[character] ?? character,
  );
}

/**
 * Thrive's light theme, as fixed values: email clients read neither CSS variables nor OKLCH, so
 * each is the hex of the token it names in `packages/tokens`. Change them with the tokens.
 */
const EMAIL_STYLE = {
  /** `--surface-base` */
  page: '#e6e7e6',
  /** `--neutral-50`, the card the message sits on */
  card: '#ffffff',
  /** `--border-muted` */
  divider: '#c9ccca',
  /** `--fg-primary` */
  text: '#08130c',
  /** `--fg-secondary` */
  muted: '#353f38',
  /** `--fg-accent`, the wordmark */
  accent: '#5f3b6f',
  /** `--action-primary` */
  action: '#9360a8',
  /** `--fg-on-action` */
  onAction: '#ffffff',
  /** `--surface-raised`, behind the address that must sign in */
  highlight: '#efe1f5',
  /** `--corner-page` and `--corner-element` */
  cardRadius: '28px',
  buttonRadius: '4px',
  /** Google Sans where the reader has it; email cannot load the app's fonts. */
  font: "'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

interface InvitationHtmlParts {
  readonly inviterName: string;
  readonly workspaceName: string;
  readonly invitedEmail: string;
  readonly acceptUrl: string;
  readonly about: string;
  readonly expires: string;
  readonly ignore: string;
}

/**
 * A single card in a table layout with inline styles, because that is what Gmail, Outlook and
 * Apple Mail all render the same way. Every value from a person is escaped here.
 */
function invitationHtml(parts: InvitationHtmlParts): string {
  const s = EMAIL_STYLE;
  const inviter = escapeHtml(parts.inviterName);
  const workspace = escapeHtml(parts.workspaceName);
  const url = escapeHtml(parts.acceptUrl);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${inviter} invited you to join ${workspace} on Thrive</title>
</head>
<body style="margin:0;padding:0;background-color:${s.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${s.page};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${s.card};border-radius:${s.cardRadius};">
<tr><td style="padding:40px 40px 0 40px;font-family:${s.font};font-size:22px;font-weight:700;color:${s.accent};">Thrive</td></tr>
<tr><td style="padding:24px 40px 0 40px;font-family:${s.font};font-size:24px;line-height:32px;font-weight:700;color:${s.text};">${inviter} invited you to join ${workspace}</td></tr>
<tr><td style="padding:12px 40px 0 40px;font-family:${s.font};font-size:16px;line-height:24px;color:${s.muted};">${escapeHtml(parts.about)}</td></tr>
<tr><td style="padding:32px 40px 0 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="background-color:${s.action};border-radius:${s.buttonRadius};">
<a href="${url}" style="display:inline-block;padding:14px 28px;font-family:${s.font};font-size:16px;font-weight:700;color:${s.onAction};text-decoration:none;">Accept invitation</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:24px 40px 0 40px;font-family:${s.font};font-size:14px;line-height:22px;color:${s.muted};">Sign in with <span style="background-color:${s.highlight};padding:2px 6px;border-radius:${s.buttonRadius};color:${s.text};">${escapeHtml(parts.invitedEmail)}</span> to accept it. ${escapeHtml(parts.expires)}</td></tr>
<tr><td style="padding:24px 40px 0 40px;"><div style="border-top:1px solid ${s.divider};font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td style="padding:16px 40px 40px 40px;font-family:${s.font};font-size:12px;line-height:18px;color:${s.muted};">If the button doesn't work, open this link: <a href="${url}" style="color:${s.accent};word-break:break-all;">${url}</a><br><br>${escapeHtml(parts.ignore)} Replies go to ${inviter}.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export interface InvitationEmailDetails {
  /** The inviter's Profile name, as they introduced themselves. */
  readonly inviterName: string;
  readonly workspaceName: string;
  /** The address invited, which is also the one that must sign in to accept. */
  readonly invitedEmail: string;
  readonly acceptUrl: string;
  readonly expiresAt: Date;
  readonly now: Date;
}

/**
 * The email that delivers an Invitation, in English. It names who invited and to which
 * Workspace, says which address must sign in to accept, and how long the offer lasts — in
 * days rather than as a date, so no reader's timezone can make it wrong.
 */
export class InvitationEmail {
  private constructor(
    private readonly subject: string,
    private readonly html: string,
    private readonly text: string,
  ) {}

  static compose(details: InvitationEmailDetails): InvitationEmail {
    const days = Math.max(
      1,
      Math.round(
        (details.expiresAt.getTime() - details.now.getTime()) / DAY_MS,
      ),
    );
    const lasts = days === 1 ? '1 day' : `${days} days`;
    const invited = `${details.inviterName} invited you to join ${details.workspaceName} on Thrive.`;
    const about = `Thrive is where ${details.workspaceName} asks for, gives and acts on feedback.`;
    const expires = `This invitation expires in ${lasts}.`;
    const signInAs = `Sign in with this email address (${details.invitedEmail}) to accept it.`;
    const ignore = "If you weren't expecting this, you can ignore this email.";

    const text = [
      invited,
      about,
      `Accept invitation: ${details.acceptUrl}`,
      `${expires}\n${signInAs}`,
      ignore,
    ].join('\n\n');

    const html = invitationHtml({
      inviterName: details.inviterName,
      workspaceName: details.workspaceName,
      invitedEmail: details.invitedEmail,
      acceptUrl: details.acceptUrl,
      about,
      expires,
      ignore,
    });

    return new InvitationEmail(
      `${details.inviterName} invited you to join ${details.workspaceName} on Thrive`,
      html,
      text,
    );
  }

  /** The three parts an email needs. */
  content(): {
    readonly subject: string;
    readonly html: string;
    readonly text: string;
  } {
    return { subject: this.subject, html: this.html, text: this.text };
  }
}
