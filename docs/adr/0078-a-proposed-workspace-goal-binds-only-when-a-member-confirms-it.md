# 0078 — A Workspace Goal a model proposes is bound only by the Member confirming it, which writes the hashtag into their own text

Status:   proposed
Date:     2026-10-31
Deciders: naroebordin

## Context

Brain `ADR-0051` decides that a model may propose Workspace Goals for a Feedback or Request message,
and that **nothing binds without a Member confirming it**. This record decides how a confirmation
turns into a binding.

The existing mechanism is narrow and deliberate. `written-tags.vo.ts` finds `#name` with a
Unicode-aware regex that matches mid-word, because Thai is written without spaces, and its own comment
states the invariant the composer rests on:

> Recognising them is the same rule the web app highlights by as it is typed, so **what a writer sees
> coloured is what is bound when they send it.**

`TagsService` then resolves those names through `ActiveWorkspaceGoalPort.activeAmong`, and the binding
is stored as a snapshot row carrying `workspaceGoalId` **and the name as spelled** (ADR 0053). Brain
`ADR-0036` rule 7 makes that binding permanent: Feedback stays bound to the goal it named, even after
the goal is hidden, and nothing is editable after sending.

So the question is not "how do we store a proposal" but "what does pressing a chip *mean*".

## Decision

**Confirming a proposed Workspace Goal appends its `#name` to the Member's message text. There is no
second binding path, and nothing about a proposal is stored.**

Three consequences follow immediately, and they are the whole decision:

1. **The write path does not change at all.** A confirmed proposal is ordinary typed text by the time
   the message is sent, so it travels `WrittenTags` → `TagsService.boundIn` →
   `ActiveWorkspaceGoalPort.activeAmong` → `feedback_workspace_goal`, exactly as a hand-typed hashtag
   does. No new DTO field, no `proposed` flag, no API change on send.
2. **"Never binds silently" is true by construction**, not by a rule somebody could regress. There is
   no code path that can bind a goal the Member did not have in their text.
3. **The invariant survives.** What the writer sees highlighted is still what binds, and
   `feedback_workspace_goal.name` still has a spelling source — the text.

### The proposal itself

A read-only route on the **Feedback** module, which already owns text-to-bound-goals and already
depends on Workspace Goal:

```
POST /v1/workspaces/{workspaceId}/workspace-goal-proposals   → 200, nothing is created
body  { message }
200   { proposals: [{ workspaceGoalId, name }] }   // at most 3
503   WORKSPACE_GOALS_NOT_PROPOSED
```

The use case reads the Workspace's active goals through a new `ActiveWorkspaceGoalPort.allActiveIn`,
and **answers `[]` without calling the model when there are none** — the common case for a new
Workspace, and it costs nothing. Otherwise it builds a JSON Schema whose goal field is an **`enum` of
that Workspace's active goal ids**, calls `AiCompleter` (ADR 0077), parses with Zod (`BE_08`), drops
any goal the Member has already typed via `WrittenTags.in(message).hashtags()`, drops any id outside
the Workspace as defence in depth behind the enum, and caps the list at three.

**The `enum` is what makes a hallucinated Workspace Goal impossible rather than unlikely.** A model
that is fully compromised by text in the message still cannot name a goal nobody created, or a goal
from another Workspace. That is the structural half of the injection defence; the instruction in the
prompt is the weaker half.

It writes nothing, so there is no transaction and ADR 0031 is untouched. It returns one bounded answer
rather than a collection, so it does not page and ADR 0059 does not apply. Both are worth a sentence
in the pull request, because a reviewer will reasonably ask about each.

### Nothing is stored

No proposal table, no column, no log line carrying a proposal. A stored proposal is a record of what a
machine guessed about a person's words: it would need retention, export and Erase rules of its own,
and nothing would read it. If "how often is a proposal confirmed" is wanted later, that is analytics
carrying ids and counts, decided under `FE_24`, not a table here.

### On the web

A new chip row, **not** the existing `TagSuggestions`. That component is a `role="listbox"` whose
contract is "what the token you are currently typing can become": arrow-driven from inside the field,
deliberately outside the tab order, wired through `aria-activedescendant` in `use-tag-autocomplete.ts`.
A proposal is a different object — nobody is typing, several can be confirmed, each is a toggle — so
it gets `role="group"` with real `<button aria-pressed>` chips on the same `Badge` atom, inside the tab
order. Debounced, one request in flight, aborted on supersede, and never shown while the autocomplete
is open.

Any failure renders nothing: no chips, no toast, no error text. **The composer stays exactly as usable
as it is today when the model is unreachable** — which is the test of whether this is an addition or a
dependency.

## Consequences

- **It edits what the person wrote.** That is the real cost. The chip must be removable and removing it
  must put the text back, or the feature is taking liberties with somebody's words.
- **A Member who does not read will confirm a wrong label as easily as a right one.** The human in the
  loop is a genuine check only while the proposals are good enough to be worth reading; brain
  `ADR-0051` decision 8 is what measures that before this ships.
- **The route costs money per call and has no rate limit.** Any signed-in Member can loop it. `BE_22`
  and `BE_19` are both `todo`, so there is no mechanism in the repository to borrow. The mitigations in
  this change are a hard cap on message length in the DTO and a hard debounce on the web; **a
  per-Member limit must be named as the first thing `BE_22` covers**, and this is flagged rather than
  solved.
- **Two round trips per suggestion.** The browser cannot reach the API (ADR 0027), so each debounced
  batch is a Next.js server action *and* a provider call.
- **A per-Workspace JSON Schema.** On providers that compile and cache grammars, the first call in a
  Workspace is slower. Accepted for what the enum buys.
- **Workspace Goal publishes one more method.** `allActiveIn` beside `activeAmong`, capped at 100 rows
  — a longer list costs more in the enum than the answer is worth.
- **Rollback:** delete the route, the use case and the chip row. Nothing is stored and nothing is
  migrated; Feedback already sent is unaffected, because what was bound was text.

## Alternatives rejected

- **Binding a proposal directly, without it entering the text.** Two binding paths for one concept, and
  `feedback_workspace_goal.name` would have no spelling source for rows the Member never typed. The
  highlight invariant would quietly stop being true.
- **Auto-applying high-confidence proposals.** Brain `ADR-0036` rule 7 makes a binding permanent, so a
  wrong one is forever and lands in the Admin's coverage numbers. The keystroke saved is not worth it.
- **Pre-ticking the chips.** The same objection wearing a hat: a Member who sends without looking has
  confirmed nothing.
- **Replacing the `#` autocomplete.** The typed hashtag is free, instant, deterministic and needs no
  vendor. It is also the only way a Member can insist on a label the model missed, and brain
  `ADR-0051` decision 8 makes it the baseline the model has to beat.
- **Storing proposals for later analysis.** Retention and Erase obligations for data nobody reads.
- **Putting the route on the Workspace Goal module.** `workspace-goal` importing `feedback` while
  `feedback` imports `workspace-goal` is a module cycle, and `.dependency-cruiser.cjs` runs
  `tsPreCompilationDeps: true`, so even a type-only import fails CI.
- **Proposing Mentions too.** Suggesting who should read someone's feedback is a different and much
  sharper decision; brain `ADR-0047` governs Mentions and says nothing about a machine choosing one.

## Links

- Brain `ADR-0051` (a model proposes, a Member confirms), brain `ADR-0036` (hashtags; permanent
  binding), brain `ADR-0047` (Mentions, untouched here)
- ADR 0053 (goals and mentions bound in rows of their own), ADR 0077 (the model port), ADR 0027 (the
  browser reaches auth only through the web origin), ADR 0031, ADR 0059
- `apps/api/src/modules/feedback/domain/value-object/written-tags.vo.ts` — the invariant this preserves
- `BE_08`, `BE_21`, `BE_22` (`todo`), `FE_05`, `FE_06`, `FE_18`, `FE_24` (`todo`)
