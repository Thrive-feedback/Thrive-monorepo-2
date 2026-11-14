---
name: Thrive
description: Feedback while it still matters, written and sent like post between teammates.
colors:
  brand-plum: "oklch(57.2% 0.1207 315.54)"
  brand-plum-hover: "oklch(51.25% 0.1323 315.35)"
  brand-plum-active: "oklch(47.77% 0.1046 315.14)"
  plum-ink: "oklch(41.7% 0.0934 314.77)"
  human-orange: "oklch(69.56% 0.1633 40.1)"
  human-orange-hover: "oklch(57.18% 0.1369 40.47)"
  human-orange-active: "oklch(51.25% 0.1605 40.1)"
  asking-blue: "oklch(51.25% 0.1665 264.28)"
  asking-blue-deep: "oklch(47.85% 0.125 264.55)"
  stamp-ink-blue: "oklch(63.28% 0.1584 264.15)"
  success-ink: "oklch(51.25% 0.1177 150.78)"
  caution-yellow: "oklch(84.95% 0.1407 81.55)"
  warning-ink: "oklch(69.4% 0.1407 81.55)"
  danger-red: "oklch(63.14% 0.215 17.21)"
  danger-ink: "oklch(47.81% 0.1858 17.39)"
  paper-white: "oklch(100% 0 0)"
  raised-paper: "oklch(97.5% 0 0)"
  subtle-grey: "oklch(90.06% 0 0)"
  ink: "oklch(17.3% 0 0)"
  ink-secondary: "oklch(35.62% 0 0)"
  ink-muted: "oklch(45.07% 0 0)"
  near-black: "oklch(6.72% 0 0)"
  rule-default: "oklch(57.27% 0 0)"
  rule-strong: "oklch(72.19% 0 0)"
  rule-muted: "oklch(84.21% 0 0)"
  focus-plum: "oklch(72.31% 0.1012 315.44)"
typography:
  display:
    fontFamily: "Cooper, 'Times New Roman', 'Google Sans', serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: "4.375rem"
    letterSpacing: "-0.125rem"
  headline:
    fontFamily: "Cooper, 'Times New Roman', 'Google Sans', serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: "2.1875rem"
    letterSpacing: "-0.125rem"
  quote:
    fontFamily: "Cooper, 'Times New Roman', 'Google Sans', serif"
    fontSize: "1.5625rem"
    fontWeight: 400
    lineHeight: "2.1875rem"
    letterSpacing: "0"
  title:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: "1.875rem"
    letterSpacing: "0"
  title-small:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.5rem"
    letterSpacing: "0"
  body:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "0"
  body-small:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.3125rem"
    letterSpacing: "0"
  body-meta:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.125rem"
    letterSpacing: "0"
  label:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.125rem"
    letterSpacing: "0"
  button:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "0"
  overline:
    fontFamily: "'Google Sans', 'Google Sans Fallback', serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: "0.8125rem"
    letterSpacing: "0"
  handwrite:
    fontFamily: "Caveat, 'Google Sans', serif"
    fontSize: "1.5625rem"
    fontWeight: 700
    lineHeight: "2.375rem"
    letterSpacing: "-0.0375rem"
  handwrite-small:
    fontFamily: "Caveat, 'Google Sans', serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.875rem"
    letterSpacing: "-0.0125rem"
rounded:
  inner: "0.1406rem"
  element: "0.1875rem"
  container: "0.2813rem"
  control: "0.5625rem"
  page: "1.3125rem"
  full: "9999px"
spacing:
  unit: "0.25rem"
  inset-control-x: "1rem"
  inset-control-y: "0.5rem"
  inset-card: "1.5rem"
  inset-container: "2.5rem"
  gap-grid: "2rem"
  inset-section: "4rem"
  gap-section: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-plum}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.brand-plum-hover}"
  button-primary-active:
    backgroundColor: "{colors.brand-plum-active}"
  button-highlight:
    backgroundColor: "{colors.human-orange}"
    textColor: "{colors.near-black}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  button-highlight-hover:
    backgroundColor: "{colors.human-orange-hover}"
  button-tertiary:
    backgroundColor: "{colors.asking-blue}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  button-tertiary-hover:
    backgroundColor: "{colors.asking-blue-deep}"
  button-secondary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  button-warning:
    backgroundColor: "{colors.caution-yellow}"
    textColor: "{colors.near-black}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  button-lg:
    padding: "0.875rem 1.375rem"
  input:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5625rem 0.5rem"
  link:
    textColor: "{colors.plum-ink}"
    rounded: "{rounded.element}"
  chip:
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
  card-settings:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.page}"
    padding: "1.25rem 1.5rem"
  card-feed:
    rounded: "{rounded.page}"
    padding: "1.25rem 1.5625rem"
  postcard-paper:
    backgroundColor: "{colors.raised-paper}"
    rounded: "{rounded.element}"
---

# Design System: Thrive

## Overview

**Creative North Star: "Post Between Teammates"**

Thrive's world is correspondence. Feedback is written on postcard stock, stamped, postmarked in worn blue rubber-stamp ink and sent by airmail; people leave notes to each other in the margin in their own hand. The product itself speaks in a calm sans (Google Sans) and a warm, rounded serif display (Cooper) for the moments a page has something to say. Everything sits on a white page that, before a person signs in, has soft orbs of the three product colours drifting behind it; once signed in, the page is held in a frame of brand-tinted frosted glass.

Density is moderate and list-first: Home, Received and Given are columns of tinted cards, Settings is stacked bordered cards of divided rows. Colour is meaning, not decoration: three hues each own one kind of act (giving, asking, thanking/the human voice), and statuses are coloured words inside a sentence rather than badges beside it. Motion is physical and sparse: a postcard turns over, a postmark strikes, a letter flies off; handwriting writes itself on as it scrolls into view; all of it collapses to an instant under reduced motion.

The system is generated. Every colour, size, radius, shadow and corner is a token in `packages/tokens`, exported from the design blueprint; light and dark are two modes of the same semantic names, switched by `data-theme` on `<html>`. Components reference semantic roles only.

**Key Characteristics:**
- Three meaning-bearing hues: plum for the product and giving, blue for anything asked, orange for the human voice.
- Paper objects (postcards, envelopes, stamps, postmarks) as the signature material, on white or frosted glass.
- Cooper display for headings and stamped words; Google Sans for everything read; Caveat handwriting for people's asides.
- Status said as a coloured word in the line, never as colour alone.
- Light and dark as token modes; no per-component dark overrides.

## Colors

A white page with one neutral grey ramp, and three saturated hues that each mean one thing.

### Primary
- **Brand Plum** (action-primary): the product's own colour. Primary buttons, the current item in the side nav (on its 20% surface tint), the focus ring's hue, the perforated stamp's face, and the ground of Feedback given unasked on Home (at 8%). Hover deepens to Brand Plum Hover, press to Brand Plum Active.
- **Plum Ink** (fg-accent): text links and ghost buttons; the plum that reads as text.

### Secondary
- **Human Orange** (action-secondary): the human voice. @mentions (as a pill on the orange surface tint), Caveat handwriting in the margin (HandwrittenNote writes in Human Orange Hover), hand-drawn arrows and cross-outs, Kudos cards' ground at 8%, and the highlight button. Near-black text sits on it.

### Tertiary
- **Asking Blue** (action-tertiary): everything asked. Feedback Requests and their answers (card ground at 8%), the tertiary button, #hashtag pills (blue surface tint, Asking Blue Deep text).
- **Stamp-Ink Blue** (status-info): the Postmark's ink, and info status fills.

### Status
- **Success Ink**, **Warning Ink**, **Danger Ink** and **Asking Blue Deep** (the `-active` shades): status words on the page, through `Text` tones `success`, `warning`, `danger`, `info` and `StatusText`.
- **Caution Yellow** (status-warning): the `warning` button, for a step the person can take back, such as Sign out. **Danger Red** (status-error): the `danger` button, for a loss.
- The `-fg` shades of each status are near-black in light mode; they belong only on that status's own tinted surface (Badge, toast).

### Neutral
- **Paper White** (surface-base): the page, inputs, the secondary button, a stamp's paper.
- **Raised Paper** (surface-raised): postcard and envelope stock, under its tone tint and dot grid.
- **Subtle Grey** (surface-subtle): disabled buttons and filled inputs.
- **Ink** (fg-primary), **Ink Secondary** (fg-secondary, muted text and descriptions), **Ink Muted** (fg-muted).
- **Rule Default / Rule Strong / Rule Muted** (border-default / -strong / -muted): input edges are Rule Strong; card edges are Rule Muted; dividers are border-subtle, Rule Strong at 12%.
- **Focus Plum** (focus-ring): the single focus ring.

### Named Rules
**The Three Voices Rule.** Plum is the product speaking and Feedback given unasked; blue is anything asked, and every #hashtag; orange is a person speaking: @mentions, handwriting, Kudos. Never swap them, and never add a fourth hue for meaning.

**The Status Is a Word Rule.** A status is a word in its `-active` colour inside the line it belongs to ("2 answered, 1 pending"), set at weight 500. The `-fg` shades are only for text on that status's own tinted surface.

**The Modes Not Overrides Rule.** Dark mode is the second mode of the same semantic tokens under `data-theme='dark'`. No `dark:` utilities, no literal colours, no hand-added tokens; a value the blueprint lacks goes in `supplement.css` as a request to design.

## Typography

**Display Font:** Cooper (with Times New Roman, then Google Sans)
**Body Font:** Google Sans (with a metric-matched Arial fallback, "Google Sans Fallback")
**Handwriting Font:** Caveat (with Google Sans)
**Mono:** ui-monospace stack, for code only

**Character:** Cooper's soft, heavy serif gives headings and stamped words warmth and a little ceremony; Google Sans keeps everything people read plain and friendly; Caveat is a teammate's pen. Cooper ships only its SemiBold, so every display role (700 in the tokens) renders that SemiBold with weight synthesis turned off.

### Hierarchy
Values in the frontmatter are the desktop (64rem and up) sizes; every role steps down at 48rem and again below it (display-1 is 3rem on a phone, 3.4375rem on a tablet, 4rem on desktop), and negative tracking applies only on desktop.
- **Display** (display-1 to display-6, Cooper): page-level statements; display-4 heads a standalone page such as the 404.
- **Quote / subtitle-display** (Cooper): a quoted line or a display-voiced subtitle.
- **Title** (subtitle-2, Google Sans 500): card titles (`CardTitle`).
- **Title small** (subtitle-3, Google Sans 500): Settings card titles.
- **Body** (body-1): reading text; body-2 for secondary lines and link rows; body-3 for card metadata and descriptions.
- **Label** (label) and **Button** (button-sm/md, 600): controls.
- **Overline** (600, uppercase): a field or group label, such as a side-nav group or an envelope's "From" / "To".
- **Handwrite** (subtitle-handwrite-1/2, Caveat 700): margin notes, a written address, the large handwriting beside a feed card.

### Named Rules
**The Look Is Not the Level Rule.** `Text` takes a `variant` for how it looks and `as` for what it is; the heading outline follows the page, never the type scale.

**The Handwriting Is a Person Rule.** Caveat is only ever a person's aside or something written by hand. A margin note (HandwrittenNote) is in orange, tilted 3 degrees, and hidden from assistive technology, so it never carries anything the page needs; on a Home card the large handwriting takes its card kind's ink instead.

## Layout

Mobile first, with breakpoints at 40, 48, 64, 80 and 96rem. Spacing is a 0.25rem unit; layout roles grow with the viewport: container inset 1rem, then 1.5rem, then 2.5rem; card inset 1rem, 1.25rem, 1.5rem; grid gap 1rem, 1.5rem, 2rem; section inset 2rem, 3rem, 4rem; section gap 4rem throughout. Content columns cap at 42rem (measure-2xl) for reading and 64rem (measure-5xl) for wide pages.

Signed-in pages sit inside a glass frame with a side nav; their lists are single columns of cards. Signed-out and standalone pages (sign-in, invitations, 404) centre one column on the orb ground, with the wordmark top-left at the container inset.

The landing page is the signed-out page that runs long. Its sections share one frame: a display-2 heading (with an optional muted subtitle-1 lead and a margin note), then the content below it or, split, beside it from 48rem, all within 64rem. Each section stands on its own full-width band (5rem of padding above and below, 8rem from 48rem; 1.5rem at the sides on a phone, 2.5rem from 40rem), and the bands alternate between the plain page and a hue's light surface tint (`-surface-hover`: blue at half strength behind the Moments, the secondary tint behind Why it works, the primary tint behind the closing letter), so a visitor always sees where one section ends. A tinted band's top and bottom edges are perforated like a sheet of stamps: round bites 0.375rem across every 1.25rem, cut by a mask. Never boxed grey panels. The hero is centred, its cards spread under it.

## Elevation & Depth

A hybrid. Depth comes mostly from material: frosted glass (a 1.25rem blur, saturate 1.8) over the page or the orbs, and tinted grounds. Three soft shadow steps, tinted from the neutral ramp (10% in light mode, 40 to 55% in dark), lift things that float: `shadow-med` on a `Card`, `shadow-high` on postcard stock and dialogs, `shadow-low` on small raised controls. Paper lying on paper (a stamp, a sticker) casts a drop-shadow that follows its perforated edge instead of a box shadow. Dialogs blur the page behind them (0.375rem, or 0.9375rem behind a card being written).

### Named Rules
**The Paper Lifts, the Page Stays Rule.** The page and list cards are flat; only what floats (a dialog, a postcard, a glass card) or lies on paper (a stamp) casts a shadow.

## Shapes

Corners come in named roles. Buttons and inputs use the control corner (0.5625rem); chips, badges, tag pills and icon buttons are fully round; cards, Settings cards and feed cards use the page corner (1.3125rem), which is also what `rounded-surface` reaches at 64rem (the container corner, 0.2813rem, below it). Paper objects are nearly square: postcards and envelopes use the element corner (0.1875rem), and stamps have perforated edges cut by a mask. Paper may sit a degree or two off square (an envelope at -1.5 degrees, a postmark struck at -9 degrees, notes at 3 degrees). Post lying on a page leans each piece its own way (-2 and 1.5 degrees); only cards at the sides of the desk's fan, which are there to be picked up, lean further (-6 and 4 degrees), and the card in front lies square.

## Components

### Buttons
Solid, quiet and rounded; colour says what kind of act it is.
- **Shape:** control corner (0.5625rem); icon buttons are 2.25rem circles.
- **Primary:** Brand Plum with white text (4.7:1, so AA at every size), for the main product action; sizes sm, md (0.625rem by 1rem) and lg (0.875rem by 1.375rem, button-md type).
- **Highlight / Tertiary:** orange (near-black text) for a person's act such as Kudos; blue (white text) for asking.
- **Outlined variants:** the hue's border, its 20% surface, and its text; hover moves to the 70% surface tint.
- **Secondary (default):** white with a neutral border and Ink text. **Soft / Ghost:** no edge, plum text.
- **Warning / Danger / Ghost-danger:** yellow for something reversible, red for a loss, red text alone for a quiet destructive link.
- **States:** colour transitions only (150ms ease-out); disabled is Subtle Grey with secondary text (`action-disabled-surface`: on dark one step lighter, so it still reads inside a dialog); `loading` keeps the label and swaps in a spinner.

### Chips and tags
- **Badge:** fully round, tag type (sm) or body-2 (md, for a name). Filled tones use the `-surface-hover` tint with the `-fg` text; `edged` adds the tone's border on a tinted ground; `outline` is a neutral edge.
- **Tag pills in text:** #hashtags on the blue surface in Asking Blue Deep; @mentions on the orange surface in Human Orange.

### Status text
A status word inline, in its tone's `-active` colour at weight 500, the size of its line.

### Cards / Containers
- **Card:** neutral frosted glass, page corner, Rule Muted edge, `shadow-med`; header centred over a subtle divider (1.5rem sides), content padded 1.5rem, footer divided by a line.
- **Settings card:** page corner, Rule Muted edge, no fill or shadow; subtitle-3 title with a body-3 muted description, rows divided by the subtle rule.
- **Feed card (Home, Received, Given):** page corner, flat, its kind's hue at 8% as ground (plum given, blue asked, orange Kudos), padding 1.25rem by 1.5625rem; the small word naming its kind in the hue's 500 shade, then time and an outline badge in body-3. Empty states draw the same card as an outline in the kind's border.

### Inputs / Fields
- **Style:** control corner; outlined (Rule Strong edge on white), filled (neutral surface) or subtle (Subtle Grey); value type body (md) or body-small (sm).
- **Focus:** the global ring. **Error:** `aria-invalid` turns the edge to the error border. **Disabled:** Subtle Grey fill (`action-disabled-surface`, one step lighter on dark so it reads inside a dialog), secondary text.

### Navigation
- **Side nav:** rows in button-sm type, Ink Secondary, control corner; hover gives the neutral surface tint and Ink; the current page (from 48rem) is Brand Plum text on the plum 20% surface. Groups are headed by an uppercase overline over a subtle rule.
- **Navbars:** frosted glass, clear at the top of the page and frosting over in the first 4rem of scroll, curving into the page at both ends.
- **Sidebar rail:** in Settings, from 48rem up to 80rem, the main sidebar narrows from 14rem to a 4rem rail of its icons (easing on the fast step), so Settings' menu and the open section fit beside it. Each icon is named by a tooltip on the right; a count sits small on its icon's corner; a group heading keeps only its rule; the account foot keeps only the face.
- **Tab bar (phone):** below 48rem the sidebar's places stand in a bar along the bottom, the frame's glass grown to 4rem and curving into the page at both ends: Home, Kudos, "+" in the middle as the sidebar draws it (the outlined button, a 2.75rem square), Waiting with its count on the icon's corner, and More, which opens upward with Teammates, then My Feedback's Your dashboard, Received and Given. Each tab is an icon over a button-xs word; the current one is Brand Plum, its icon on the plum tint. Below 48rem toasts drop in at the top, under the navbar, since the bottom holds the bar, a dialog's sheet and its buttons; from 48rem they rise at the bottom right.
- **Teammates rows:** the face, the name over the email, then Give, Ask and Kudos as small outlined buttons in their voices (plum, blue, orange), at the row's end from 48rem and sharing the width under the person below it. Each opens its card already addressed. The person's own row stands among the rest by name, marked with an outline You badge, and has no actions. Kudos for someone who has not introduced themselves, and so has no @handle, stays in its place greyed but focusable (`aria-disabled`), saying why when pointed at, focused or pressed, since a touch screen has only the press.
- **Links:** Plum Ink, weight 500, underlined on hover with a 4px offset.
- **Focus (everything):** one hairline ring, 0.0625rem of Focus Plum at a 0.125rem offset.

### Dialogs and sheets
- **From 48rem:** a dialog is a card centred on the page, at most 32rem wide, surface corner, `shadow-high`, fading and growing in over the blurred page.
- **Below 48rem:** it is a bottom sheet (ADR 0084): the window's full width on its bottom edge, top corners rounded, at most three quarters of its height, with the Drawer's grab handle across its top. It slides up on the enter step and down on the exit step; dragged down by the handle past a quarter of its height, or flicked, it closes, and short of that it settles back. With reduced motion it neither slides nor settles.
- **Screens:** the postcard's and the Kudos card's editors and readers fill the window at every width instead, and their own pickers come up as Drawers.

### Postcard stock (signature)
Raised Paper under a 10% tone tint (cream from the warning border, sage from success, blush from error at 8%), a 0.75rem dot grid in the ink at 4%, `shadow-high`. Written postcards carry ruled lines spaced by the text's line height. The 404's envelope reuses this stock; the landing page's envelope is Surface Paper instead.

### Postmark (signature)
A rubber-stamp mark in Stamp-Ink Blue: two rings, words curved between them in Cooper, two lines in the centre, three cancelling waves, roughened by an ink-wear filter seeded so no two strike alike. By default it reads "Thrive" over "Team" around the day it was posted; it may carry its own words and centre lines (the 404's "Address / Unknown", "NO. 404"). `trail="left"` lands the waves beside a stamp it dates; `trail="right"` runs them across a stamp to cancel it. Decorative and hidden from screen readers.

### Stamp
A perforated postage stamp on its own paper, a drop-shadow lift following the bites. The 404's stamp has a plum face with the wordmark reversed out of it.

### Handwritten note
Caveat in Human Orange Hover, tilted 3 degrees left or right, written on as it scrolls into view (or once after a dialog opens), static where the motion grammar calls for it; often paired with a hand-drawn arrow.
- **At a heading's corner:** from 64rem, a note on a display heading is anchored just past the last word of the heading's first line (0.75rem clear of it, raised a third of its height), never to the heading's box, which runs the column's width however the line wraps. Below 64rem it sits under the heading, or is left out.

### Card on a desk
Real cards fanned on a desk, each a button that opens the dialog the app writes it in: one in front, full size (a postcard half the desk's width from 48rem, three fifths below it; a Kudos a third, two fifths below), and one either side of it at 0.8 (0.75 below 48rem), tucked behind, lifted a little and leaning away. The Kudos starts in front, an answered Ask and Feedback given unasked either side by their written backs. Two secondary icon buttons with arrows turn the fan, either side of a handwritten note in the blue of asking naming the card in front (its label's words, subtitle-handwrite-1, display-4 from 48rem, written afresh at each turn) over the muted caption; they bring the card on that side to the front (very slow duration, smooth ease-out, transforms only; at once under reduced motion). A card to the right wears its chip at its right corner; below 40rem a card behind shows only its chip's icon. From 48rem a postcard is the full read card (postmark on the stamp) laid out at 42rem and scaled down whole; below it, the miniature with lines for words. Each wears `shadow-high` and a label chip across its top-left edge: an edged md Badge in its act's hue (info for an Ask, brand for giving, highlight for Kudos) with a small line icon, lifted by `shadow-low`; the chip's words are the button's name. On the landing page the chip is solid: its tint laid over the base surface, so nothing on the card shows through. The card in front lies square to the page: pointed at or focused it grows to 1.04, pressed to 1.02, and a press opens it. A card at the side, pointed at or focused, rises 0.5rem and straightens to half its lean (medium duration, ease-out); pressed, it turns to the front, and opens once the turn is done (at once under reduced motion). The same chip names the kind of a card shown on a page without being a button.

### Pinned board
Kudos cards in their templates hung on a grid inside the board's edge, as the app's `/kudos` board draws it (page corner, Rule Muted hairline, the cards well clear of it), each at the tilt its id gives it (as the app's `/kudos` board does), `shadow-high`, captioned beneath in muted body-3 ("From ... to ..."); pointed at, a card lifts 0.375rem off its pin. A card the visitor wrote carries a strip of tape across its top: base-surface paper, -3 degrees, `shadow-low`, with a pin icon.

### Reason card
A card as the app's lists draw one (`FeedCardSurface` and `FeedCardRow`): the page corner, its voice's 8% tint over the base surface, flat and square. On the left, read as an answered card is: the problem in subtitle-3 and what it costs in muted body-2, in a panel of its own (control corner, base surface at 70%), then Thrive's wordmark over what Thrive does about it in body-1. On the right, behind a line in the page's colour, the postcard that does it made small, with a note by hand in the card's voice pointing at it, as a list card keeps its small postcard. Cards in a list take the three voices in turn: plum, blue, orange.

### Feature card
A card as the app's lists draw one (`FEED_CARD_SURFACE`): the page corner, over the base surface, in its act's 8% tint (blue asks, plum gives and chooses who reads, orange thanks); a tool that is not an act stands on the base surface with a Rule Muted hairline. A line icon at 1.5rem in the card's ink (`FEED_CARD_INK`), then the name in subtitle-2 over what it is for in muted body-2. Six in a grid: three across from 64rem, two from 40rem, one below.

### Envelope and letter
An airmail envelope of Surface Paper, white stationery that stays white in either mode, with its words in Ink on Paper and Ink on Paper Secondary, which stay dark on it. It is as tall as a postcard for its width (3:2, at least 15rem; element corner, the high lift laid twice, -1 degree), edged in 0.5rem airmail stripes, red and blue with the paper between them (the error and info border steps, 500 in either mode, so they stay strong on the always-white paper), and its opened flap stands up behind the letter, a shade darker than its face and lined with plum dotted tissue. It carries a "From" overline over the Thrive wordmark (in the paper's ink), a "To" overline, one of the app's own stamps (`PostcardStampReadOnly`, the balloon) with its perforated margin in the paper, a Postmark cancelling it (`trail="right"`) and the address written by hand over a Rule Strong line. A white letter (the high lift laid twice, 0.5 degree) stands out of it, its foot behind the envelope's top edge; its three points are steps in an ordered list, each numbered by hand ("step 1") in the blue of asking. Where scroll timelines exist and motion is welcome, the letter rises 8rem out of the envelope with the section's scroll (entry to 40% cover), drawn by the scroll rather than played once; otherwise it is already out. The envelope itself stays still.

### Orb backdrop
The signed-out ground: soft radial orbs of plum, orange and blue (20 to 25% opacity), with blue opening every page at its top right, fixed behind the page and drifting at three depths with scroll.

## Do's and Don'ts

### Do:
- **Do** reach for semantic tokens and the atoms (`Text`, `Button`, `Badge`, `StatusText`, `Card`, `Postmark`) before writing a class; every utility is token-backed.
- **Do** give an act its hue: plum for the product and giving, blue for anything asked and #hashtags, orange for a person's voice, @mentions and Kudos.
- **Do** say a status as a word in the `-active` shade (`StatusText`, `Text` tones), and use the `-fg` shades only on that status's tinted surface.
- **Do** set headings in Cooper through the display variants, and pick `as` for the outline separately from `variant` for the look.
- **Do** use the `warning` button for a reversible ending such as Sign out, and `danger` only for a loss.
- **Do** reuse postcard stock, the Postmark and the stamp for paper moments, and let paper sit a degree or two off square.
- **Do** make every motion collapse to its end state under reduced motion.

### Don't:
- **Don't** write `dark:` utilities or literal colours; dark mode is a token mode under `data-theme='dark'`.
- **Don't** hand-add tokens to `packages/tokens`; change the blueprint and regenerate, or request a supplement.
- **Don't** use a `-fg` status shade for text on the page; it reads near-black there.
- **Don't** write a margin note (HandwrittenNote) in any colour but orange, or use orange for a product action that is not a person's own.
- **Don't** let handwriting carry information the page needs; it is decorative and hidden from assistive technology.
- **Don't** set an uppercase overline above a heading as a kicker; overlines label a field or a nav group.
- **Don't** add a box shadow to list cards or Settings cards; they are flat on their ground.
