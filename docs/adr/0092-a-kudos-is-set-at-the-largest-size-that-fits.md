# 0092 — A Kudos is set at the largest size that fits its card

Status:   accepted
Date:     2026-11-22
Deciders: kritpavin

## Context

ADR 0073 said the length of a Kudos alone decides how large it is drawn: the web app steps the
Giver's `sizeStep` down from a table of lengths, so a card never scrolls and every reader gets the
same size from the same two values.

The table has to hold for the widest case, the Modern font with Thai. Every other message is then
set too small. A 280-character Kudos in the Signature font, in English, fills about 40% of its card,
with wide empty bands above and below the words. The product owner wants the words to fill the card.

## Decision

**The web app measures the words and sets them as large as fits the card's writing area, from the
size the Giver chose down to the type scale's smallest step.** The size is the chosen step's size
and line height times a share between that floor and one, found by halving on an unseen copy of the
words. The card being written and every card being read do the same measurement. The length table
stays, but only as the first guess, used before anything can be measured: on the server and on the
first paint.

This replaces only ADR 0073's sentence about how large a message is drawn. Nothing is stored, and
the rest of ADR 0073 still holds.

## Consequences

- **Words fill the card in every font and script**, up to the size the Giver chose. The type
  scale's steps are too far apart to do that alone: a 280-character Kudos fitted to a whole step
  still filled only 55–73% of the card.
- **A long Kudos is set between the scale's steps.** The scale still sets its upper and lower
  bounds and every line height, scaled with the size; the share is a measurement, not a design value.
- **A reader can get a different size from the Giver.** The type scale's sizes grow at 48rem and
  64rem, so a card read on a wide screen is measured against other sizes than on a phone. The card
  always fits; its lines already broke differently across those widths before this.
- **A card rendered on the server can grow once after it loads**, from the guess to the measured
  size. The guess is never larger than the fit, so a card is never drawn cut off.
- **Each measurement lays the words out about ten times**, on every keystroke while writing and
  whenever a card's room changes size. Nothing is left in the page between them.
- jsdom lays out nothing, so the component tests cannot see the fit. The search is a pure function,
  and is tested as one.

## Alternatives rejected

- **The largest whole step that fits.** Tried first: the steps are 20–25% apart, so the words
  stopped at 55–73% of the card, which is the empty space this decision exists to remove.
- **A table per font and per script.** Still sized for the widest message in each, so it leaves
  room unused, and it needs measuring again whenever a font changes.
- **A continuous size from the length alone.** It still has to allow for the widest font.

## Links

- ADR 0073 (amended)
