# 0085 — A deployment without a model provider runs with AI switched off

Status:   accepted
Date:     2026-11-14
Deciders: naroebordin

Supersedes the *"Making the key optional, with the feature disabled when absent"* alternative
rejected by [ADR 0077](0077-the-api-asks-a-model-over-an-openai-compatible-endpoint.md). Everything
else in 0077 stands.

## Context

ADR 0077 made all four `AI_PROVIDER_*` values required at boot, with no defaults, and rejected
making them optional in one line: *"Two code paths forever, and the disabled one is the one nobody
tests."* That was the right worry and it is still the right worry.

What it did not anticipate is the case Thrive is actually in. The feedback summary is merged and
production has no model provider — no key has been bought. Under 0077 the consequence is not that
the summary is unavailable; it is that **`thrive-api` refuses to boot**. Sign-in, feedback, Kudos,
notifications: all of it down, because one feature nobody can use yet has no credential.

That is a worse failure than the one 0077 was protecting against. "A half-configured AI feature is
worse than a refused boot" is true of a *half*-configured one. It is not true of an absent one.

## Decision

**All four values, or none.**

- **All four** — the AI features work exactly as ADR 0077 describes. Nothing about that path
  changes.
- **None** — the API boots, and everything that would ask a model does nothing instead. `AiModule`
  binds `AiCompleter` to `AiNotConfigured`, which throws rather than reaching a network, and
  publishes `AI_IS_CONFIGURED` as `false`.
- **Some** — the environment schema refuses to parse, and the API does not boot. A half-set
  provider is a feature that never works and never says why, which is precisely 0077's point.

### Switched off is a thing the application holds, not a branch everybody writes

0077's objection was two code paths. There is one extra path, it is three lines long, it appears in
three places, and each one is tested:

1. **The write path enqueues nothing.** No outbox rows that could only ever die.
2. **The read path enqueues nothing**, and reports `isAvailable: false`.
3. **The handler kills a message instead of retrying it.** A row enqueued while a provider was
   configured and drained after it went away is `UnprocessableOutboxMessage` — never, not later —
   so it cannot spend three attempts on a question nothing can answer.

### The page says which nothing it is

`GET …/me/summary` answers `isAvailable` beside the summary, and the dashboard draws two different
empty states: *"there is not enough written to you yet"* when a provider exists, and *"summaries
are not switched on here yet"* when none does.

This is the part worth insisting on. The two sentences are not interchangeable: the first is a
statement about the person's own Feedback, and saying it to somebody who has plenty written to them
is a falsehood told by Thrive about their colleagues' words. The same reasoning retires the quieter
version of that bug — a read the API could not answer now reports unavailable rather than empty.

## Consequences

- **Production can take the feature before it takes a provider**, which is the situation that
  forced this record.
- **The disabled path is the one nobody tests, unless somebody does.** Specs cover all three seams
  and both empty states; the Gherkin suite still runs with a provider configured, because that is
  the path a Member is meant to walk.
- **A deployment can be switched off by accident** — delete one variable too many and summaries
  stop, quietly, forever. The page says so to anybody who opens it, and nothing else in Thrive
  changes. Accepted; the alternative is the outage this record exists to prevent.
- **`AI_IS_CONFIGURED` is a boolean, not the provider.** Which endpoint answers stays inside
  `AiModule`, so brain `ADR-0051`'s "bound to no provider" is untouched.
- **Nothing is retried into existence.** Turning a provider on does not rewrite the summaries that
  were skipped while it was off: the read path asks for one the next time somebody opens the page,
  which is when it matters.

## Alternatives rejected

- **Keeping 0077 as it stands and setting placeholder values in Railway.** The API would boot and
  every generation would fail against an endpoint that does not exist — three attempts each, a
  dead row each, and a dashboard that says too little has been written. Every cost of the feature
  and none of its benefit.
- **A separate `AI_ENABLED` flag.** A second thing to get wrong, and it can disagree with the
  credentials. Whether a provider is configured is already the answer.
- **Defaulting the endpoint to something harmless.** 0077 rejected defaults and was right: a
  default endpoint is a wrong production target nobody notices.
- **Letting the feature fail loudly per request instead of switching off.** That is what happens
  today for a *half*-set provider, and it is right there, because somebody meant to configure one.
  Where nobody did, failing repeatedly is noise with a bill attached.

## Links

- ADR 0077 (the port and adapter; this supersedes only its optional-key alternative)
- ADR 0076 (the outbox whose attempts this stops spending)
- Brain `ADR-0051` (what AI is for, and bound to no provider)
- `docs/design/0025-your-feedback-summary/technical-design.md`
