# 0002 — Convention documents are filed by area

Status:   accepted
Date:     2026-08-25
Deciders: kritpavin

## Context

All convention documents sat directly in `docs/conventions/`, next to
`index.html` and `assets/`. The index has 81 entries; 15 are written and the
rest are `todo`. Filled out, that is 81 sibling files in one directory, and the
area is legible only from the file name prefix.

The index also linked a document by its bare `data-file`, so the link, the
folder and the file name were the same string. Any grouping decision was
therefore a decision about link format too.

Separately, an entry was only clickable through the small file name in its meta
line. The card — title, trigger, summary — was inert, which is the part a reader
aims at.

## Decision

Documents live in `docs/conventions/<AREA>/`, one folder per area: `GEN`, `FE`,
`BE`, `INFRA`. `data-file` stays the bare file name and the index derives the
folder from `data-area`, so an entry still names exactly one thing and the
self-check keeps validating the file name against the id.

The whole entry card is a link to its document. The title carries the real
anchor; a click anywhere else on the card follows it. A `todo` entry has no
file, so it stays inert.

## Alternatives

- **Put the folder in `data-file`** (`GEN/GEN_01_….html`). Rejected: it
  contradicts `GEN_12#R1`, which calls `data-file` the file name and forbids an
  author from changing it, and it states the area twice — in the path and in
  `data-area` — which can drift.
- **Leave the layout flat.** Rejected: 81 siblings in one directory, and the
  four areas are already the unit everything else uses — the filter buttons, the
  read set, the id prefix.
- **Make the card clickable by wrapping it in an `<a>`.** Rejected: the card
  contains the `data-id` permalink and the `requires` / `see also`
  cross-references, and an anchor may not contain another anchor.
- **Leave clicking to the meta line.** Rejected: it is the smallest target on
  the card and the last thing a reader looks at.

## Consequences

- Every document now sits one level deeper, so its links to the index and the
  stylesheet are `../index.html` and `../assets/doc.css`. Updated in this
  change: all 15 written documents, and the template and agent prompt in
  `GEN_12`.
- Cross-document links still go to `../index.html#<ID>` rather than the target
  file, so nothing needs to know which folder a neighbour lives in. `GEN_12#R9`
  already required this; area folders make it load-bearing rather than merely
  convenient.
- The index self-check gains one rule: an entry's `data-area` must match its id
  prefix, because a mismatch now produces a dead link rather than a wrong filter
  label.
- `FE/`, `BE/` and `INFRA/` are empty until their first document is written and
  hold a `.gitkeep` so the layout survives a clone.
- Anything holding a path to a convention document breaks until updated. Nothing
  outside `docs/conventions/` held one.
- This record was written after the change, not before it — `GEN_13#R4` wants
  the reverse. The alternatives above were live during the change, but a reader
  should weigh them knowing the order.

Supersedes: —
Referenced by: GEN_12
