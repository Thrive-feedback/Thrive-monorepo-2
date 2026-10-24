# 0058 — Giving Feedback and asking for it take no idempotency key yet

Status:   accepted
Date:     2026-10-24
Deciders: kritpavin

## Context

`BE_07` R8 asks a creating `POST` to accept a client idempotency key when a retry would duplicate
state. Two routes create something a person reads:

- `POST /v1/workspaces/{workspaceId}/feedback` (Offered Feedback)
- `POST /v1/workspaces/{workspaceId}/feedback-requests`

Neither takes a key. The forms disable their submit button while sending, so a double click makes
one. Two cases still make two:

- The request reaches the API and is stored, but the response is lost to a timeout. The web shows
  an error, and the person sends again.
- The same form is sent from two tabs.

No route deletes Feedback or a Feedback Request, so a duplicate stays in Feedback for me and, when
its Visibility is Everyone, on the Workspace feed.

## Decision

**Neither route takes an idempotency key for now.** A duplicate needs a lost response or a second
tab. Thrive has no users yet, so that cost is low, while the machinery `BE_07` R8 describes would
add a table, an interceptor and a header. `BE_07` R8 allows skipping it when this is said in
review, and this record is that statement, kept where the next change can find it.

## Consequences

- A person may occasionally give the same Feedback twice, or send the same request twice, and
  cannot remove the copy.
- A copy already reaches Discord. Since #213–#215, the person it is written to, or asked of, gets a
  direct message. Notifications refuses a second one only for the same subject
  (`recipientAccountId, type, subjectId`), and a copy is a new subject, so the copy sends a second
  message that cannot be taken back.
- **Revisit before #201 ships.** Once Feedback shown to Everyone is posted to a Discord channel,
  a duplicate becomes two channel posts, and brain `ADR-0040` notes that such a post cannot be
  taken back. #201 should either add the key here first, or make posting itself refuse a second
  post for the same Feedback.
- Creating a Workspace has the same gap, already recorded in ADR 0049's consequences.

## Alternatives rejected

- **An `Idempotency-Key` header with a stored outcome (`BE_07` R8).** This is the right remedy, and
  it is reusable by #201 and by creating a Workspace. It is deferred, not refused: it needs a new
  table, a shared interceptor, and an answer to the open question `BE_07` leaves about a shared
  implementation, which goes upstream.
- **A client-generated `id` in the body, made idempotent by the primary key.** It needs no table,
  but it departs from the header that `BE_07` R8 names, and it would have to be undone when the
  shared mechanism arrives.

## Links

- `BE_07` R8, ADR 0049 (the same gap on creating a Workspace)
- Brain `ADR-0035` §5, `ADR-0040` (channel posts cannot be taken back)
