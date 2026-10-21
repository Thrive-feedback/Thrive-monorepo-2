---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/_components/landing/landing.tsx"]
---

## Scope

The public landing page at `/`. Mode: **Persuade**. The visitor is **anyone who leads a team**, anywhere: a founder, a team lead, someone in HR, the head of a student project (brain `ADR-0038`). The action is Get started, which leads to Google sign-in. Proof is the clickable Home preview and four worked Moments; the page cites no research and names no country, culture or price. Constraints: English shown, with an inert EN / TH switch until #48; the existing Thrive design system; every word is `ADR-0038`'s *The words, as agreed*.

## Direction contract

THESIS: "Feedback while it still matters." The page owns timing: ask, give unasked or say thanks right after it happens, instead of waiting for the review, the retro or the final grade. It refuses the category default of a hero over a grid of icon cards, grey boxed sections and a label above every heading.

OWN-WORLD: a white `surface-base` canvas with soft brand-coloured orbs drifting behind it, hairlines in `border-muted`, Cooper display for statements, Google Sans for everything else, Caveat for the margin notes in the readable secondary. Purple `action-primary` is the only action colour. Two full-width bands: the light secondary tint (`action-secondary-surface-hover`) behind Why it works, lavender behind the way in. The tour stands on the untinted frosted glass of the app's bars (`glass.module.css`, `.neutral`). No cards except the preview window and the Moments' speech bubbles.

STORY: the visitor reads the promise, tries Home as a founder without signing up, sees four moments that shouldn't wait told as short exchanges, understands why feedback goes missing and what Thrive does about each reason, sees what a team can do, recognises themselves as whoever leads the team, and signs in with Google.

FIRST VIEWPORT: the glass navbar with EN / TH, the colour mode and Sign in; a centred display-1 headline "Feedback while it still matters." with a hand-drawn underline under "still matters." and the note "not six months later"; a muted two-sentence lead; one primary Get started button with a quiet "See it in action" link; a sign-in note; the top of the tour at the fold.

FORM: pinned by the user, in their words: "I need the landing page more clear and modern on the minimal theme like https://fastwork.com/selling", then "I need the design align to our design system too." That pin is the authority that replaced the concept-seed roll; seed key: none (user-pinned). The words and sections are pinned by `ADR-0038`. Signature interaction: four tour chapters on the shared Tabs above the live preview, which switch its tab and follow it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- DESIGN.md is missing for the whole web app. This page extends the incumbent system and does not author it. Offer `/impeccable document` afterwards.
- Thai (#48, #233–#235) is not built; the TH button is disabled until it is.
