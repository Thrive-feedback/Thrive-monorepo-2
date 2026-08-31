---
title: "GEN_14 · Glossary & ubiquitous language"
id: "GEN_14"
area: "GEN"
tier: "P1"
status: "stable"
updated: "2026-08-15"
requires: [GEN_07]
see_also: [BE_04]
---

[Conventions](../index.html) / General / GEN_14

# [General] Glossary & ubiquitous language

`P1` · `GEN_14` · `stable` · `updated 2026-08-15`

**Open when:** you introduce a new domain term, or meet one you cannot define.

The words the domain uses and the one spelling each is allowed to have in code, DB, API and UI. A project starts with an empty table; the first feature fills it.

## The rules

If you read nothing else:

1. <a id="R1"></a>One term, one spelling — in code, in the database, on the wire, in the UI, in tests and in tickets.
2. <a id="R2"></a>Add the term when it first appears in a name or a rule, not afterwards.
3. <a id="R3"></a>Define what it is and, where it helps, what it is not.
4. <a id="R4"></a>Use the word the business already uses, not the one engineering invented.
5. <a id="R5"></a>No synonyms. Pick one word and delete the others from the codebase.
6. <a id="R6"></a>A word that means two things gets two names, or an explicitly named context.
7. <a id="R7"></a>Renaming a term renames the code, in the same change.
8. <a id="R8"></a>Keep implementation out of the definition.
9. <a id="R9"></a>List only terms that carry rules. This is not a dictionary of English.
10. <a id="R10"></a>A disagreement about what something means is a glossary defect. Fix it here first.

## Why

Every system develops two vocabularies: the one the business speaks and the one the code speaks. Once they diverge, every conversation carries a silent translation step, and every translation is a place to be wrong. The bug where "active" meant *not deleted* to one person and *currently in use* to another does not look like a vocabulary problem when it reaches production.

A shared glossary is also the cheapest thing you can give an agent. It has no access to the conversation where the term was coined, so an undefined word gets whatever meaning is most common in its training data — which is how a codebase acquires `user`, `customer`, `account` and `member` for one concept.

## Rule detail

### [R1](#R1) One spelling, everywhere

The same concept keeps its word across every representation. Casing changes to suit each layer's conventions ([GEN_07#R2](../index.html#GEN_07)) — the word does not. A term that survives from the ticket to the column name is a term nobody has to translate.

**Do**

```
ticket   "archive an order"
class    ArchiveOrder
column   orders.archived_at
wire     { "archivedAt": … }
UI       "Archive"
```

**Don't**

```
ticket   "archive an order"
class    OrderDeactivator
column   orders.is_hidden
wire     { "removed": true }
UI       "Hide"
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R3](#R3) Define the boundary, not just the word

A definition earns its place by settling the cases people argue about. "A customer is someone who has placed an order" is a definition; it also answers whether a signed-up visitor is a customer, which is the question that was actually going to cost a day. Where the neighbouring concept is easy to confuse, say what the term excludes.

| Term | Is | Is not |
| --- | --- | --- |
| **Archive** | Hiding an order from the customer's default list, reversibly, keeping all data. | Deleting it, cancelling it, or affecting anyone else's view of it. |

**Enforcement:** review — nothing can check a definition.

### [R5](#R5) No synonyms

Two words for one concept means every reader has to work out whether the difference is meaningful, and every writer has to choose. It is never worth it. When you find a synonym, the fix is not to document both — it is to pick one and rename the other away ([R7](#R7)). The exception that looks like a synonym and is not: two words for two genuinely different concepts that happen to overlap today. Those get [R6](#R6), not a merge.

**Enforcement:** unenforced — a candidate guardrail is a banned-word list once the glossary has entries ([INFRA_06](../index.html#INFRA_06)).

### [R7](#R7) Renaming a term renames the code

A glossary the code contradicts is worse than no glossary, because it is authoritative and wrong. If the business changes the word, the rename lands in the same change — types, columns, wire fields and UI copy. Where a wire field or a column cannot move immediately ([GEN_08#R7](../index.html#GEN_08), [BE_15](../index.html#BE_15)), the glossary entry records the old spelling and the reason, and it is a deprecation with a removal date ([GEN_15](../index.html#GEN_15)) rather than a permanent footnote.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R8](#R8) No implementation in the definition

The glossary describes the domain, so it survives a rewrite. The moment a definition mentions a table, a nullable column or a queue, it dates itself and it stops being something a non-engineer can confirm.

**Do**

```
Archived order — an order the customer has
hidden from their default list.
```

**Don't**

```
Archived order — an order row where
archived_at is not null and the cache
key has been invalidated.
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

## Worked example

The table below is the shape every entry takes. A new project has none until its first feature adds one.

| Term | Definition | Not | Spelled |
| --- | --- | --- | --- |
| **Customer** | Someone who has placed at least one order. | A visitor who has signed up but never ordered — that is an **account**. | `Customer`, `customers`, `customerId` |
| **Archive** | Hiding an order from the customer's default list, reversibly. | Deleting, cancelling, or hiding it from anyone else. | `ArchiveOrder`, `archived_at`, `archivedAt` |

The **Not** column is doing the work. Without it, the first person to build a signup flow creates a second `Customer` that has never ordered, and both meanings are now in the codebase with no way to tell them apart.

## Checklist

- Every new domain term is in the glossary before the change merges ([R2](#R2)).
- The term is spelled the same in code, database, wire and UI ([R1](#R1)).
- The definition says what the term excludes where confusable ([R3](#R3)).
- The word is the business's, not an invention ([R4](#R4)).
- No synonym was introduced or left behind ([R5](#R5)).
- An overloaded word was split or given a context ([R6](#R6)).
- Any renamed term was renamed in the code too ([R7](#R7)).
- No implementation detail in a definition ([R8](#R8)).
- Nothing was added that carries no rule ([R9](#R9)).

## Open questions

- The glossary table lives in this document, which means editing a convention document is routine work for every feature — an exception to [GEN_01#R10](../index.html#GEN_01)'s expectation that convention changes are deliberate. Whether the table should move to its own file is undecided.
- [R6](#R6) allows a named context for an overloaded word, which is the seam where this document meets module boundaries ([BE_03](../index.html#BE_03)). Nothing says whether a per-module glossary section is allowed or whether one flat list is the rule.
- [R5](#R5) and [R7](#R7) together imply a repository-wide rename can be required by a business vocabulary change. No rule caps how large that is allowed to get before it becomes a deprecation instead ([GEN_15](../index.html#GEN_15)).

## Related

Requires [GEN_07](../index.html#GEN_07). See also [BE_04](../index.html#BE_04).

---

[← All conventions](../index.html)
