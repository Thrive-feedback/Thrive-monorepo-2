# 0090 — Shared with me holds no Kudos

Status:   accepted
Date:     2026-11-15
Deciders: kritpavin

## Context

ADR 0077 put Kudos on Home's list and said that, under `show`, "a Kudos follows what it is": All
Feedback and Everyone in the Workspace hold every Kudos, and Shared with me holds a Kudos that names
the reader as a recipient.

The product owner does not want Kudos under Shared with me. That view is the Feedback someone chose
to share with the reader. A Kudos has no Visibility (ADR 0074), so nobody chose to share it with the
reader, even when it names them. A Kudos that names the reader is already in Received (ADR 0080).

## Decision

**`GET …/feed-items?show=SHARED_WITH_ME` returns Feedback only.** The use case does not read the
Kudos table for that view. All Feedback and Everyone in the Workspace still hold every Kudos, as ADR
0077 says.

This replaces only ADR 0077's sentence about Shared with me. The rest of ADR 0077 still holds.

## Consequences

- **The response shape does not change.** `items` is still a union on `kind`, and Shared with me just
  never contains a `KUDOS` item. This is not a breaking change under `GEN_08` R7.
- A page of Shared with me costs one read fewer.
- `KudosQuery.onHome` keeps its `recipientAccountId` argument, because Received still uses it.

## Alternatives rejected

- **Hide Kudos on the web.** The page size and cursor would then count rows nobody sees, so a page
  could arrive empty while more remain.

## Links

- ADR 0074, ADR 0077 (amended), ADR 0080
