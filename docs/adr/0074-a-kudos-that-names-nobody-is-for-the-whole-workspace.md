# 0074 — A Kudos that names nobody is for the whole Workspace

**Status:** accepted, 2026-10-31

## Context

ADR 0060 made a Kudos need a recipient: `Kudos.give` read them out of the bound Mentions and refused
none with `KUDOS_NEEDS_A_RECIPIENT`. That stops a Giver thanking the team as a whole. "Great launch,
everyone" has nobody to name, and naming all of them is the wrong gesture in a Workspace of forty.

A Kudos is already read by every Member, so nothing about who can read one has to change. Only who
it is for does.

## Decision

**A Kudos with no recipients is for the whole Workspace, and that is the only way to say so.**

- `Kudos.give` no longer refuses. Recipients are still the Mentions, less the Giver, and now may be
  none. `KUDOS_NEEDS_A_RECIPIENT` is gone.
- **There is no "everyone" flag and no column.** No rows in `kudos_recipient` is the whole statement,
  so a Kudos cannot both name people and be for everyone, and nothing is migrated.
- **It holds no list of the Workspace's Members.** Whoever joins later is in the whole Workspace too.
- **A name that binds to nobody counts as no name.** A Kudos of only `@stranger`, or only the Giver's
  own name, is for the whole Workspace. The composer says who it is for before it is sent.
- Every place that names recipients says the whole Workspace when there are none: the channel post
  and the line on a card.

This supersedes the part of ADR 0060 that refuses a Kudos for nobody. The rest of it stands.

## Consequences

- A typing slip no longer stops a send. `@Malli` binds to nobody, so that Kudos goes to the whole
  Workspace rather than being refused, and the composer's "For everyone in your Workspace" is the
  only warning.
- A reader of the list has to treat empty `recipients` as a meaning, not as missing data.
- A later "Kudos for me" read will not find a whole-Workspace Kudos through `kudos_recipient`. It has
  to decide whether those count.
- The brain's `ADR-0045` and its glossary rows for Kudos and Kudos recipient say a Kudos names its
  recipients, and need changing there.

## Alternatives rejected

- **A `forEveryone` flag.** A second way to say what no recipients already says, and a state where it
  and the recipients disagree (`GEN_07` R5).
- **An `@everyone` mention.** It takes one more thing to learn, for what leaving names out says
  already. Binding would also have to treat it as a Member it is not.
- **A row per Member at send time.** Writes forty rows to say one thing, and leaves out whoever joins
  afterwards.
- **Refusing a name that binds to nobody.** It would catch the typing slip above, but the API would
  have to tell a mistyped name from an `@` in ordinary text. The composer shows the outcome instead.

Referenced by: `kudos.entity.ts`, `channel-copy.service.ts`, `giver-to-receivers.tsx`
