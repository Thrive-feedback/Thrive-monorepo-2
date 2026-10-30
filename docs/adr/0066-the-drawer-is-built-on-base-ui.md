# 0066 — The Drawer is built on Base UI

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

The Drawer atom carries the postcard's Templates and Stamps pickers. It was a Radix dialog placed
at an edge: a bottom sheet on a phone and a panel on the right from `md`. On a phone the sheet
could only be closed by its ×, Escape, a press outside it or a choice. A sheet that cannot be swiped
away does not behave like one.

shadcn's drawer now comes in three builds. The **base** build (`registry/styles/base-*/drawer`)
sits on Base UI's Drawer, which swipes to dismiss in the sheet's direction and has a swipe handle,
snap points and nested drawers. The `new-york` style this repo's `components.json` names resolves
`shadcn add drawer` to the older build on **Vaul**.

Every other component here is built on `radix-ui` (ADR 0021).

## Decision

**The Drawer atom is shadcn's Base UI drawer, on `@base-ui/react` pinned exactly to 1.9.0, rewritten
to the tokens. Every other component stays on Radix.**

- It is added with `bunx --bun shadcn@latest add https://ui.shadcn.com/r/styles/base-vega/drawer.json`,
  then rewritten as every shadcn component is here: token utilities only, its swipe and open and
  close motion in `drawer.module.css` on the motion tokens.
- The atom keeps its API. `DrawerTrigger` and `DrawerClose` take `asChild` like the Radix atoms and
  hand the child to Base UI's `render`, so a caller cannot tell which library is underneath.
- It swipes down below `md` and right from `md`, and the sheet shows a grab handle.
- `DrawerContent` takes a `container` for its portal. A drawer opened from inside a Radix modal is
  rendered inside that modal's content, because Radix keeps focus inside its own DOM and would pull
  it out of a drawer appended to `<body>`.
- Radix hears Escape before Base UI does. The modal that hosts a drawer lets Escape go to an open
  drawer rather than acting on it: the postcard asks "Close without sending?" only when no drawer
  is open.

## Consequences

- The web app has two headless component libraries. A second component on Base UI is a decision of
  its own, with an ADR; this one covers the Drawer only.
- Phones can swipe the sheet away, and see that they can.
- Nesting is the cost. Any Radix modal that opens a Drawer must pass its content as the drawer's
  `container` and leave Escape to an open drawer, and must not be a containing block for fixed
  elements (no transform on its content), or the drawer scrolls with it. The postcard does all
  three.
- Base UI moves fast (1.6 to 1.9 in four months), so it is pinned exactly and updated on purpose.
- The drawer's popup stops arrow, Home and End keydowns from bubbling, for its own composite
  widgets. A Radix radio group inside it relies on a document listener to choose on an arrow, so
  the Templates picker chooses on arrow focus itself.
- Base UI, like the Radix drawer before it, closes a non-modal drawer when a mouse press outside is
  let go. The atom closes it as the mouse press goes down, so pressing a stamp both puts the
  drawer away and starts moving it. Touch keeps Base UI's timing: the sheet closes on a tap, or
  once a finger outside it moves more than 10px, which includes scrolling the page behind it,
  where the Radix drawer closed only on a tap. It does not close the moment a finger lands.
  "Outside" is the page's DOM: anything portalled out of a non-modal drawer must be rendered into
  it.
- It moves focus into itself a frame after it opens, and onto the first control rather than its
  own panel, as every dialog here does; keyboard tests wait for that frame.
- `md` is written once in code, in `apps/web/lib/breakpoint.constant.ts`, for the drawer's side;
  it must change with `--breakpoint-md`.

## Alternatives rejected

- **`shadcn add drawer` as configured (Vaul).** It is built on Radix, so it would nest cleanly, but
  Vaul's README says it is unmaintained, and shadcn moved its drawer off it.
- **Keep the Radix drawer and write the swipe ourselves.** Gesture physics, velocity and the
  release animation are what a drawer library is for, and would be ours to maintain.
- **Move the postcard's dialog to Base UI too, so nothing nests across libraries.** It removes the
  seams but takes a second component across without a reason of its own.

## Links

- ADR 0021 (shadcn/ui on Radix), ADR 0065 (Motion, pinned exactly)
- shadcn, "Drawer" (base): https://ui.shadcn.com/docs/components/base/drawer
- `FE_04` R1, R2, R9; `FE_05`
