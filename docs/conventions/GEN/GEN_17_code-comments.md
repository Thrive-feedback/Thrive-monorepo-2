---
title: "GEN_17 · Code comments"
id: "GEN_17"
area: "GEN"
tier: "P1"
status: "draft"
updated: "2026-09-28"
requires: [GEN_07]
see_also: [GEN_06, GEN_12]
---

[Conventions](../index.html) / General / GEN_17

# [General] Code comments

`P1` · `GEN_17` · `draft` · `updated 2026-09-28`

**Open when:** you are writing, editing or reviewing a comment in code.

When code earns a comment and when it must explain itself instead, what a comment may cite, the two cases where a convention id belongs in code, the exemption for example code, text that ships, and keeping comments true as the code changes.

## The rules

If you read nothing else:

1. <a id="R1"></a>Make the code explain itself first — rename, extract or type it — and comment only what is still unclear.
2. <a id="R2"></a>Leave a simple function uncommented. Comment one whose logic its body does not show: an algorithm, an ordering that matters, an outside constraint, a workaround.
3. <a id="R3"></a>Write the reason itself. A reader must understand the comment without opening another file.
4. <a id="R4"></a>Do not cite a convention id in a comment, unless the code would look like a mistake without it.
5. <a id="R5"></a>Cite the id in code whose job is to enforce a convention — a guardrail, a rule report — because there the id is the subject.
6. <a id="R6"></a>In code `PROJECT.md` §3 lists as example code, citing ids is allowed, never required.
7. <a id="R7"></a>Never put a convention id in text that ships: an API description, an error message, a log line, UI copy.
8. <a id="R8"></a>Update or delete a comment in the same change that makes it false.
9. <a id="R9"></a>Keep history out of comments — no "was", "moved from", "added for". The commit holds it.

## Why

A comment is read far more often than it is written, and almost always by someone looking at one file, in a diff or an editor, with nothing else open. Everything here serves that reader. A comment that sends them elsewhere — to a document, a ticket, a commit — has failed at the only thing a comment can do that a name cannot, which is to be *here*.

Convention ids are the sharpest case. `// FE_10 R5 — the correlation id is set here` reads as authority, but tells the reader which rule and never why this line. The paraphrase that usually follows is a second copy of a rule that already lives in a document, and it drifts the first time the document changes. When the conventions are copied into another project, ids get renumbered or deleted and the comment points at nothing. [GEN_07#R7](../index.html#GEN_07) already says comment why, never what; this document says what the why is made of, and when there should be no comment at all.

## Rule detail

### [R1](#R1) and [R2](#R2) Earn the comment

Before writing a comment, ask whether a change to the code would make it unnecessary. A comment explaining what a variable holds is a request for a better name. A comment introducing the three phases of a function is a request for three functions. A comment warning that a value must not be null is a request for a type ([GEN_07#R5](../index.html#GEN_07)).

What is left after that is the comment worth writing: the thing the code cannot say. That is usually one of four kinds — an algorithm whose correctness is not visible from its steps, an ordering that would break if someone "tidied" it, a constraint imposed from outside the codebase, or a workaround and what it works around. A short function with clear names and types needs none of them, and gets no comment. Exported symbols follow [GEN_07#R8](../index.html#GEN_07) for TSDoc; this rule is about everything else.

**Do**

```
// The store renames over the old file so a crash mid-write
// leaves the previous version, never half of the new one.
await writeFile(tmpPath, body);
await rename(tmpPath, path);
```

**Don't**

```
/** Returns the list with the given id. */
export function findListById(id: TodoListId): TodoList | undefined {
  return lists.get(id);
}
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R3](#R3) and [R4](#R4) The reason, not the reference

Write the reason in plain words at the point it applies. A convention id, a ticket number or "see the docs" is a pointer, and a pointer makes the reader leave the file to understand the line in front of them. If the reason is truly long, the comment states it in a sentence and the detail lives in the document — but the sentence stands on its own.

The one case for an id in an ordinary comment is code that looks wrong. A deliberate departure from a convention — a suppression, a pattern a reviewer would otherwise "fix" — carries the id, so the next reader knows the departure is known and where it was argued. Even then, the reason comes first and the id follows it.

**Do**

```
// A failure crosses the wire as a stable code, so callers
// branch on `code` and never on the HTTP status.
export class ApiError extends Error { … }
```

**Don't**

```
/**
 * GEN_08 R5 — a failure crosses the wire as a stable code.
 * FE_10 R7 — normalizing here means one error shape.
 */
export class ApiError extends Error { … }
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R5](#R5) Where the id is the subject

Some code exists to enforce a convention: an architecture check, a custom lint rule, a script that fails a build. There the id is not a pointer but the message — the report says `BE_02 R3` because that is the name of what failed, and the comment above each check names the rule it implements for the same reason. Keep ids there, and keep them in the output a failing check prints.

**Enforcement:** review.

### [R6](#R6) Example code is exempt

The reference implementation exists to demonstrate the conventions, and each document points back at it ([GEN_12#R6](../index.html#GEN_12)). A reader studying it is often looking for the rule a line satisfies, so an id there is useful rather than noise. Citing is allowed, not required: new example code may follow [R3](#R3) instead, and a rewrite of an example comment may drop its id. The exemption covers comments only — [R7](#R7) still applies. It ends the moment `PROJECT.md` §3 stops listing the code as example code.

**Enforcement:** review.

### [R7](#R7) Nothing ships an id

An API description, an error message, a log line or UI copy leaves the repository. Its reader has no index, and a published contract that says `BE_07 R8 — replaying a create…` has leaked an internal document's numbering to every consumer. Write the behavior the reader can rely on, and nothing else. For generated artifacts, fix the source and regenerate; never edit the output.

**Enforcement:** review — see Open questions.

### [R8](#R8) and [R9](#R9) Keep it true, keep it present

A comment the code no longer matches is worse than none, because the reader trusts it. The change that alters the behavior updates the comment beside it, or deletes it — the same reasoning as deleting what you replaced ([GEN_16](../index.html#GEN_16)). Comments describe the code as it is. "Previously this used a map", "moved from the controller", "added for the March import" describe changes, and the commit and the pull request already hold them with an author and a date.

**Enforcement:** review.

## Worked example

A client factory, commented the way an agent often writes it:

```
/**
 * FE_10 R1 — the one way this repository talks to the backend.
 * FE_10 R4 — constructed once per runtime from configuration.
 * FE_10 R5 — the correlation id is set here.
 * FE_10 R7 — a failure leaves as an `ApiError`, never a status.
 */
export function createApiClient(config: ApiClientConfig): ApiClient { … }
```

Four ids, and a reader still has to open a document to learn which parts matter. Apply the rules in order. [R1](#R1): the name and the return type already say what it builds. [R3](#R3): keep what a caller can rely on and cannot see from the signature. [R4](#R4): drop the ids.

```
/**
 * Every request carries a correlation id, set here so no call site
 * can forget it. Every failure leaves as an `ApiError` with a code,
 * so callers never interpret an HTTP status.
 */
export function createApiClient(config: ApiClientConfig): ApiClient { … }
```

The rewrite is shorter, it survives the conventions being renumbered, and it tells a caller the two things that change how they write code against it.

## Checklist

- No comment restates what a better name, a smaller function or a type would say ([R1](#R1)).
- Simple functions carry no comment; complex ones say what their body does not show ([R2](#R2)).
- Every comment makes sense without opening another file ([R3](#R3)).
- No convention id in a comment, except a deliberate departure, after its reason ([R4](#R4)).
- Guardrail code and its output name the rule they enforce ([R5](#R5)).
- Any id-citing comment is in code `PROJECT.md` §3 lists as example code ([R6](#R6)).
- No id in an API description, error message, log line or UI copy — including generated output, fixed at its source ([R7](#R7)).
- Every comment beside changed behavior was updated or deleted ([R8](#R8)).
- No change history in comments ([R9](#R9)).

## Open questions

- [R7](#R7) is the one rule a tool could catch cheaply: a search for the id pattern inside string literals and generated contract files, failing the build on a hit. It belongs to [INFRA_06](../index.html#INFRA_06) and would make [R7](#R7) automated.
- A search for ids in comments outside example code would catch most breaks of [R4](#R4), but [R5](#R5) and the departure case need an allow-list, and nothing has decided whether that list lives in the check or in a marker comment.
- The line between "complex enough to comment" and "simple" in [R2](#R2) is review taste, which [GEN_06](../index.html#GEN_06) wants to avoid. The four kinds are the current answer; a first recurring review dispute should sharpen them.

## Related

Requires [GEN_07](../index.html#GEN_07). See also [GEN_06](../index.html#GEN_06), [GEN_12](../index.html#GEN_12).

---

[← All conventions](../index.html)
