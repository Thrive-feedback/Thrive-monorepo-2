# 0021 — shadcn/ui on Radix is the component source, restyled with our tokens

Status:   accepted
Date:     2026-09-30
Deciders: kritpavin

## Context

#104 asks for one set of shared components — Button, Text field, Card, Avatar, and with it Toast,
Checkbox, Radio, Switch, Select, Skeleton and Link — so every screen is built from the same parts.
Writing each control by hand means re-solving keyboard and screen-reader behaviour for a select,
a radio group and a checkbox, which is exactly where `FE_06` fails in practice.

shadcn/ui is not a dependency. Its CLI copies a component's source into the app, built on an
unstyled primitive library, and the code is then ours to change. That fits `FE_13` (components
live in the app until a second app needs them) and it leaves nothing between us and the markup.

The copied source does not fit this repository as it arrives: **its classes name shadcn's
theme** — `bg-primary`, `text-muted-foreground`, `rounded-md`, `shadow-xs`, `ring-[3px]`. Our
theme resets Tailwind's defaults (`packages/tokens`, ADR 0008), so none of those utilities exist,
and `FE_04` R2 bans the arbitrary values outright. Its icons are a separate decision, ADR 0022.

## Decision

Add components with `bunx --bun shadcn@latest add <name>` from `apps/web`, on **Radix**
primitives (`radix-ui`), then **rewrite every generated class to our semantic utilities** before
the file lands: `primary → action`, `muted-foreground → foreground-muted`, `input →
line-strong`, `destructive → danger`, radii to `rounded-indicator | control | surface | floating`.
Arbitrary values, `dark:` variants and shadcn's enter/exit animations are removed. Focus comes
from the one global `:focus-visible` rule, not from per-component rings.

`apps/web/components.json` points the CLI's `ui` alias at `components/atoms/`, so a component
lands at its atomic level (`FE_01` R6). A composition of atoms — `TextField`, `TextAreaField` —
is written in `components/molecules/`.

**`sonner`** backs the toast. `Toaster` is mounted once in the root layout and uses `unstyled`
with token classes, so a toast paints with the status roles rather than sonner's palette.

## Alternatives

- **Keep shadcn's classes and add its token names as aliases** (`--color-primary:
  var(--action)`). Rejected: every role would have two names, which #104 rules out ("no token is
  duplicated"), and a component could reach for either.
- **Base UI instead of Radix.** Rejected for now: shadcn supports it, but Radix is the default,
  has the longer record on the accessibility behaviour we are buying, and more examples.
- **Hand-write the components.** Rejected: see Context.

## Consequences

- `radix-ui` and `sonner` are runtime dependencies of `apps/web`; `PROJECT.md`
  §4 records them.
- **Every `shadcn add` is followed by a rewrite.** The CLI's output never passes lint-by-eye
  on its own, and the showcase at `/ui-showcase` is where a restyled component is checked.
- The CLI resolves the `utils` alias `@/lib/cn.util` to an npm package called `cn` and installs
  it. After an `add`, change the import back to `@/lib/cn.util` and remove `cn` (and
  `next-themes`, which the toast pulls in and we do not use) from `package.json`.
- Radix exposes state as `data-state="checked"`, so components use `data-[state=…]:` variants.
  They are attribute selectors, not arbitrary values, and `FE_04` R2 does not cover them.
- `packages/tokens` gains the roles the components needed and had no token for: a `shape-indicator`
  radius for a checkbox's box (from the previously unused `--radius-1`), and two motion loops
  for `Spinner` and `Skeleton`, because the theme reset removed `animate-spin` and `animate-pulse`.
  Both are proposals for #43, like the rest of the semantic vocabulary.
- Hover and pressed states have no transition, because no duration token exists for them.

Supersedes: —
Referenced by: ADR 0022, `PROJECT.md` §4, `/ui-showcase`
