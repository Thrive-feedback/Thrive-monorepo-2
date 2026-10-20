# 0053 — Feedback binds Workspace Goals and Mentions in rows of its own

Status:   accepted
Date:     2026-10-20
Deciders: kritpavin

## Context

Cards #226–#228 let a Member write `#` and a Workspace Goal, and `@` and a teammate (brain
`ADR-0036`, `ADR-0037`), in the Topic and text of Feedback, a Feedback Request's Topic and an
answer. Once sent, the text is bound for good to the active Workspace Goals and Members it names.
A Workspace Goal hidden later stays bound, and a later dashboard will count the bindings, so they
must name the Workspace Goal itself, not copy a word out of the text.

Four things needed settling:

1. **Where the bindings live.** Workspace Goals and Accounts belong to other modules, so `BE_03`
   R7 rules out a foreign key into them.
2. **How a reader shows them.** A Mention reads as the teammate's name. Looking names up on every
   read would make every Feedback screen load people.
3. **Who recognises a tag.** The web colours tags while they are typed. The API binds them on
   sending. If the two disagree, a writer sees a tag coloured that does not bind.
4. **How the API learns what a tag names.** Two other modules hold the answers.

## Decision

**Feedback stores its bindings in four tables of its own, written once at send. Readers get them
with the text and draw it from them.**

- `feedback_workspace_goal (feedbackId, workspaceGoalId, name)` and `feedback_mention
  (feedbackId, accountId, slug, displayName)`, and the same pair for `feedback_request`. Each holds
  the other module's id with no foreign key, and cascades with its Feedback or request. The name
  of a Workspace Goal cannot drift, because one is never renamed. The display name is kept as it
  was when sent (`ADR-0037`).
- Offered Feedback binds what its Topic and its text name. An answer binds only its text. A
  request binds its Topic. Every read returns `tags` (what the text is bound to) and `topicTags`
  (what to draw the Topic with). For an answer, `topicTags` are the request's.
- A tag counts wherever it is written. A hashtag is `#` and the characters a Workspace Goal's name
  may hold, matched ignoring case. A Mention is `@` and a Profile slug, which never ends in a
  separator. The rule is written twice, as `WrittenTags` in the API and `segmentsOf` with
  `TEXT_TAG_RULES` in the web, and both are tested against the same table of cases.
- Feedback asks Workspace Goal's new published `ActiveWorkspaceGoalPort.activeAmong`, Identity's
  new `AccountBySlugPort.accountsWithSlugs`, and Workspace's `membersAmong`. It asks each at most
  once per send, through one `TagsService`.

## Alternatives

- **One JSON column on `feedback`.** Simpler to migrate, but the dashboard the brain plans would
  have to unpack text to count, and no index could serve it.
- **Look Mentions up on every read.** Always the current name, but every list would need a call to
  Identity for a feature that only makes text easier to read.
- **One shared package for the tag rule.** One copy instead of two, but it means a new workspace,
  its tooling and boundary rules for about twenty lines. Two copies under one shared test table is
  cheaper until a third consumer appears (`PROJECT.md` §2).
- **The API returns the text already split into segments.** The web still needs the rule to colour
  tags while they are typed, so the duplication would remain.

## Consequences

- No existing row changes. Feedback sent before this binds nothing and reads as before.
- Changing what a tag may hold means changing both copies and the shared table in the same pull
  request. The tests fail if only one copy is changed.
- A Member who changes their display name keeps their old one in Feedback already sent.
- Feedback now depends on Workspace Goal. Workspace Goal must never depend on Feedback.

## Links

- Brain `ADR-0036` (Workspace Goals), `ADR-0037` (Mentions)
- ADR 0052 — Workspace Goal is its own module
- `BE_03` R5–R7, `BE_06` R9, `GEN_08`
