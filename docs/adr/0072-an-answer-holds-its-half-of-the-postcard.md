# 0072 — An answer holds its half of the postcard, and one read opens the whole card

**Status:** accepted, 2026-10-31

## Context

ADR 0067 and 0068 put how a Feedback message or a Request message looks on the piece itself. An
answer was left out: it is written on the card of the Ask it answers, so it has no picture, paper or
stamp of its own, and `Feedback.answering` stored `null`. What the Giver does choose, how their words
are set and the stickers they put on the back, had nowhere to go.

`PostcardReadDialog` draws the card of a request with every answer on it. The card's look was only
on `GET /feedback-requests/{id}`, which answers the Requester and the Givers and nobody else, so a
Member who may read an answer on Home could not read the card it is written on.

## Decision

**An answer stores `{ textStyle, stickers }`, and `GET /feedback/{id}` opens the whole card.**

- `POST /feedback-asks/{id}/answers` takes an optional `postcard` of that shape. It goes in the
  `postcard` column Feedback already has, so there is no migration. `AnswerPostcard` holds the same
  rules as `Postcard`, and an answer's stickers stay on the back: the front is whoever asked.
- The column holds two shapes, told apart by `origin`. Reading a row as Offered Feedback leaves an
  answer's `postcard` `null`, because it is part of a card and not one.
- An answer on `GET /feedback/{id}` carries `request`: the Request message, who asked, the card, and
  the answers, in the order their Givers were asked.
- **Every answer is held to its own Visibility**, as `Visibility.letsRead` reads it for one piece.
  The Requester reads all of them. With Only me a Giver reads their own and no other Giver's, so the
  Giver of an answer cannot learn who else answered from this route.
- `feed-items` does not carry looks. Home reads them once, when a postcard is opened.

This does not change ADR 0044. A card is one request's answers, unpaged and with no `total`, so none
of 0044's reasons to filter in the read apply, and `letsRead` stays the one authority. The price is
that `openedRequest` returns answers the reader may not read, so its caller must filter them. It
amends ADR 0067's "an answer is null", and ADR 0054's shape for reading one piece. ADR 0071's "no
Visibility check of their own" holds on Home only because Only me never reaches it.

## Alternatives

- **Looks on `feed-items`.** Every page would carry a card and every answer's stickers, for postcards
  most readers never open.
- **Open `GET /feedback-requests/{id}` to readers of an answer.** That route tells who was asked and
  where each Ask stands to the Requester, and its rule is about the request rather than the answers.
- **Store a full `Postcard` on an answer, copied from the request.** A request not written on a
  postcard has nothing to copy, and the copy could disagree with the card it is on.

## Consequences

- Nothing sends an answer's look yet. Answers are still written in the text form, and draw in the
  default look until the postcard answer ships in Waiting for me.
- A read of one answer costs one more query, which holds every answer of its request.
- That read also parses the request's card and every other answer's look, before the filter runs.
  The stored schemas check closed choices, so retiring a font or a tone without keeping old values
  readable would refuse every answer of a request, plain ones included.
- `feedback.postcard` holds two shapes, so it is read through `toFeedbackPostcardSnapshot`. The day a
  list adds the card it must go through that too, or an answer with a look fails the whole page.
