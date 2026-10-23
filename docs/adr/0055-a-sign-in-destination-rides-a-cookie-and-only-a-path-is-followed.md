# 0055 — A sign-in destination rides a cookie, and only a path inside Thrive is followed

Status:   accepted
Date:     2026-10-23
Deciders: kritpavin

## Context

#212 asks that a link into Thrive still take a person where it pointed when they had to sign in on
the way — `/home?tab=waiting&ask=<id>` has to open that Ask, not plain Home. Notifications (#13)
depend on it: a message that cannot land you on the thing it is about is a dead end.

Nothing carried the destination. The proxy and `requireMember` both sent a signed-out visitor to
`/signin`, which redirected to Home with nothing kept. Between the two sits a full round trip
through Google: the browser reaches auth only through the web origin (ADR 0027), the API asks Better
Auth for the Google URL, and Google comes back to the one `callbackURL` the API registered,
`/home?signedIn=1`. Nothing of the original address survives that by itself.

A destination read from a URL and redirected to without checking is an open redirect. Every link
this unlocks is meant to be pasted into a chat tool, which is exactly where an address that starts
with Thrive's own and ends somewhere else becomes phishing.

## Decision

**The destination travels in an httpOnly cookie, the proxy spends it on the way back, and only a
relative path inside Thrive is ever followed.**

- The proxy, the one place that knows the address that was blocked, puts it on the sign-in URL as
  `?next=`. Home is left off: it is where signing in lands anyway.
- `signIn` — a server action, so the one place Next lets the server *set* a cookie — writes
  `thrive.sign_in_destination`: httpOnly, SameSite=Lax, path `/`, ten minutes. Lax is what makes it
  survive Google's top-level redirect back. Called with nothing to follow it deletes the cookie, so
  an abandoned attempt cannot steer the next one. The same options carry the Invitation join intent
  (`join-intent.service.ts`), so they live once, in `sign-in-cookie.util.ts`, and are `secure`
  unless the request's origin is plain `http:` — an origin Thrive cannot read costs a local sign-in
  rather than the flag that protects a deployed one.
- **The proxy also follows it, and deletes it in the same response.** It is the only point on the
  way back that can both redirect and write a cookie, so this is what makes a destination
  single-use: it is spent whether or not it was followable, and pressing Back afterwards reaches
  Home like any other sign-in. A server component cannot delete a cookie, so following it in
  `requireMember` would have left it live for ten minutes.
- `toSafeDestination` (`lib/navigation/safe-destination.util.ts`) decides what is a path at all:
  one leading slash, no second slash or backslash after it, printable ASCII only, at most 512
  characters — then parsed against a base and held to that whole rule again, because `/..//host`
  passes it as text, keeps the base's origin while parsing, and still collapses to the address
  `//host`, and because percent-encoding can treble a length that entered within the limit.
  Everything else — an absolute URL, `//host`, `/\host`, a scheme, an encoded, dotted or padded
  variant — is discarded, never corrected.
- `toSignInDestination` (`lib/session/sign-in-destination.constant.ts`) adds the one rule that
  belongs to signing in rather than to addresses: **a destination whose query carries `signedIn` is
  refused.** That parameter is what tells the proxy a request is the way back from Google, so
  landing on an address carrying it would be read as a fresh arrival and followed again. Together
  with the delete above, nothing has to be true about the destination for the loop to be
  impossible — either rule alone closes it. It runs at all three boundaries the destination
  crosses: the `next` search param, the server action's argument, and the cookie on the way back.
- Nothing asks whether the destination exists or whether this person may see it. It is followed
  blind, so a link to something they may not see turns them away exactly as it does today.

## Consequences

- No contract, API or `packages/api` change: `POST /v1/sessions/google` and Better Auth's
  `callbackURL` are untouched, and `session.service.ts` is untouched.
- The destination never appears in Google's state, in the API, or in any address after `/signin`,
  so there is nothing to replay from a browser history or a referrer.
- A person landing on their destination does not see the "Signed in as …" toast: the address they
  are sent to cannot carry `signedIn` without the arrival repeating.
- Because the proxy spends the destination before any page runs, somebody who followed a link but
  has no Profile or no Workspace yet loses it, and loses that toast, on the way to where
  `landingFor` sends them. Where they land is still `landingFor`'s alone (ADR 0030).
- The destination lives ten minutes, dies with the browser session, and is spent on first use. A
  sign-in that fails and is retried from `/signin?error=…` has no `next`, so it lands on Home.
- Only a page the proxy matches can be remembered, because only the proxy knows the address. The
  matcher now covers `/settings` and `/choose-workspace` as well as Home and `/register` — but
  deliberately **not** `/settings/workspace/integrations/*`, where a chat tool returns an Admin
  with an authorisation code in the query (#199). That code must not be copied into a sign-in
  address or a cookie, and that page checks the session itself, as every page does.

## Alternatives rejected

- **Carrying the destination to Google as the `callbackURL`.** The web would send `next` in the body
  of `POST /v1/sessions/google`, and the API would hand it to Better Auth. That is a contract change,
  an API change and a regenerated client for a web concern, and it puts a visitor-supplied path into
  the OAuth state and into an address that comes back through Google — the one place a destination
  is worth keeping out of.
- **Keeping `?next=` on the address all the way through.** There is no address between the sign-in
  page and Google's callback that Thrive controls.
- **Following it in `requireMember`.** It reads better beside the rule for where a person belongs,
  and it keeps the order `landingFor` imposes — but a server component cannot delete a cookie, so
  the destination would be followed again on every return to that address until it expired.
- **Setting the cookie in the proxy and leaving `/signin` alone.** Fewer moving parts, but the
  sign-in action could then no longer clear it without clearing the one the proxy had just written,
  so an abandoned attempt would steer a later sign-in from the landing page.
- **Checking the destination against a list of known routes.** Brittle against every dynamic
  segment and query, and it answers "does this exist" for anyone who asks. A path is a path.
