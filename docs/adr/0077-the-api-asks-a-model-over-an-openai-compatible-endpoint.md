# 0077 — The API asks a model over an OpenAI-compatible endpoint, behind a port, bound to no provider

Status:   proposed
Date:     2026-10-31
Deciders: naroebordin

## Context

Brain `ADR-0051` decides that Thrive may send a Feedback message to a model provider, that Thrive is
**bound to no provider**, and that a model only ever proposes. This record decides how the API makes
that call.

Nothing LLM-shaped is installed. `PROJECT.md` §4 has no row for it; a repo-wide search for `openai`,
`anthropic`, `llm`, `embedding`, `vector` and `langchain` returns only font licensing and an SVG
attribute. So this is a greenfield seam — and the repository already has two worked examples of
exactly this shape, deliberately mirrored on each other:

- `shared/application/email-sender.port.ts` + `infrastructure/email/resend-email-sender.adapter.ts`
- `shared/application/chat-poster.port.ts` + `infrastructure/chat/discord/discord-bot.client.ts`

Both: an abstract class as the runtime DI token, the port in `shared/application/` because it belongs
to no business capability, the adapter in `infrastructure/`, raw `fetch` and no SDK, `AbortSignal.timeout`,
three attempts, exponential backoff with full jitter, an injectable `Wait` so the retry path is
testable without the delay it is built around, one structured `logger.warn` at final failure with
deliberately narrow fields, and total-function response parsing.

The one genuinely new question is **how to stay unbound to a vendor** while still making a concrete
HTTP request.

## Decision

**One port named for the capability, one adapter named for the wire protocol, and every vendor-shaped
value in configuration with no defaults.**

### The port says nothing about any provider

```ts
// shared/application/ai-completer.port.ts
export abstract class AiCompleter {
  abstract complete(completion: AiCompletion): Promise<AiAnswer>;
}
```

`AiCompletion` carries a `system` instruction, a `prompt`, an `answerSchema` as a JSON Schema object,
and `maxAnswerTokens`. `AiAnswer` carries the parsed JSON. **It guarantees a well-formed answer or a
rejection, never a half-answer, and it promises nothing about meaning** — what a label means is the
calling module's business. Nothing above `AiModule` knows a vendor name: not a use case, not a route,
not a DTO, not the value of a log field.

### The adapter is named for the protocol, not the vendor

`infrastructure/ai/openai-compatible-ai-completer.adapter.ts`, posting to
`{baseUrl}/chat/completions` with `response_format: { type: 'json_schema', json_schema: { strict:
true, schema } }`.

Headers: `Authorization: Bearer <key>`, `Content-Type: application/json`, and **an explicit
`User-Agent` naming Thrive**. The last is not decoration: the first configured endpoint refuses some
default client User-Agents with `403` (design 0024 §12.4), and a `403` is deliberately not retried
here — so an unidentified caller would fail permanently for a reason that has nothing to do with the
credential, and the log would blame the key.

**This is the decision that buys the independence.** That request shape is spoken by OpenAI, Groq,
Together, Fireworks, OpenRouter, Azure, vLLM and Ollama, and the other major labs publish
compatibility endpoints for it. So **one adapter file reaches almost every provider**, and the switch
is three configuration values. A provider that cannot speak it gets a second adapter beside the first,
chosen in `AiModule`'s factory — **and that registry is not built until a second provider actually
exists** (`GEN_16`; an abstraction with one implementation is a guess).

### Configuration, with no defaults

A new `AiConfig` class beside `EmailConfig` and `ChatConfig`, projected from the one Zod parse in
`environment.schema.ts`, read in `AiModule`'s `useFactory`: `AI_PROVIDER_ENDPOINT`, `AI_PROVIDER_API_KEY`, `AI_PROVIDER_MODEL`,
and `AI_PROVIDER_LABEL` used only in logs. Nothing above the module holds the key.

**No default base URL and no default model.** A default endpoint is a wrong production target that
nobody notices; a default model is a silent price and quality change on the day the config is
mistyped. Required at boot, like Resend's and Discord's credentials — one rule, no switch, and a
half-configured AI feature is worse than a refused boot. `apps/api/.env.example` and
`test/support/hooks.ts` each grow a line in this change (`INFRA_07`).

### Numbers, and why they differ from the other two adapters

- `REQUEST_TIMEOUT_MS = 30_000`. A model answers in seconds; Discord's 10 s would cut a normal answer
  short and turn a success into a retry.
- `MAX_ATTEMPTS = 3`, as both existing adapters have.
- `RETRY_BASE_DELAY_MS = 1_000`, four times Resend's. A `429` here is usually a per-minute token
  bucket, and 250 ms cannot clear one.
- Retryable: `408, 429, 500, 502, 503, 504, 529`. `529` is "overloaded" at some providers; an unknown
  status costs nothing to list. Every other `4xx` is a request this code built wrong, and asking again
  is only load — the same reasoning `discord-bot.client.ts` states for `401/403/404`.
- `retry-after` is honoured over the computed backoff, exactly as `DiscordBotClient.retryAfterOf` does.

Worst case is about 98 s of wall clock. **That is why this call is never on the write path** — it runs
in a composer where a person can keep typing, or behind the outbox (ADR 0076).

### Reasoning is turned off, and the ceiling is sized for it anyway

`AiCompletion` carries no "think harder" knob, and the adapter sends **`reasoning_effort: "none"`**.

This is not a preference. Measured against the first configured provider on 2026-10-31 (design 0024
§12.1): with reasoning left on, a request for 20 output tokens returned **HTTP 200 with empty
content**, because reasoning tokens are emitted *before* the content and count against `max_tokens`.
Turning it off took latency from 1.8–2.2 s to 0.6–1.0 s and reasoning tokens to zero, with no
observed change in answer quality on the handful of cases checked.

Two consequences the code must carry:

- **`maxAnswerTokens` is sized for reasoning plus answer, not for the answer**, even with reasoning
  off — because the next provider may not honour the flag, and the failure mode is a 200 carrying
  nothing. The floor is a few hundred tokens for a classification whose answer is ~20.
- **A length finish is a rejection, never a truncated answer** (below). That is what keeps a provider
  ignoring `reasoning_effort` from becoming a silent corruption instead of a loud failure.

Avoid `reasoning_effort: "low"` specifically: on the same provider it consumed the **entire**
`max_tokens` budget and returned a truncated answer — worse than both "none" and the default on cost
and on latency. The name invites the mistake.

### Reading the answer

The finish reason is read **before** the content, always. A refusal rejects and is **not retried** —
asking the same thing again is refused again. Hitting the token ceiling rejects rather than returning
a truncated object. A body that is not JSON, or JSON of an unexpected shape, rejects. Every extractor
is a total function returning `null` rather than throwing, following `guildOf` and `channelsOf`.

The single `logger.warn` carries `{ event, provider, model, status, reason, attempts }` — `provider`
being the configured label, so the log stays readable after a swap — and **never the prompt, never the
answer, never the key**. The prompt carries a Member's Feedback message, which is personal data that
`AGENTS.md` §6 and `BE_20` keep out of logs. The code comment should say that is the reason, so nobody
"helpfully" adds the prompt while debugging.

### Structured output

`response_format` with a strict JSON Schema constrains generation rather than asking politely. The
limits the design must live inside are the **common denominator across providers**, not any one
vendor's: objects only, `additionalProperties: false`, every property in `required`, and **`maxItems`
not relied upon**, so a cap on how many items come back is enforced by the caller after parsing.

**The caller still validates.** Strict mode is the part of the OpenAI shape that providers implement
most unevenly, and a port that promises a well-formed answer has to mean it whichever endpoint is
configured.

## Consequences

- **Swapping provider is three environment variables**, and the code, the ADRs and the tests do not
  change. Price and quality stay negotiable.
- **A self-hosted endpoint is reachable later without a rewrite** — vLLM and Ollama speak this shape.
  That is the escape hatch brain `ADR-0051` relies on if its privacy stance ever tightens.
- **A de-facto standard is not a real one, and this is the price.** Providers differ at the edges:
  strict-mode support, `429` body shape, whether `max_tokens` or `max_completion_tokens` is honoured,
  whether reasoning tokens count against the ceiling. Parsing must be total, and the spike that
  precedes this work is what reveals which edges the chosen provider has.
- **This code owns the request shape**, so a provider API change breaks at runtime rather than at
  `bun install`. The alternative was worse (below), and the narrow surface — one endpoint, one
  response field — keeps the blast radius small.
- **No new dependency.** `INFRA_04` is satisfied by adding nothing.
- **No integration test.** Every test stubs `globalThis.fetch`, as the Resend and Discord adapter specs
  do; a real call would cost money and would not be deterministic.
- **The API will not boot without an AI key**, including for a developer who has no interest in the AI
  feature. That is consistent with Resend and Discord, and it is still a friction worth naming.
- **Rollback:** delete the port, the adapter, the module and the four config values. Nothing is stored,
  so nothing is migrated.

## Alternatives rejected

- **A vendor SDK.** It would re-bind the code to the vendor brain `ADR-0051` decision 2 exists to avoid,
  and it ships its own retry and timeout machinery that would sit *underneath* this adapter's attempt
  loop — so the retry path could no longer be tested without the real delay the injectable `Wait`
  exists to remove. The cost of refusing it is about twenty lines of hand-written parsing.
- **Naming the adapter after a vendor** (`claude-…`, `openai-…`). It reads honestly on day one and
  becomes a lie the first time the key changes, and it invites vendor words upward into the module.
- **A provider registry and a `AI_PROVIDER` enum now.** An abstraction over one implementation. Build
  it when a second provider that cannot speak this protocol actually arrives (`GEN_16`).
- **Defaulting the base URL and model to something sensible.** A wrong default points production at
  somebody's API and nobody notices until the bill.
- **Making the key optional, with the feature disabled when absent.** Two code paths forever, and the
  disabled one is the one nobody tests.
- **Putting the port inside the Feedback module.** It belongs to no capability — a digest, a writing
  aid and a summary would all want it — which is the same reasoning that put `EmailSender` and
  `ChatPoster` in `shared/application/`.
- **Prompt caching.** The stable prefix is far below every provider's minimum cacheable length, so a
  cache marker would silently do nothing. Revisit if the prompt grows.

## Links

- Brain `ADR-0051` (text may leave; Thrive binds to no provider)
- ADR 0038 (Resend over HTTPS — the adapter this mirrors), ADR 0076 (the outbox that carries deferred
  model work)
- `apps/api/src/infrastructure/email/resend-email-sender.adapter.ts`,
  `apps/api/src/infrastructure/chat/discord/discord-bot.client.ts`
- `BE_10`, `BE_20`, `BE_23` (`todo`), `GEN_16`, `INFRA_04`, `INFRA_07`; `AGENTS.md` §6
