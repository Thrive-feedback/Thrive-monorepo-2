---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/_components/landing/landing.tsx"]
---

## Scope

The public landing page at `/`. Mode: **Persuade**. The visitor is the founder of a 20–50 person startup who has never heard of Thrive. The action is Get started, which leads to Google sign-in. Proof is the clickable Home preview plus three cited research figures. Constraints: English only; the existing Thrive design system (generated tokens, Cooper / Google Sans / Caveat, the Button and Text atoms); planned features appear only as "On the way".

## Direction contract

THESIS: "Honest feedback starts with a question." The page owns the mechanism: being asked is what lets a team speak. It refuses the category default of a hero over a grid of icon cards, grey boxed sections and a label above every heading.

OWN-WORLD: a white `surface-base` canvas, hairlines in `border-muted` (not `border-subtle`, whose 12% neutral disappears on white; amended at the finish review), Cooper display for statements, Google Sans for everything else, one Caveat aside beside the preview. Purple `action-primary` is the only action colour. Figures are in `fg-accent`. No grey panels, no orange CTA, no cards except the preview window.

STORY: the visitor reads the promise, tries Home without signing up, understands why teams go quiet and why each of Thrive's choices answers research, sees what works today and what is on the way, recognises themselves as the founder without HR, and signs in with Google.

FIRST VIEWPORT: the glass navbar; a centred display-1 headline over two lines; a one-sentence muted lead; one primary Get started button with a quiet "See it in action" link beside it; a sign-in note; the top of the preview window at the fold.

FORM: pinned by the user, in their words: "I need the landing page more clear and modern on the minimal theme like https://fastwork.com/selling", then "I need the design align to our design system too." That pin is the authority that replaced the concept-seed roll; seed key: none (user-pinned). From the reference it takes the white canvas, huge centred type, the real product shown large, and chapters that switch the showcase. Signature interaction: four tour chapters above the preview that switch its tab and follow it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- DESIGN.md is missing for the whole web app. This page extends the incumbent system and does not author it. Offer `/impeccable document` afterwards.
