# 0084 — On a phone, a dialog is a bottom sheet

Status:   accepted
Date:     2026-11-14
Deciders: kritpavin

## Context

The Dialog atom is a Radix dialog, a card centred on the page at every width. On a phone that card
floats in the middle of the screen, far from the thumb, while the Drawer atom (ADR 0066) already
rises from the bottom edge there, shows a grab handle and is swiped down to close. A phone has two
ways of showing something over the page, and the one most of the app uses is the one that feels
least like a phone.

More than twenty call sites use the Dialog, and several lean on what only Radix offers:
`onOpenAutoFocus` and `onCloseAutoFocus` to choose where focus goes, `onEscapeKeyDown` so the
postcard can ask before it closes, `onInteractOutside` so nothing outside it can close it.

## Decision

**Below `md`, `DialogContent` is a bottom sheet that is swiped down to close. It stays a Radix
dialog, and from `md` up it is the centred card it was.**

- On a phone it spans the window's width on its bottom edge, its top corners rounded, at most three
  quarters of the window's height, with the Drawer's grab handle across its top. It slides up as it
  opens and down as it closes, on the motion tokens; with reduced motion it does neither.
- The handle is the swipe. Dragged down past a quarter of the sheet's height, or flicked down, the
  sheet closes; let go short of that, it settles back. It never moves up. Only the handle starts a
  swipe, so scrolling, selecting text and typing inside a sheet behave as they did.
- The swipe is a pointer handler in the atom that sets a custom property, and CSS transitions on the
  motion tokens move the sheet, as `drawer.module.css` moves the Drawer's. Its thresholds, a share of
  the height and a speed, are the only literals.
- `Dialog` keeps its open state, controlled or not, so a swipe closes it the way any other close
  does: `onOpenChange(false)`, then focus back to the trigger.
- `placement="screen"` opts out, for a dialog that lays itself out over the whole window: the
  postcard's and the Kudos card's editors and readers. They are full screen already and host
  Drawers of their own.

## Consequences

- Every dialog in the app is a sheet on a phone with no change at its call site, and keeps its
  focus, Escape and outside-press behaviour.
- The app has two swipes with slightly different feel: Base UI's for the Drawer, with velocity and
  release physics, and this one for the Dialog, a threshold and a transition.
- A sheet's handle scrolls with its content, which is only seen in a sheet tall enough to scroll.
- No safe-area padding at the bottom, as with the Drawer.
- The `md` breakpoint is the Drawer's, so a sheet and a drawer turn into a card and a panel at the
  same width.

## Alternatives rejected

- **Render the Base UI Drawer in place of the dialog on a phone.** One swipe for both, but every
  Radix-only prop at twenty call sites would need translating, focus would arrive a frame later as
  it does in the Drawer, and a second component on Base UI is the cost ADR 0066 asked to be paid only
  for a reason of its own.
- **Motion's `drag`.** ADR 0065 keeps Motion to the postcard's send, and the Dialog would carry it
  into every Settings page for one gesture.
- **A sheet that is not swiped.** ADR 0066 moved the Drawer to Base UI because a sheet that cannot be
  swiped away does not behave like one.

## Links

- ADR 0021 (shadcn/ui on Radix), ADR 0065 (Motion), ADR 0066 (the Drawer on Base UI)
- `FE_04` R4, R7, R9; `FE_06` R4, R6
