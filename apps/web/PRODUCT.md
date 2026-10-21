# Product

<!-- impeccable:product-schema 1 -->

The durable record of what Thrive is lives in the brain, `Thrive-feedback/Thrive-brain`: `vision.md`,
`STATE.md`, `glossary.md` and its ADRs. This file only keeps what design work on the web app needs at
hand, and points there. Where the two disagree, the brain wins.

## Platform

web

## Users

- **Buyer:** the founder of a 20–50 person startup, usually with no HR team (brain `vision.md`,
  decided 2026-09-15, untested: zero customer interviews).
- **Users:** everyone in that startup, the founder most of all, because the founder's openness decides
  whether anyone else speaks up.

## Product Purpose

Thrive is an HRD platform, built by Thai people. Phase 1 is feedback culture: helping people inside a
company ask for, give and act on feedback, starting with Thai teams whose habits of *kreng jai* and
saving face keep honest feedback unsaid. Success for the landing page (O-11) is that a founder who
visits understands what Thrive does for their team and signs in.

## Positioning

Thrive starts from **being asked**. A Member asks teammates for *advice* on a Topic, and the person
who asks chooses who else may read the answers. A direct, private question gives people permission
to be honest where open criticism would cost face.

## Capabilities and Constraints

What works today, per the brain's `STATE.md`:

- Google sign-in, creating a Workspace and inviting teammates by email.
- Admin and Member Roles. Admins can deactivate and reactivate people.
- Asking for, answering and giving Feedback, with Visibility set to Only me, Selected people or
  Everyone.
- The Workspace feed.
- Workspace Goals as `#hashtags` and `@Mentions` in Feedback text.

Planned but not built: the Discord integration, Insights for Admins, Notifications and Reminders, and
personal Goals. These may be shown as "on the way", never as available.

Use the brain's `glossary.md` names exactly: Member, Workspace, Feedback Request, Ask, Topic.
Never say "user".

## Brand Commitments

- English-only copy on public pages for now. There is no i18n yet.
- Use the design system in `packages/tokens`, generated from the Blueprint export. Never hand-add
  tokens.

## Evidence on Hand

The research figures cleared for public copy, each shown with its source:

- HBS 2019: 34% more areas and 56% more ways to improve when people are asked for advice.
- Gallup: about 80% of people who got meaningful feedback in the past week are fully engaged.
- Google Project Aristotle: psychological safety was the strongest predictor of team effectiveness.

There are no customers, testimonials, usage counts or prices. Never invent them.

## Product Principles

- Ask first: an invitation to speak beats an obligation to review.
- Privacy is chosen by the person who asks, not imposed on them.
- Claim only what a visitor can do after signing in today.
