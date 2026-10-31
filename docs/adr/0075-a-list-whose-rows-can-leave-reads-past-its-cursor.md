# 0075 — A list whose rows can leave reads past its cursor

**Status:** accepted, 2026-10-31

## Context

ADR 0059 pages every list by the id of the last row sent, and says a query reads `limit + 1` rows,
which Prisma positions with `cursor` and `skip: 1`. That holds while the row a cursor names stays in
the list.

`GET /waiting-asks` lists what is still Pending, and answering an Ask takes it out. Prisma's `skip`
counts rows that match the filter, so when the Ask a cursor names has been answered, `skip: 1` passes
over the next Ask instead of it. A Giver who answers the last card of a page would never see one Ask,
and nothing would say so.

## Decision

**A list whose rows can leave reads `limit + 2` rows with no `skip`, and drops the cursor's row in
code.** The extra row is for the row the cursor names, which is in the read only while it still
matches. Everything else in ADR 0059 stands, including what a client sends and receives.

A list whose rows stay, such as the Kudos list, keeps ADR 0059's `limit + 1` and `skip: 1`.

## Alternatives

- **Filter on the cursor row's sort values instead of using Prisma's cursor.** Correct, but a second
  way of paging to write and test for each order.
- **Keep `skip: 1` and accept the lost row.** Rejected: an Ask nobody sees is the one thing this list
  exists to prevent.

## Consequences

- A route that filters on a state a row can leave has to choose this form. `features/feedback-requests.feature`
  holds the case, so tidying the query back to `skip: 1` fails a scenario in CI.

Amends: ADR 0059's "a query reads `limit + 1` rows".
Referenced by: `prisma-feedback-request.query.ts`
