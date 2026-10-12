# 0038 — Invitation email is sent by Resend over HTTPS

Status:   accepted
Date:     2026-10-11
Deciders: naroebordin

Supersedes [0036](0036-invitation-email-is-sent-by-gmail-smtp-until-thrive-has-a-domain.md).

## Context

ADR 0036 sends Invitation email through Gmail's SMTP server, and names its own exit condition:
switch to Resend when Thrive has a domain verified there. That switch is now forced rather than
chosen.

Deployed on Railway, every send fails before it reaches Gmail:

```
WARN [GmailSmtpEmailSender] { event: 'email.send_failed', transport: 'gmail',
                              code: 'ESOCKET', responseCode: undefined }
```

`ESOCKET` with no `responseCode` is a socket that never opened — no SMTP dialogue happened, so this
is not a credential or a quota problem. **Railway blocks outbound SMTP (ports 25, 465 and 587) on
its Free, Trial and Hobby plans**, and allows it only on Pro and above. The same `nodemailer`
options reach `smtp.gmail.com:465` from a developer's machine and are refused with `EAUTH`/`535` on
a deliberately wrong password, which places the failure in the platform and not in the adapter.

So Invitations have been failing in production since the API was deployed, and no plan that keeps
SMTP as the transport can work on the current Railway plan.

Thrive is also buying a domain, which removes the constraint 0036 was built around. Which domain is
a business fact and belongs in `Thrive-brain/STATE.md`, not here; this decision only requires that
one exists and is verified.

## Decision

**The API sends email by `POST`ing Resend's HTTPS API, as a subdomain of a domain Thrive owns.**

- **HTTPS, not SMTP.** The transport is `https://api.resend.com/emails` on port 443. This is what
  makes the decision robust rather than a workaround: a platform that filters SMTP ports cannot
  affect it, and no hosting plan has to be bought to send an email.
- **A sending subdomain**, `send.<domain>`, carries Resend's SPF and DKIM records. The apex keeps
  its own SPF free for a future inbound provider — only one SPF record per name is legal, so sending
  from the apex would collide with any mailbox Thrive later adds there. It also keeps Invitation
  sending reputation off the apex.
- **The From address is configuration**, `RESEND_FROM_ADDRESS`, and is capability-neutral
  (`no-reply@send.<domain>`). `EmailSender` "belongs to no capability", so the address it sends as
  must not name one; Feedback requests (#15) will send through the same adapter.
- **Reply-To remains the inviter's own email**, unchanged from 0036, so a reply reaches the person
  who invited.
- **No transport switch and no environment branch.** `RESEND_API_KEY` and `RESEND_FROM_ADDRESS` are
  required at boot and every environment sends real email, a developer's machine included — 0036
  built a log-only local switch, removed it on 2026-10-10 because a developer read "Invitation sent"
  with nothing sent as a bug, and that reasoning is unchanged.
- **The outbound call carries a timeout and bounded retries** (`BE_23`), and a caller-supplied
  `Idempotency-Key` so a retried send cannot deliver twice.
- Automated tests still replace `EmailSender` with an in-memory fake and send nothing.

`EmailMessage` gains one field, `idempotencyKey`. 0036 promised the transport could change without
touching a use case, and this is the one place that promise does not hold: a retry is only safe if
the caller names which logical email is being retried, and only the caller knows that two sends to
the same address are two different Invitations. Deriving the key inside the adapter from the message
content would silently discard the second of two legitimate sends within Resend's 24-hour window —
which is exactly what happens when an Invitation fails, is revoked, and is sent again.

## Alternatives

- **Railway Pro.** Unblocks SMTP with no code change at all, which is why it was considered first.
  Rejected: about $240 a year against roughly $11 for a domain, and it buys only the port — the
  sender stays `gmail.com`, the roughly 500 recipients a day stays, and Google can still lock the
  account. Paying a plan tier to keep a liability 0036 already wrote down is the wrong purchase. It
  remains the same-day fallback if email must work before DNS propagates.
- **Gmail API over HTTPS, as the same account.** Free, needs no domain, and keeps the existing
  sender; Google signs the message so DMARC passes. Rejected: `gmail.send` is a sensitive scope, and
  a consent screen left in Testing status caps refresh tokens at seven days, so sending dies weekly
  with no error a developer would see. Escaping that needs Google verification, and `Internal` user
  type is unavailable because the account is a personal `gmail.com` one, not a Workspace.
- **An SMTP-to-HTTPS bridge on another host.** Keeps the existing adapter and routes around the
  port. Rejected: it trades one file for a mail relay Thrive would have to run, secure and keep up,
  and it still needs an email provider behind it, so it buys nothing the direct API does not.
- **SendGrid instead of Resend.** The same HTTPS transport and therefore equally correct. Rejected
  on cost: its permanent free tier ended in March 2025, leaving a 60-day trial and then about $20 a
  month, where Resend's free tier is 3,000 emails a month at no cost. 0036 already named Resend as
  the target and no new fact argues against it.
- **Any provider sending as the existing `gmail.com` address**, using single-sender verification
  instead of a domain. Rejected, and worth recording precisely because it looks like it removes the
  domain purchase: the provider signs with its own DKIM and its own return path, so neither
  identifier aligns with a `gmail.com` From address. `_dmarc.gmail.com` publishes `p=none`, so such
  a message is **not rejected** — it is accepted, the API answers `202`, and the email is
  spam-foldered. The use case would record a sent Invitation that nobody received, which is worse to
  operate than the current visible failure and defeats 0036's per-address failure reporting.

## Consequences

- Resend's free tier allows 3,000 emails a month and **100 a day**, and the daily cap binds first.
  Invitations are at most 10 per send, so this is far above pre-launch volume — but the cap is
  shared across every email the API sends, not per feature. When Feedback requests (#15) start
  sending, the headroom halves. Check it before assuming room.
- Delivery now depends on DNS records outside this repository. If the sending subdomain's records
  are removed or the domain lapses, every send fails authentication rather than erroring, so this is
  a failure that needs watching rather than catching.
- A third-party vendor sits in the registration path. Resend being down means no Invitation goes
  out; the use case still reports failure per address and revokes the Invitation, so nothing is left
  pending.
- Recipients see a Thrive domain instead of `gmail.com`, and SPF, DKIM and DMARC all align. This is
  the acceptance criterion #73 asked for and 0036 could not meet.
- The Gmail account's App Password has no consumer left and is revoked. `nodemailer` is removed from
  `apps/api`; the API now has no SMTP client at all.
- `EmailMessage` carries an `idempotencyKey` that a transport without idempotency would ignore. That
  is a field in the port that exists for one implementation, and it is the cost of retrying safely.
- The web app is **not** moved to the new domain by this decision. It still answers on its Railway
  address; moving it changes `BETTER_AUTH_URL`, `CORS_ALLOWED_ORIGINS` and the Google OAuth client's
  redirect URI, and is its own change.
- **Switch away from Resend when** daily volume approaches its cap, at which point Amazon SES is
  roughly $0.10 per thousand. The switch is a new `EmailSender` adapter bound in `EmailModule`.
