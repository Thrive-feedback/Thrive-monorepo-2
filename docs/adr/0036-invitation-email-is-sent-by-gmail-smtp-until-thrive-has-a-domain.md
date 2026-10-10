# 0036 — Invitation email is sent by Gmail SMTP until Thrive has a domain

Status:   accepted
Date:     2026-10-10
Deciders: kritpavin

## Context

#73 sends real Invitations. Its acceptance criteria ask for an email service chosen and recorded
here before building, email that lands in the inbox rather than spam for Google Workspace
recipients, and a test mode that sends no real email.

Better Auth has no email transport of its own; its organization plugin only offers a
`sendInvitationEmail` callback. Every hosted service that sends on our behalf — Resend, Postmark,
Amazon SES — sends only from a domain we own and have verified with SPF, DKIM and DMARC records.
Thrive owns no domain yet. The team does own a Google account, `thrive.email.sender@gmail.com`.

## Decision

**Until Thrive has a domain, the API sends email through Gmail's SMTP server as
`thrive.email.sender@gmail.com`, signed in with an App Password. Resend is the target once a domain
is verified there.**

- Email leaves the application through one port, `EmailSender` in `shared/application/`. The
  Gmail adapter, on `nodemailer`, sits in `infrastructure/email/`, and no use case knows which
  transport is behind it.
- **Every environment sends real email**, a developer's machine included, so whoever tests sees the
  email a recipient would. There is no switch to turn sending off: `GMAIL_SMTP_USER` and
  `GMAIL_SMTP_APP_PASSWORD` are required, and the API refuses to start without them.
- Automated tests never send: they replace `EmailSender` with an in-memory fake.
- The From address is always the Gmail account; its display name is `<inviter> via Thrive`, and
  Reply-To is the inviter's own email, so a reply reaches the person who invited.
- Invitation emails are composed and sent by the Workspace module's use case, not by the plugin's
  callback, because the inviter's name comes from Identity's Profile.

## Alternatives

- **A switch that only logs email locally (`EMAIL_TRANSPORT=log`).** Built first, then removed by
  kritpavin on 2026-10-10: a developer saw "Invitation sent" with nothing sent and took it for a bug.
  Sending for real everywhere keeps what is tested the same as what ships.
- **Resend now.** The simplest SDK and a free tier that covers pre-launch, and still the target.
  Rejected for now only because it needs a verified domain.
- **Resend, Postmark or SES sending from the `gmail.com` address.** None of them can verify
  `gmail.com`, and a message claiming `gmail.com` from someone else's servers fails DMARC and lands
  in spam or is refused. Not possible.
- **Resend's `onboarding@resend.dev` test sender.** Delivers only to the Resend account owner, so
  a PM cannot receive an Invitation sent to their own address. Rejected.
- **Postmark.** The best reputation for transactional email, but it needs a domain as well and
  costs more past a small free tier. Rejected in favour of Resend as the target.
- **Amazon SES.** The cheapest at volume and has a Singapore region, but it needs an AWS account,
  IAM and a request to leave its sandbox, and a domain. Rejected for the setup it needs before the
  first email.

## Consequences

- Gmail allows roughly 500 recipients a day for this kind of account. Invitations are at most 10
  per send, so this is far above pre-launch volume.
- If Google judges the sending automated or abusive, it can lock the account, and every Invitation
  fails until it is unlocked. The use case reports each failure per address and cancels its
  Invitation, so nothing is left pending for an email that never went out.
- The account must have 2-Step Verification on for Google to issue an App Password. The App
  Password is a secret: it lives in each environment's secret store and nowhere else.
- The account keeps a phone number and backup codes as ways to verify, not a passkey alone. The
  first team account, `thrive.manage.team@gmail.com`, could not issue an App Password once its only
  passkey was deleted, which is why this one sends instead.
- Recipients see a `gmail.com` sender. That reads as less professional to a company than a Thrive
  domain would.
- A developer testing locally sends real email to whatever address they type, and uses up the same
  daily quota as the test site. Test with addresses you own.
- **Switch to Resend when** Thrive has a domain verified in Resend, or when daily Invitation volume
  approaches the Gmail limit. The switch is a new `EmailSender` adapter bound in `EmailModule`; no use
  case changes.
