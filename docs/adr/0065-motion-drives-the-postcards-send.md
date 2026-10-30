# 0065 — Motion drives the postcard's send

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

Seal & Send in `PostcardDialog` played one CSS keyframe, `.sendAway`: the card faded as it rose a
little, and the dialog closed once the element's animations settled. It did not feel like posting
anything. Four candidate sends were built in `/ui-showcase` and one was chosen, **Postmark &
airmail**:

1. a postmark comes down on the first stamp on the side showing, or in the corner a stamp is put
   in when that side has none;
2. the card gives under it;
3. it flies in an arc out past the top-right of the screen, turning, shrinking and fading, with a
   dashed contrail drawn on behind it.

None of that is a fixed keyframe. The postmark's place depends on where the writer put their
stamp, and the flight's course depends on where the card sits on this screen. The steps run one
after another, and the contrail has to draw on in step with the card.

## Decision

**The web app uses Motion (`motion`, pinned exactly to 14.3.0) for the postcard's send, and for
nothing else yet.**

- The send lives in `apps/web/components/organisms/postcard-dialog/use-postcard-flight.ts`.
  `prepare` measures the postmark's place and the course in the commit that marks the card as
  sent. `fly` runs the sequence through `useAnimate`.
- **No duration, easing or scale is written as a number** (`FE_03` R1). They are read from the
  `--motion-*` tokens in `packages/tokens/src/supplement.css` as the card is sent
  (`postcard-flight.util.ts`). A token that cannot be read takes no time. Distances are measured
  from the page; only the drawing's angles and shares of its course are literals.
- The flight is keyframes along a sampled Bézier curve, played linearly. The points are spaced by
  the in-out ease token, so the flight eases as a whole rather than at every point.
- **`onSend` is still handed over at the press**, and nothing waits on the animation. The dialog
  closes when the flight settles, whether it ended, was cut short or failed, and only if that
  editor is still on the page.
- With reduced motion there is no postmark and no flight, and the dialog closes at once.
- Everything else in the web app still animates in CSS, on the token utilities.

## Consequences

- One more runtime dependency in `apps/web`, in the client chunk that holds the dialog.
- Sending now takes about 1.7 s on the token steps, against 150 ms before. The card has already
  been handed over, so nothing is slower to save.
- The dialog's content hides horizontal overflow, so the card leaving past the right edge never
  shows a scrollbar.
- A change to the motion tokens changes the send's timing with no change to the code.
- In jsdom no stylesheet loads, so every step takes no time and tests that send close at once.

## Alternatives rejected

- **CSS keyframes with custom properties for the measured points.** It can be done for one move,
  but the postmark, the squash, the flight and the contrail have to run in order, and a path
  through 24 measured points is not a keyframe anyone would maintain.
- **The Web Animations API by hand.** It would work, but every sequence, every keyframe for an
  SVG `pathLength` and every settled promise would be our own code. Motion is that code, tested.
- **A spring for the flight.** A spring has stiffness and damping, which the tokens do not have.
  The token steps keep the send in step with the rest of the app.

## Links

- `FE_03` R1 (no design value in a component), `FE_06` (the postmark and contrail are
  decoration), `GEN_13`
- `PROJECT.md` §4, Motion row
