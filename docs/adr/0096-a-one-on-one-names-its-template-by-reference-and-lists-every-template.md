# 0096 — A 1:1 names its template by reference, and the templates are listed whole

Status:   proposed — designed while the owner was away; accept or change it on review
Date:     2026-11-27
Deciders: kritpavin

## Context

A 1:1's agenda opens with the questions of a template (brain ADR-0060 §8, ADR-0061 §6). Until
now the only templates were Thrive's own, which live in code under a stable key such as
`weekly-check-in`, so a 1:1 and each of its meetings stored that key in one `templateKey` column.

Templates now come in three layers: Thrive's, still in code; the Workspace's, which its Admins keep
for everyone; and each Member's own, which nobody else sees. The last two are rows in
`one_on_one_template`. A 1:1 must be able to name any of the three. And the dialogs that choose one
list every template the person may use, which now includes database rows.

Two questions follow:

- how a 1:1 stores which template it starts from, when that is sometimes a key in code and
  sometimes a row;
- whether the list of templates is paged, as `BE_07` R5 asks of every collection.

## Decision

**A 1:1 and each meeting name their template in two columns, exactly one of them set: `templateKey`
for one of Thrive's, `templateId` for a kept one, a foreign key with `ON DELETE RESTRICT`. The wire
keeps one `templateKey`. The list of templates is not paged; each kept layer is capped instead.**

- **Two columns, one of them set.** `templateKey` is now nullable and holds only a Thrive key;
  `templateId` points at `one_on_one_template`. The foreign key means a 1:1 can never name a
  template that is not there, so its agenda never opens empty by accident, and its name is read with
  the 1:1 in the same query. Prisma cannot write a CHECK constraint, so "exactly one" is held by the
  mapper: `storedTemplateRef` refuses a row that names both or neither, loudly.
- **Removing a template marks it.** A kept template is never deleted, only given a `removedAt`. It
  is then listed for nobody and chosen by nobody, but the 1:1s that start from it keep its name and
  questions. That is why `RESTRICT` costs nothing.
- **One key on the wire.** Requests and responses keep `schedule.templateKey`: a Thrive key, or a
  kept template's id. `templateRefOf` in the domain reads which it is. A UUID is a kept id; one of
  Thrive's keys is Thrive's; anything else is `ONE_ON_ONE_TEMPLATE_UNKNOWN`. No Thrive key is shaped
  like a UUID, and a spec checks that for each one. Responses also carry `schedule.templateName`,
  so the other person sees what a Member's own template is called without seeing the template.
- **Which template may be chosen is the domain's.** `mayStartFromTemplate`: any of Thrive's; a kept
  one the person sees and that is not removed; or whatever the 1:1 already starts from, so either
  person can change the time without changing a template that is the other's own.
- **The list is whole, and bounded.** `GET …/one-on-one-templates` answers Thrive's six, then the
  Workspace's, then the caller's own, unpaged. Each kept layer holds at most `MAX_TEMPLATES_PER_LAYER`
  (30) not removed, refused as `ONE_ON_ONE_TEMPLATE_LIMIT_REACHED`, so the answer is at most 66
  templates of at most 12 short questions each. Every reader needs all of it at once: the Select in
  the schedule dialogs, and the templates page. This is an exception to `BE_07` R5, cited on the
  route.

## Consequences

- One migration, `add_one_on_one_template`, adds the table, makes `templateKey` nullable, and adds
  `templateId` with its two foreign keys. No existing row changes: every 1:1 stored before it names
  one of Thrive's. There is no index on `templateId`: nothing deletes a template today, and one is
  needed only when a hard delete is.
- A shipped Thrive key is permanent. 1:1s and meetings store it, and a stored key Thrive no longer
  has is a broken row, refused loudly on read. To retire one of Thrive's templates, hide it from the
  list and keep its key in `ThriveTemplate`.
- A kept template can never be deleted while a 1:1 or a meeting names it. Should a hard delete ever
  be wanted (a Workspace leaving, say), it has to move those 1:1s to another template first.
- Raising the cap past what one read can carry means paging the kept layers, with Thrive's on a
  route of their own. That is a new decision, not a tweak to the constant.

## Alternatives considered

- **Keep one `templateKey` column for both.** No migration beyond the new table, but no foreign key:
  a lost row would leave 1:1s opening empty agendas in silence, and telling a key from an id would
  rest on the value's shape in four places. Rejected.
- **Store Thrive's templates as rows too.** One foreign key for all three layers, but Thrive's would
  need seeding into every Workspace, and changing one of them would become a data migration.
  Rejected while they are few and Thrive's to change.
- **Page the list.** `BE_07` R5's default. Every reader would have to walk all the pages anyway, for
  a list capped well below a page of 100. Rejected; revisit with the cap.
