# 0076 — An outbox table drains in the API process, and delivery is at least once

Status:   proposed
Date:     2026-10-31
Deciders: naroebordin

## Context

Nothing in this application can do work after a request ends. There is no queue, no cron, no event
bus and no outbox: `apps/api/package.json` has no `@nestjs/schedule`, no `bull` and no
`@nestjs/event-emitter`, and `compose.yaml` is one Postgres service. `BE_17`, `BE_18` and `BE_19` are
all `todo`.

So every after-commit side effect is fire-and-forget, and the code says so in three places:

- `fan-out-person-notifier.adapter.ts` — "A lost Notification is accepted, named and not retried:
  there is no outbox (`BE_17` is `todo`), and the thing this is about has already committed."
- `channel-announcer.port.ts` — "Every method resolves rather than rejecting; a refused post is logged
  once and forgotten… There is no delivery state and no retry."
- ADR 0062 — the same, for the channel announcement it introduced.

That was the right call each time: the alternative was failing a Member's write because Discord was
unreachable. But the cost has compounded. A bell line that cannot be written is gone; nobody knows;
nothing can replay it. And the AI work now planned adds a third consumer with the same shape, which
is the point at which "accepted loss" stops being a considered trade and starts being the default.

`BE_17`'s index entry is `todo`, so **the entry is the binding text**: "the transactional outbox table
and its relay, event schema and versioning, at-least-once delivery, consumer idempotency, retries, DLQ
and poison-message handling", with `data-paths="apps/api/**/outbox/**"`. This record answers it clause
by clause and names where it interprets.

## Decision

**One Postgres table, written inside the caller's transaction, drained by a poller in the API
process. Delivery is at least once, and every handler must be idempotent.**

### It does not live under `modules/`

Port in `shared/application/`, adapter and relay in `apps/api/src/infrastructure/outbox/`, the handler
registry assembled at the composition root. Two structural reasons, both verified rather than assumed:

1. **It would be an import cycle.** A relay under `modules/outbox` must import its consumers'
   adapters, and those consumers must import its port. `.dependency-cruiser.cjs` sets
   `tsPreCompilationDeps: true`, so **even a type-only import counts** and `no-cycles` fails CI.
   Putting the port in `shared/application/` — which imports nothing — and building the handler map in
   `app.module.ts` breaks the cycle by construction.
2. **No role suffix fits.** `apps/api/scripts/check-architecture.mjs` enforces a closed `ROLE_SUFFIXES`
   list for every file under `modules/`. There is no `.relay.ts`, `.poller.ts` or `.job.ts`. Files
   outside `modules/` are exempt, which is the honest place for something that belongs to no bounded
   context.

The outbox is part of the unit of work, not a second module's table. That is what lets a use case
enqueue without transacting across a module boundary (`BE_03` R7).

### The table

`outbox_message`: `id`, `type`, `version`, `payload`, `idempotencyKey @unique`, `availableAt`,
`attempts`, `deliveredAt`, `deadAt`, `lastError`, `createdAt`.

- **`type` is `<owning module>.<event>`** — `integrations.feedback_published`. One string is the
  registry key, the idempotency-key prefix and the log field.
- **`version` answers `BE_17`'s "event schema and versioning".** A breaking payload change ships as a
  **new `type`**, never a new version of an old one, so the old handler keeps draining rows already in
  the table. `version` exists for additive change and for reading a row by hand later.
- **`payload` carries ids and enums only — never a Feedback message, never a name, never an email.**
  It is the one field that could carry something about a person, and `AGENTS.md` §6 and `BE_20` decide
  it.
- **`idempotencyKey` is what makes a second enqueue of the same thing a no-op.** Only the caller can
  tell two enqueues of the same shape apart, so the caller builds it: `<type>:<subject id>`.

The index the relay needs is **partial**, which Prisma 7 cannot declare, so it goes in the migration
SQL by hand — the `CHECK` constraint on `feedback` is the precedent:

```sql
CREATE INDEX "outbox_message_due_idx" ON "outbox_message" ("available_at", "id")
  WHERE "delivered_at" IS NULL AND "dead_at" IS NULL;
```

The predicate keeps the index the size of the backlog rather than the size of history, which is what
makes keeping delivered rows for a week affordable.

### Enqueue joins the caller's transaction

`Outbox.enqueue(messages)` writes through `PrismaTransactionContext.client`, so the thing and the
promise to tell somebody about it commit together or not at all. It **rejects outside a unit of work**,
because an outbox row written outside the transaction it belongs to is the exact bug this exists to
prevent. ADR 0031 is unchanged; this is the interaction `BE_14`'s index entry anticipates.

### The relay

A recurring `setTimeout` chain — not `setInterval`, which stacks ticks when one runs long — started
from `OnApplicationBootstrap`. Three short steps per tick, and **no transaction is ever held across a
handler**:

1. **Claim.** One statement leases a batch and counts the attempt at the same time:
   `UPDATE … SET attempts = attempts + 1, available_at = now() + <backoff> WHERE id IN (SELECT id …
   WHERE delivered_at IS NULL AND dead_at IS NULL AND available_at <= now() ORDER BY available_at, id
   FOR UPDATE SKIP LOCKED LIMIT 20) RETURNING *`.
2. **Work**, outside any transaction, sequentially, each handler raced against a 30 s timeout.
3. **Settle**, one short transaction per message: `deliveredAt`, or `deadAt` when the attempts are
   spent or the handler said the message can never succeed. A plain rejection needs no write at all —
   the lease in step 1 already scheduled the retry.

Then a capped sweep deleting rows delivered more than seven days ago.

**`FOR UPDATE SKIP LOCKED` rather than a leader election**, because the Railway replica count is not
knowable from this repository — it lives in the dashboard, and ADRs 0033–0035 and `PROJECT.md` §4 are
all silent on it. With `SKIP LOCKED` two relays never claim the same row, so the design is correct for
any replica count and costs nothing extra to make so. An advisory-lock singleton would make
correctness depend on a fact this repository cannot state, and would serialise the whole backlog
behind one pod.

### Retries are per handler, not global

`OutboxHandler` declares its own `maxAttempts`. This is the one place the design pays for
configurability, and it earns it: **at-least-once is an improvement for one consumer and a regression
for another.**

- `notifications.*` → `maxAttempts: 5`. The `notification` table is already idempotent
  (`@@unique([recipientAccountId, type, subjectId])`), so a repeat is a no-op and a retry is pure gain.
- `integrations.*` → `maxAttempts: 1`. A Discord channel post **cannot be taken back** (brain
  `ADR-0040`), and there is no idempotency key on the Discord side. Retrying it five times trades
  "occasionally lost" for "occasionally doubled in front of the whole team, including guests" — which
  is strictly worse. One attempt keeps today's at-most-once behaviour, but now the failure is a **dead
  row somebody can see and replay by hand** instead of a line in a log.

A handler may also say a message can never succeed; that row goes dead immediately rather than
spending its remaining attempts. An **unknown `type`** — a row enqueued by a version that has since
been deployed away — goes dead rather than looping forever. That is `BE_17`'s poison-message clause.

### `BE_18` and `BE_19`

`BE_18` (queues, worker topology, concurrency, scheduled jobs, cancellation, draining, observability)
is answered **without creating `apps/worker/`**: `AGENTS.md` §9 forbids a new top-level directory
unasked, and Railway runs two services (ADR 0033). Topology is "the API process, on every replica".
Work is sequential within a batch, so one slow handler cannot multiply outbound load on Discord or on
a model provider. Draining uses `OnApplicationShutdown`, which already fires because `main.ts` calls
`enableShutdownHooks()`. Observability is one `logger.log` per tick **that did work** — silence when
idle, or the logs are noise — and one `logger.warn` per dead row, carrying id and type only.

`BE_19` (Redis) is **deliberately untouched.** Where a reader would reach for a distributed lock, the
answer is `SKIP LOCKED`. No Redis is added, and `compose.yaml` does not change.

## Consequences

- **Delivery becomes at-least-once; it was at-most-once.** Every handler must now be idempotent, and
  that is a contract on the port, not a hope. A handler that times out may still have succeeded
  server-side — which is exactly why.
- **This does not close ADR 0058**, and the record must say so plainly or nobody will revisit it. The
  unique `idempotencyKey` de-duplicates the *delivery* of one Feedback id. A genuine double-submit
  creates two Feedback rows with two ids, so two posts. The remedy for that is still a request
  `Idempotency-Key` (`BE_07` R8). What this does remove is the other half ADR 0058 flagged: a retry no
  longer risks a second post.
- **Side effects arrive up to one poll interval late.** Invisible for a Discord post; the bell already
  refreshes on its own schedule.
- **Standing load, forever.** One `UPDATE … SKIP LOCKED` every poll interval per replica even when
  idle, plus one held connection on Supabase's session pooler. Measure it after the first deploy; a
  longer interval is a config change.
- **The BDD suite needs a deterministic drain.** 229 scenarios against a polling relay will flake. A
  test-only `drainOnce()` called from the steps is part of this change, not a follow-up. This is the
  piece most likely to force a rethink, so it lands first.
- **Two call sites get shorter.** `OfferFeedbackUseCase` and `GiveKudosUseCase` lose their
  `void … .catch(…)` blocks and `OfferFeedbackUseCase` loses its `Logger`.
- **Two TSDoc comments become false** and are rewritten in the same change: `channel-announcer.port.ts`
  and `fan-out-person-notifier.adapter.ts` both currently state that no outbox exists.
- **Rollback:** stop the relay, and the enqueues become rows nobody drains. Restore the two
  fire-and-forget call sites and drop the table.

## Alternatives rejected

- **Keep fire-and-forget and accept the loss.** Defensible for one consumer, indefensible for three,
  and it is already indefensible for a notification nobody knows was lost.
- **Add BullMQ and Redis.** A broker, a dependency, a compose service and an `apps/worker/` — for a
  pre-launch product with one Postgres. `PROJECT.md` §2: solve today's problem. Postgres is already
  there and already transactional, which is the property this needs.
- **`@nestjs/schedule` for the timer.** A dependency to replace a `setTimeout` chain, when
  `OnApplicationBootstrap` and `OnApplicationShutdown` already exist and shutdown hooks are already on.
- **A leader-elected singleton relay behind an advisory lock.** Correctness would depend on the replica
  count, which this repository cannot state, and throughput would be capped at one pod.
- **One global `maxAttempts`.** It would either lose notifications that could be retried, or double
  Discord posts that cannot be unsent.
- **Putting the outbox under `modules/`.** The cycle and the role-suffix check, above.
- **A generic event bus.** Nothing else has one, two consumers do not pay for it (ADR 0062 rejected
  the same thing), and an in-memory bus would not survive the crash this exists to survive.

## Links

- `BE_17`, `BE_18`, `BE_19`, `BE_14`, `BE_16` — all `todo`; their index entries are the binding text
- ADR 0031 (one transaction per use case), ADR 0058 (no idempotency key yet), ADR 0062 (the
  fire-and-forget channel announcement this replaces)
- Brain `ADR-0040` (a channel post cannot be taken back), brain `ADR-0035` §8
- `BE_03` R7, `BE_05` R9, `BE_07` R8, `BE_20`; `AGENTS.md` §6, §9
