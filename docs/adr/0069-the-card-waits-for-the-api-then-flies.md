# 0069 — The card waits for the API, then flies

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

ADR 0065 chose the postmark and the airmail flight, and said two things that have stopped being true.
`onSend` was called the moment Send was pressed, with nothing waiting for it, because no API sat
behind the card. And the postmark came down on the first stamp on the side showing.

The card now sends to the API (ADR 0067), which can refuse it, and a card has a stamp in one fixed
corner and stickers anywhere (ADR 0068). A card that flew off before it was refused would have
thrown away what the writer wrote.

## Decision

**The card flies only once the API has taken it, and the postmark always lands on the card's
top-right corner.**

- Pressing Send makes the card inert and shows Send as busy. Nothing leaves the screen yet.
- A card sent from its front, or still turning, turns to its back first, because the back is what
  was written. It waits for the turn for at most a second, as a tab in the background may not run
  it.
- A refusal leaves everything on the card, with the cursor on Send and the caller saying why.
- A card that went is postmarked and flown off, and the dialog closes when the flight settles, or
  at once with reduced motion.

`use-postcard-send.ts` holds this. The motion itself stays in `use-postcard-flight.ts`, as ADR 0065
decided, and the rest of that ADR stands.

## Alternatives

- **Fly at the press, and bring the card back on a refusal.** Rejected: the card would leave and
  return, and the send would look finished before it was.
- **Land the postmark on the stamp or a sticker wherever it was put.** Rejected: a sticker can sit
  anywhere, so the mark landed on the writing. One corner reads the same on every card.

## Consequences

- A slow API shows as a busy Send, and the writer waits.
- A writer whose session has gone leaves the page with no error, because the action redirects.

Supersedes: 0065, in the two points above
Referenced by: `use-postcard-send.ts`
