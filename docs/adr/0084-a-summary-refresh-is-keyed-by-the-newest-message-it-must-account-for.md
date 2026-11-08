# 0084 — A summary refresh is keyed by the newest message it must account for

Status:   proposed
Date:     2026-11-08
Deciders: naroebordin

## Context

Design 0025 writes a Member's feedback summary off the request path, through the outbox (ADR 0076),
because generation takes seconds and costs money per run and nothing in this repository runs work on
a cadence — there is no scheduler, and `BE_18` is `todo`. Two seams enqueue the work: the write that
made a summary stale, and a read that notices one is behind.

Design 0025 D4 named the key `summaries.refresh:<accountId>:<workspaceId>:<period>` and said the
outbox's unique `idempotencyKey` would "collapse a burst of five into one regeneration per period
for free". **That is not what the key does.** `outbox_message` has a unique index on
`idempotencyKey`, `PrismaOutbox` enqueues with `skipDuplicates`, and a delivered row is swept only
after seven days (ADR 0076). A key naming nothing but the period is therefore unique for as long as
the row survives — so one summary would be written per period, and every later request for the same
quarter would be silently dropped until the sweep, then allowed again a week later.

The collapsing the design wanted is real and worth having: a Member opening the page twice over
unchanged Feedback, and a write and the read that follows it, should cost one generation rather than
two or three.

## Decision

**A refresh is keyed by the Member, the newest message the summary must account for, and the
prompt that will write it:** `feedback.summary_refresh:v<promptVersion>:<accountId>:<sourceId>`.

The write path uses the id of the Feedback or Kudos it just wrote, which is by definition the newest
thing written to that Member. The read path uses the id of the newest item it found when it judged
the stored summary stale. Both arrive at the same string for the same state, so:

- a page opened five times over unchanged Feedback enqueues once;
- a write and the read that follows it enqueue once between them;
- new Feedback is a new id, so it always earns a regeneration;
- the Workspace stays out of the key because an id is already unique across every Workspace, and a
  Member cannot receive the same message in two of them.

**The prompt version is in the key, and it is not decoration.** Design 0025 D10 says a prompt
change should regenerate lazily rather than by a backfill. Without the version it cannot: the ask
would be a duplicate of the one that already wrote what is stored, so a summary written by an older
prompt — or in an older stored shape — would never be rewritten, and a row this version cannot
read would stay unreadable forever. Found while building the page that reads these summaries, when
a shape change left a stored row that nothing would replace. The read therefore treats a row whose
`promptVersion` is not the current one as work to do, **without telling the Member it is stale**:
nothing new was written to them, and the rewrite is Thrive's business.

The period travels in the **payload** rather than the key, because it is what the handler needs and
not what makes the work distinct.

## Consequences

- **A summary follows its Feedback for as long as the quarter lasts**, which is the behaviour design
  0025 described and its key would have prevented.
- **Two messages written in the same instant enqueue two refreshes.** The second is wasted work, not
  a wrong answer: generation reads the corpus again and replaces the row. Accepted rather than
  solved, because the alternative is a lock on a path whose cost is one model call.
- **The key no longer says which period it belongs to**, so a dead row is read by opening its
  payload. Acceptable: a dead row is read by hand already.
- **Design 0025 D4 is amended rather than reversed.** Its reasoning — the two seams, no scheduler,
  no generation on a read — stands; only the key changes.

## Alternatives rejected

- **Keeping the period key and deleting the delivered row sooner.** It would make the dedup window
  the retention window, so a change to retention would silently change how often a summary may be
  rewritten. Two unrelated things, one number.
- **A key naming the period and the watermark instant.** The same effect through a timestamp rather
  than an id, and two messages in one millisecond would then collapse into one — losing a
  regeneration rather than wasting one. The wrong side to err on.
- **Enqueuing only from the read path.** One seam, one key, no collision — and a summary that is
  always one page view behind, written while the Member waits for the page that asked for it.
- **Letting the handler decide whether work is needed.** It already does — it reads the corpus and
  may write nothing. But reaching the handler costs a claim, an attempt and a row, and the key is
  what keeps that from happening five times over.

## Links

- ADR 0076 (the outbox: unique key, seven-day sweep, per-handler attempts)
- ADR 0077 (the model port the handler calls)
- `docs/design/0025-your-feedback-summary/technical-design.md` D4, amended by this record
- Brain `ADR-0051` (what AI is for)
