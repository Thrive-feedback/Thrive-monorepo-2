---
title: "INFRA_07 · Environment & configuration management"
id: "INFRA_07"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-08-31"
requires: [INFRA_02]
see_also: [BE_10, GEN_09]
---

[Conventions](../index.html) / Infrastructure / INFRA_07

# [Infra] Environment & configuration management

`P1` · `INFRA_07` · `draft` · `updated 2026-08-31`

**Open when:** you are adding an environment variable or a secret.

The environment matrix, `.env` conventions and `.env.example`, what may never be an env var, and how secrets are delivered per environment.

## The rules

If you read nothing else:

1. <a id="R1"></a>Environments are a named, fixed set. Code never branches on which one it is in.
2. <a id="R2"></a>The example file is the contract: every variable appears there, with a safe placeholder, in the change that introduces it.
3. <a id="R3"></a>A real environment file is never committed, and never leaves the machine it belongs to.
4. <a id="R4"></a>A secret is delivered by the platform's secret store, per environment, and exists nowhere else.
5. <a id="R5"></a>Never put a secret in a build argument, an image layer, a URL, a log line, or a client-visible variable.
6. <a id="R6"></a>Only values that genuinely differ per environment are variables. Everything else is a constant in code.
7. <a id="R7"></a>Name variables in one scheme, scoped by the concern they configure.
8. <a id="R8"></a>Anything reaching the browser is marked public by its name, and nothing else ever is.
9. <a id="R9"></a>An application fails to start on a missing or invalid variable, and says which one.
10. <a id="R10"></a>Removing a variable removes it from every environment and the example, in the same change.

## Why

Configuration is the seam where a correct application meets a wrong environment, and its failures are unusually expensive: they appear after deploy, in the environment you can debug least, often as behavior rather than an error. Most of them reduce to one of two things — a variable that exists in one place and not another, or a value that was supposed to be a secret and was not.

The example file solves the first, and it only works if it is maintained as a contract rather than as documentation. When it lists every variable, a missing value is caught at startup on someone's laptop instead of at 2am ([INFRA_02](../index.html#INFRA_02)). When it lags by one change, everyone downstream of that change loses an hour.

The second is why so much of this document is about where secrets may not go. A secret in a repository is compromised permanently — deleting the commit does not un-leak it ([GEN_09#R2](../index.html#GEN_09)) — and the paths that leak one are all mundane: a build argument that lands in an image layer, a connection string in a URL, an error message that echoes its configuration.

## Rule detail

### [R1](#R1) The environment matrix

The set of environments is fixed and named, and every environment runs the same artifact with a different configuration. That is the property that makes a deploy predictable: what was tested is what runs, differing only in values.

Code therefore never asks which environment it is in ([BE_10#R6](../index.html#BE_10)). Every difference is a named capability — whether real mail is sent, whether seeding is allowed, how long a session lasts — so behavior is configured rather than inferred, and a preview environment can be made to behave like production one value at a time.

**Enforcement:** review — a comparison against an environment name is greppable and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R2](#R2) and [R3](#R3) The example file, and the real one

The example file lists every variable the applications read, with a placeholder that is either a working local value or an obvious dummy. It is the only inventory of what the system needs to run, and it is what the setup path depends on ([INFRA_02#R5](../index.html#INFRA_02)).

The rule that keeps it true is that a variable and its example line land in the same change. There is no "add it later": the next person's first run fails, and the failure looks like a bug in the code they just pulled.

A real environment file is never committed — not in a branch, not commented out, not "temporarily". Git remembers it, and a repository that has ever contained one has leaked it. Ignore rules should make committing one hard rather than possible-but-discouraged.

**Enforcement:** partly automated — secret scanning catches many committed credentials, and an ignore rule prevents the common case; that every new variable reaches the example file is review, and is checkable ([INFRA_06](../index.html#INFRA_06)).

### [R4](#R4) and [R5](#R5) Where secrets live, and where they may not

Secrets come from the platform's secret store, per environment, injected at run time. They are not in the repository, not in the image, not in the pipeline definition, and not in a variable that a build inlines.

Five paths leak them, and all five are ordinary:

- a **build argument**, which persists in the image's layers even when later removed;
- a **URL**, which is logged by every proxy between here and the service ([GEN_09](../index.html#GEN_09));
- a **log line or error message**, including one that dumps a configuration object for debugging ([BE_10#R10](../index.html#BE_10));
- a **client-visible variable**, which ships to every browser ([R8](#R8));
- a **default value in code**, which turns a missing secret into a working system with a public credential ([BE_10#R5](../index.html#BE_10)).

A leaked secret is rotated first and cleaned up second ([GEN_09#R2](../index.html#GEN_09)).

**Enforcement:** partly automated — secret scanning covers the repository; the image, log and URL paths are review, and image scanning is [INFRA_15](../index.html#INFRA_15)'s.

### [R6](#R6) and [R7](#R7) What is a variable, and what it is called

A variable exists because the value genuinely differs between environments. A timeout that is the same everywhere is a constant in code, where it can be typed, documented and refactored; making it configurable adds a thing to set correctly in four places and to get wrong in one.

Naming is one scheme, consistently: upper snake case, prefixed by the concern being configured — the store, the cache, the mail provider, the auth system. The prefix is what lets a namespace be handed to the module that owns it ([BE_10#R4](../index.html#BE_10)) and what makes a stray variable visible.

**Do**

```
DATABASE_URL
CACHE_URL
MAIL_API_KEY
AUTH_SESSION_IDLE_TTL_MS
```

**Don't**

```
url                  # of what?
dbUrl                # a second casing scheme
API_KEY              # which provider?
IS_PRODUCTION        # an environment name in disguise (R1)
```

**Enforcement:** review — the naming scheme is checkable against the example file ([INFRA_06](../index.html#INFRA_06)).

### [R8](#R8) The public prefix means public

Frontend frameworks inline variables carrying a designated prefix into the browser bundle. That prefix is a declaration that the value is public — visible to every user, permanently, including in old bundles that are already cached.

So the prefix is used deliberately and only for values that are genuinely public: a public site URL, a client-side analytics key intended to be public. Never for a secret, and never to "make it work on the client" — a value the browser needs that must stay secret means the browser should not be the one making that call ([FE_10](../index.html#FE_10), [BE_10](../index.html#BE_10)).

**Enforcement:** review — a secret-shaped name carrying the public prefix is greppable and is a high-value candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R9](#R9) and [R10](#R10) Fail at the start, and clean up at the end

An application validates its whole configuration at boot and refuses to start when a value is missing or malformed, naming every problem at once ([BE_10#R2](../index.html#BE_10)). A container that will not start is the cheapest possible failure; a container that starts and fails on the first request that needs the value is the most expensive.

At the other end, deleting a variable is not finished when the code stops reading it: it comes out of the example file, out of every environment's configuration, and out of the secret store if it was one. A variable nobody reads is a value someone will keep rotating, and a stale secret in a store is a live credential ([GEN_16#R9](../index.html#GEN_16)).

**Enforcement:** review.

## Worked example

A change adds outbound email.

The provider needs an API key and a sender address. The sender differs per environment; the key is a secret. Both are variables, prefixed by their concern — `MAIL_SENDER_ADDRESS`, `MAIL_API_KEY` ([R6](#R6), [R7](#R7)). The retry count, the same everywhere, stays a constant in code.

The example file gains both lines in this change: the sender with a working local value, the key with an obvious placeholder and a comment saying where a real one comes from ([R2](#R2)). Locally, a sandbox provider is used, and whether real mail is sent is its own capability variable rather than a check for the production environment ([R1](#R1)).

The real key is added to each environment's secret store and nowhere else ([R4](#R4)) — not to the pipeline definition, not to the image, and not as a build argument, which would leave it readable in a layer forever ([R5](#R5)).

The API app's configuration schema gains both, the key required with no default, so a deploy missing it fails at boot naming the variable rather than at the first password reset ([R9](#R9), [BE_10](../index.html#BE_10)). Neither is given the public prefix; the browser never sends mail ([R8](#R8)).

Later the provider is replaced. The new variables land, the old ones are deleted from the example file, from every environment, and from the secret store — in the same change that deletes the code reading them ([R10](#R10)). The old key is then rotated at the provider, because it existed in three environments and is now unmanaged.

## Checklist

- No code branches on the environment's name ([R1](#R1)).
- Every new variable is in the example file with a safe placeholder ([R2](#R2)).
- No real environment file is committed ([R3](#R3)).
- Secrets come from the secret store, and appear in no build argument, URL, log or image ([R4](#R4), [R5](#R5)).
- The value genuinely differs per environment ([R6](#R6)) and follows the naming scheme ([R7](#R7)).
- Nothing secret carries the public prefix ([R8](#R8)).
- A missing or invalid value stops the boot and names itself ([R9](#R9)).
- Removed variables are gone from the example, every environment, and the secret store ([R10](#R10)).

## Open questions

- Nothing checks that a variable read by an application exists in the example file, and that single check would prevent most onboarding breakage. It is the highest-value guardrail this document wants ([INFRA_06](../index.html#INFRA_06)).
- Secret rotation currently implies a restart, because configuration is parsed once at boot ([BE_10](../index.html#BE_10)). That is acceptable at small scale and should be revisited when a secret store with rotation is introduced.
- The environment matrix itself is a project fact belonging in `PROJECT.md`; this document assumes it exists and names none. Where it does not exist yet, [R1](#R1) is unenforceable in practice.

## Related

Requires [INFRA_02](../index.html#INFRA_02). See also [BE_10](../index.html#BE_10), [GEN_09](../index.html#GEN_09).

---

[← All conventions](../index.html)
