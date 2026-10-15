# 0043 — A photo is Google's link, refreshed at every sign-in

Status:   accepted
Date:     2026-10-15
Deciders: kritpavin

## Context

#184 shows each Member's Google photo instead of their initials. Better Auth already stores
Google's photo **link** in `user.image` when it creates an Account, but no read exposed it. It
was also never written again: Better Auth takes the name and photo at sign-up only, so a photo
changed in Google never arrived.

The card left one technical choice open. Thrive could keep Google's link, or it could copy the
picture into storage of its own. No object storage exists (`PROJECT.md` §4), and Epic #10 has
not chosen a provider.

## Decision

**A photo is the `https` link Google sends, kept in `user.image` and refreshed at every Google
sign-in. Thrive stores no picture.**

- Google's provider runs with `overrideUserInfoOnSignIn: true`, so every sign-in rewrites the
  name and photo, not only the first.
- That option also rewrites the email. A `user.update.before` hook in
  `apps/api/src/infrastructure/auth/auth.ts` blanks `email` and `emailVerified` on every update,
  so the email stays the one the Account was made with. Invitations and Members are matched on
  it, and Thrive has no flow that changes it on purpose. Better Auth merges a hook's result over
  the update rather than replacing it, so the fields are set to `undefined` (which its adapter
  skips on update), not left out. `auth.integration.spec.ts` proves this.
- Identity reads the link through one mapper, `toPhotoUrl`, which lets only a well-formed `https`
  URL through. It reaches the wire as `photoUrl` (`string | null`) on the session and on every
  `AccountSummary`. There is no `profile` column; the photo belongs to the Account and exists
  before the person introduces themselves.
- The web shows it with `PhotoAvatar`, which keeps the initials until the photo loads and when
  it never does. It fetches the photo with `referrerPolicy="no-referrer"`.

## Consequences

- No migration, no storage, no new dependency, and no new secret on Railway.
- Accounts that signed up before #184 show their photo straight away, because the link was
  already stored.
- A photo changed in Google shows only after the person's next sign-in.
- Thrive depends on Google's image host at render time. If it refuses a request, or the link
  stops working, the person sees initials, never a broken image.
- Thrive's own `user.name` follows Google's. Nothing shows it; it only pre-fills
  *Introduce yourself*.
- A person whose Google address changes keeps their original email in Thrive. That is deliberate
  until Thrive has a way to change it.
- Uploading a photo in Thrive (a later Profile Task) needs storage and a stored shape of its own.
  It will supersede this record.

## Alternatives rejected

- **Copy the picture into object storage at sign-in.** This is independent of Google at render
  time, but it needs a provider Epic #10 has not chosen, a dependency, secrets and a retention
  rule, all for a card sized S. It becomes worth doing with upload.
- **Copy the bytes into Postgres.** This needs no provider, but it puts binary data in the
  session pooler's path and still needs an endpoint to serve it. That is storage built without
  deciding on storage.
- **A `profile.photoUrl` column copied from `user.image`.** This writes the same fact twice, and
  an Account that has not introduced itself would have no photo.
- **`overrideUserInfoOnSignIn` without the email guard.** A renamed Google address would silently
  change the Account's email, and an address another Account already holds would fail the sign-in
  on the unique index.
