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
 * Thrive's light theme, as fixed hex: email clients read neither CSS variables nor OKLCH, so each
 * value names the token it copies in `packages/tokens`, and the design's translucent colours are
 * flattened onto the card. Change them with the tokens.
 */
const EMAIL_STYLE = {
  /** The site's page, `--surface-base` to `--surface-subtle`; Outlook shows the first alone. */
  pageTop: '#e6e7e6',
  pageBottom: '#dddedd',
  /** `--surface-overlay` on the page, the Card atom's surface. */
  card: '#ffffff',
  /** `--corner-page`, the Card atom's corners. */
  cardRadius: '28px',
  /** `--action-primary`, the primary Button. */
  action: '#9360a8',
  /** `--action-secondary`, the orange that marks the Workspace's name. */
  secondary: '#ac502e',
  /** `--fg-on-action` */
  onAction: '#ffffff',
  /** `--corner-element`, the Button atom's corners. */
  buttonRadius: '4px',
  /** The greeting and the link. */
  brand: '#804798',
  /** `--primary-400`, the notice under the button. */
  notice: '#a86fc0',
  title: '#191b21',
  body: '#65666a',
  caption: '#abacae',
  divider: '#dedfe0',
  linkBox: '#ebe0f0',
  linkBoxBorder: '#d2b5de',
  /** Google Sans where the reader has it; email cannot load the app's fonts. */
  font: "'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

interface InvitationHtmlParts {
  readonly inviterName: string;
  readonly workspaceName: string;
  readonly acceptUrl: string;
  readonly greeting: string;
  readonly title: string;
  readonly button: string;
  readonly notice: string;
  readonly signOff: string;
}

/** A thin rule standing either side of a line of text, as a table cell. */
function sideRule(color: string): string {
  return `<td width="20%" style="vertical-align:middle;"><div style="border-top:1px solid ${color};font-size:0;line-height:0;">&nbsp;</div></td>`;
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
  const text = `font-family:${s.font};margin:0;`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(parts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${s.pageBottom};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${s.pageTop};background-image:linear-gradient(180deg, ${s.pageTop} 0%, ${s.pageBottom} 100%);">
<tr><td align="center" style="padding:64px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:${s.card};border-radius:${s.cardRadius};">
<tr><td style="padding:32px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><p style="${text}font-size:20px;line-height:28px;font-weight:600;letter-spacing:-0.5px;color:${s.brand};">${escapeHtml(parts.greeting)}</p></td></tr>
<tr><td align="center" style="padding-top:8px;"><h1 style="${text}font-size:24px;line-height:32px;font-weight:600;letter-spacing:-0.5px;color:${s.title};">${escapeHtml(parts.title)}</h1></td></tr>
<tr><td style="padding-top:24px;"><p style="${text}font-size:16px;line-height:24px;color:${s.body};">${inviter} has reserved a spot for you on the <span style="color:${s.secondary};">${workspace}</span> workspace. Your team is waiting to build something great together.<br><br>Here is your access pass:</p></td></tr>
<tr><td align="center" style="padding-top:24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" style="background-color:${s.action};border-radius:${s.buttonRadius};">
<a href="${url}" style="display:block;padding:14px 22px;font-family:${s.font};font-size:16px;line-height:19px;font-weight:600;color:${s.onAction};text-decoration:none;border-radius:${s.buttonRadius};">${escapeHtml(parts.button)}</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding-top:8px;"><p style="${text}font-size:12px;line-height:20px;color:${s.notice};">${escapeHtml(parts.notice)}</p></td></tr>
<tr><td style="padding-top:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${sideRule(s.divider)}
<td align="center" width="1%" style="padding:0 8px;white-space:nowrap;"><p style="${text}font-size:12px;line-height:20px;color:${s.caption};">Or copy this link:</p></td>
${sideRule(s.divider)}
</tr></table>
</td></tr>
<tr><td style="padding-top:8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" style="padding:16px;background-color:${s.linkBox};border:1px solid ${s.linkBoxBorder};border-radius:8px;"><a href="${url}" style="font-family:${s.font};font-size:12px;line-height:18px;color:${s.brand};text-decoration:none;word-break:break-all;">${url}</a></td>
</tr></table>
</td></tr>
<tr><td align="center" style="padding-top:24px;"><p style="${text}font-size:16px;line-height:24px;color:${s.body};">${escapeHtml(parts.signOff)}</p></td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export interface InvitationEmailDetails {
  /** The inviter's Display name, as others see them. */
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
 * days rather than as a date, so no reader's timezone can make it wrong. The person invited
 * may have no Profile yet, so it greets them without a name.
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
    const greeting = 'Hi there,';
    const title = 'You’re on the list!';
    const reserved = `${details.inviterName} has reserved a spot for you on the ${details.workspaceName} workspace. Your team is waiting to build something great together.`;
    const button = 'Join the workspace';
    const notice = `This invitation expires in ${lasts}. Sign in with ${details.invitedEmail} to accept it.`;
    const signOff = 'See you inside, The Thrive Team';

    const text = [
      greeting,
      title,
      reserved,
      `Here is your access pass: ${details.acceptUrl}`,
      notice,
      signOff,
    ].join('\n\n');

    const html = invitationHtml({
      inviterName: details.inviterName,
      workspaceName: details.workspaceName,
      acceptUrl: details.acceptUrl,
      greeting,
      title,
      button,
      notice,
      signOff,
    });

    return new InvitationEmail(
      `Your ticket to join ${details.workspaceName} is ready!`,
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
