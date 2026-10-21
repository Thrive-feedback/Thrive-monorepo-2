# Product

<!-- impeccable:product-schema 1 -->

The durable record of what Thrive is lives in the brain, `Thrive-feedback/Thrive-brain`: `vision.md`,
`STATE.md`, `glossary.md` and its ADRs. This file only keeps what design work on the web app needs at
hand, and points there. Where the two disagree, the brain wins.

## Platform

web

## Users

- **Who the public pages speak to:** anyone who leads a team, anywhere — a founder, a team lead,
  someone in HR, the head of a student project (brain `ADR-0038`, 2026-10-21). No country, culture or
  price is named. Who pays is open again; the earlier buyer, a founder of a 20–50 person startup, is
  history (`vision.md`). Zero customer interviews.
- **Users:** everyone on that team, the lead most of all, because the lead going first decides
  whether anyone else speaks up.

## Product Purpose

Thrive is an HRD platform, built by Thai people. Phase 1 is feedback culture: helping people inside a
team ask for, give and act on feedback, for any team where it does not happen yet. Success for the
landing page (O-11) is that whoever leads a team understands what Thrive does for them and signs in.

## Positioning

**Feedback while it still matters** (`ADR-0038`): ask how it went, give feedback unasked, or say
thanks right after it happens, instead of waiting for the review, the retro or the final grade.
Asking keeps its place as *why it works*: a direct question gives people permission to be honest,
and whoever writes the Feedback chooses who reads it.

## Capabilities and Constraints

What works today, per the brain's `STATE.md`:

- Google sign-in, creating a Workspace and inviting teammates by email.
- Admin and Member Roles. Admins can deactivate and reactivate people.
- Asking for, answering and giving Feedback, with Visibility set to Only me, Selected people or
  Everyone.
- The Workspace feed.
- Workspace Goals as `#hashtags` and `@Mentions` in Feedback text.

Planned but not built: **Kudos** (not designed), the **Discord** integration (`ADR-0035`), **Insights**
for Admins, Notifications and Reminders, and personal Goals. The landing page lists Kudos, Discord
and Insights as features with no "on the way", chosen knowingly in `ADR-0038`; it describes Kudos
only by what it is for. Nothing may promise how fast an answer arrives: nothing notifies anybody.

Use the brain's `glossary.md` names exactly: Member, Workspace, Feedback Request, Ask, Topic.
Never say "user".

## Brand Commitments

- English by default and Thai as well, across the web app (`ADR-0038`); Thai is not built yet (#48,
  #233–#235), so the landing page shows an inert EN / TH switch. Thai is written natively, feature
  names stay English.
- The landing page's words are `ADR-0038`'s *The words, as agreed*; change them there first.
- Use the design system in `packages/tokens`, generated from the Blueprint export. Never hand-add
  tokens.

## Evidence on Hand

The landing page cites no research (`ADR-0038`, decision 12). Its proof is the clickable Home
preview and four worked Moments, which are illustrations, not customers.

There are no customers, testimonials, usage counts or prices. Never invent them.

## Product Principles

- Timing first: feedback is worth most right after the moment it is about.
- An invitation to speak beats an obligation to review.
- Whoever writes the Feedback chooses who reads it; it is never imposed.
