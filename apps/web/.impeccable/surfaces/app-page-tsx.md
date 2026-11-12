---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/_components/landing/landing.tsx"]
---

## Scope

The public landing page at `/`. Mode: **Persuade**. The visitor is **anyone who leads a team**, anywhere: a founder, a team lead, someone in HR, the head of a student project (brain `ADR-0038`). The action is Get started, which leads to Google sign-in. Proof is a desk of three real cards the visitor can write on (nothing is sent), four Moments shown on the cards they would be written on, and a made-up team's Kudos board; the page cites no research and names no country, culture or price. Constraints: English shown, with no language switch until #48 brings Thai; the Thrive design system in `packages/tokens` and DESIGN.md; the words are `ADR-0038`'s *The words, as agreed* as amended by `ADR-0054`.

## Direction contract

THESIS: "Feedback while it still matters", told as post between teammates. The page shows the product as the cards it is written on, not as a screenshot of an app: a visitor writes one before signing in. It refuses the category default of a centred hero over a product-window screenshot, a grid of icon cards and grey boxed sections.

OWN-WORLD: the white `surface-base` page with the brand orbs drifting behind it. Paper objects lie on it a few degrees off square: postcard stock with ruled backs, Kudos cards in their templates, perforated stamps, blue rubber-stamp Postmarks, an envelope. Cooper for statements, Google Sans for reading, Caveat in orange for teammates' notes. Plum is the only action colour; blue owns asking, orange owns Kudos and the human voice. Sections alternate between the plain page and a full-width band of a hue's light tint, its top and bottom edges perforated like a sheet of stamps, so a visitor always sees where one section ends: blue behind the Moments, the secondary tint behind Why it works, lavender behind the envelope.

STORY: the visitor reads the promise and sees three cards spread under it. They pick one and write a postcard or a Kudos (nothing is sent). They then:
- read two moments that shouldn't wait, each on its postcard, which opens to read
- see the team's Kudos board, where their own Kudos is pinned
- read why feedback goes missing and what Thrive does about it, each reason on a card as the app's lists draw one, beside the postcard that does what Thrive does about it
- read what a team can do, each feature on a card as the app's lists draw one
- open an envelope addressed to whoever leads the team, which holds the reasons to go first and the way in

FIRST VIEWPORT: the glass navbar with colour mode and Sign in. Below it, centred: the display-1 headline "Feedback while / it still matters." with the hand-drawn underline under "still matters." and the note "not six months later"; the muted lead; one primary Get started; the sign-in note. Under them, the desk, spread across the width:
- A fan of three cards: one in front, full size, and one either side of it, smaller, lifted and leaning away behind it; arrows either side of the note below turn the fan. The card in front lies square and grows a little when pointed at; a card at the side, pressed, turns to the front and then opens. The Kudos card starts in front, with an answered Ask postcard (left) and a Given postcard (right) behind it, both turned to their written backs, with the postmark struck on the stamp and never through the writing. Postcard stock has only cream, sage and blush; each card wears its act's hue on its label (blue asks, plum gives, orange thanks) and is a button that opens the real writing dialog.
- Between the two arrows, centred below: the kind of card in front, written by hand ("Say thanks" to begin with), and the caption (amended 2026-11-12).
- On a phone the postcards lie along the top, labels showing, and the Kudos stands in front of them, lower down.
- Amended 2026-11-12: the first build put the words beside the desk; the user picked the centred spread from a canvas of two layouts and moved the Kudos to the middle.

FORM: pinned by the user in a grill round on 2026-11-12, with structure, order and interaction chosen option by option; no concept-seed roll (seed key: none, user-pinned). The signature interaction is writing a real card on the desk; a Kudos lands pinned on the page's board, labelled as only on this page.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Thai (#48, #233–#235) is not built; the TH button stays disabled.
- The landing board does not drag; the `/kudos` drag hook would first have to move out of its route in its own change.
