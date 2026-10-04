# 0026 — next-intl, with the language in a cookie

Status:   accepted
Date:     2026-10-04
Deciders: kritpavin

## Context

Thrive is sold to Thai startups, and every screen has to read in Thai and in English (#48). Language
is a Profile outcome (Epic #10): a Member chooses theirs. Until Profile exists there is no Member to
store it on, but every screen built from now on must already be written in both languages, so the
mechanism has to exist before the setting does.

Two things need choosing, and they are one decision because the library's setup depends on the
second: which library serves the words, and where a request's language comes from.

## Decision

**`next-intl`** serves every word on screen in `apps/web`. The words live in one message file per
language, `apps/web/lib/i18n/messages/en.json` and `th.json`, keyed by the component that owns
them. Messages are ICU, so plurals and number and date formatting are the library's, never
assembled from pieces in a component.

**The language is a cookie, not part of the address.** `apps/web/lib/i18n/request.config.ts` reads
`thrive_locale` on every request; anything other than `en` or `th` is English. Every URL is the
same in both languages. A temporary switch sets the cookie (`components/organisms/language-switch.tsx`,
through the server action in `lib/i18n/locale.action.ts`); Profile replaces it with the Member's
setting, which will write the same cookie or be read in its place.

Three guards keep a missing translation out of a build:

- `t('…')` is typed against the English messages (`lib/i18n/i18n.d.ts`), so an unknown key fails
  the type check.
- Thai is typed as having every English message (`lib/i18n/messages.constant.ts`), so a key Thai
  lacks fails the type check too.
- `lib/i18n/messages.test.ts` fails on what the types cannot see: a key only Thai has, an empty
  message, or a placeholder that differs between the two.

Biome's `noJsxLiterals` fails a word written straight into JSX text in `apps/web`, outside tests
and `/ui-showcase`. It does not look at props, so a literal `aria-label` or `placeholder` is still
caught only in review.

Dates are formatted for the language with the library's formatter, on Bangkok's clock. Thai shows
the Buddhist-era year (`พ.ศ. 2569`), which is what `Intl` gives `th` and what Thai readers expect.

## Alternatives

- **The language in the URL (`/th/login`).** Pages could stay statically rendered, and each
  language could be indexed and declared as an alternate (`FE_12` R9). Rejected: every existing URL
  would change (`FE_11` R1), the whole app would move under `app/[locale]/`, and the address would
  then compete with the Member's own setting about which language wins.
- **The browser's `Accept-Language` header.** Rejected as the source: it cannot be changed from the
  page, so the PM could not switch, and it is not the Member's choice. It is a reasonable default
  for a first visit, which nobody has asked for yet.
- **`react-intl` or `i18next` directly.** Rejected: neither has a first-party path into React Server
  Components, so each would need its own provider and loader wiring that `next-intl` already is.
- **Our own message lookup over plain objects.** Rejected: plurals, ICU arguments and per-language
  number and date formatting are the part worth not writing.

## Consequences

- **Every route renders on demand.** Reading a cookie in the root layout makes each page dynamic;
  `/login` was prerendered before. Nothing here is expensive to render, and pre-launch there is no
  traffic to cache for. Revisit if a page needs to be static.
- **Search engines see English only.** A crawler sends no cookie. `/login` is the one indexable
  page today, and it is indexed in English. If Thai pages must be found by search, that is the URL
  alternative above, and a new ADR.
- **Display text in Thai is set in Google Sans.** Cooper has no Thai glyphs, so the token layer's
  display family now falls through to Google Sans before the system serif. Latin display text is
  unchanged. Google Sans loads its `thai` subset as well as `latin`.
- **The Thai copy was written by the developer**, not a translator. It needs a native reader's pass.
- **`/ui-showcase` stays English.** It documents components for developers and is exempt from the
  lint rule; its wrapper components still render translated built-in text such as the Spinner's
  name.
- The library's request config must be a default export, which `GEN_07` R3 otherwise forbids; it
  is a framework-dictated file in the sense `FE_01` R2 allows.

Referenced by: `PROJECT.md` §4, `apps/web/lib/i18n/request.config.ts`, `biome.json`,
`packages/tokens/src/primitives.css`
