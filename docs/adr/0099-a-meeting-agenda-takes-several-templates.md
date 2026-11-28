# 0099 — A meeting's agenda takes several templates, and each topic names the one that asked it

Status:   proposed — accept or change it on review
Date:     2026-11-28
Deciders: kritpavin

## Context

While a 1:1's next meeting is prepared, either person may use a template for its agenda (brain
ADR-0060 §8, ADR-0061 §6). Until now one template took the place of the last: using a second one
removed the first one's questions and added its own. A meeting stored which template it used in one
reference, `templateKey` or `templateId` (ADR 0096). The agenda labelled every template question
"From {that template}".

People preparing a meeting want to combine templates: a weekly check-in and a career conversation in
the same meeting, say. Replacing one with the other made that impossible. And once an agenda holds
questions from two templates, the meeting's single reference can no longer say which template asked
which question.

The behaviour was decided with the owner on 2026-11-28:

- using a template adds its questions;
- a template in use cannot be used again until its questions are gone;
- its questions can be taken off one by one, as any topic is, or all at once from the picker
  (added the same day, at the owner's request).

## Decision

**Using a template adds its questions after the agenda's topics. Each topic names the template that
asked it. A template is used once while any question it asked is still on the agenda.**

- **Add, never replace.** `OneOnOneMeeting.useTemplate` appends the template's questions after every
  topic, whether carried over, added by a person, or from another template. A question whose words
  are already on the agenda is not asked twice. Nothing already there goes.
- **Each topic names its template.** `one_on_one_topic` gains `templateKey` and `templateId`, at most
  one of them set, with the same split as the meeting's: a Thrive key, or a kept template's id as a
  foreign key with `ON DELETE RESTRICT` (ADR 0096). On the wire a topic carries one `templateKey`.
  The next meeting answers `templates`: each template in use, once, in agenda order, with its name.
  The names are read in one query however many templates there are (`BE_06` R9).
- **"In use" is read from the topics, not stored.** A template is in use while a topic it asked is on
  the agenda. Using it again is refused as `ONE_ON_ONE_TEMPLATE_IN_USE` (409). Once every one of its
  questions is removed, it may be used again.
- **A template comes off whole.** `DELETE …/meetings/{meetingId}/template/{templateKey}` takes every
  question that template asked off the agenda at once, while it is prepared, whoever used it. A
  template not on the agenda leaves it as it is (204). The picker offers it as Remove from agenda
  where it used to say In use.
- **The meeting's reference stays, as the template used last.** `one_on_one_meeting.templateKey` and
  `templateId` are still written, and `templateName` is still answered, deprecated, so nothing that
  reads them breaks (`GEN_08` R7).

## Consequences

- **Migration.** One expand-only migration, `one_on_one_topic_template`, adds the two columns and the
  foreign key. No existing row is changed.
- **Topics stored before this change.** A topic from a template stored before it names no template.
  The mapper reads it as the meeting's template, the only one its agenda could have held then, and
  writes that back on the meeting's next save. No backfill is needed.
- **Deleting a kept template.** A kept template is now restricted by the topics that name it as well
  as by 1:1s and meetings. Templates are only ever marked removed, never deleted, so this changes
  nothing today (ADR 0096).
- **Brain ADR-0060 §8.** It says "the Lead may switch the template for one session". This decision
  replaces *switch* with *add*. That ADR needs a note recording the change, made in the brain.
- **Carry-over.** A topic carried over to the next meeting keeps its words and drops its template, as
  before. It reads "From last time".

## Alternatives considered

- **Keep one template per meeting.** This is what the owner asked to change.
- **Store a list of template references on the meeting.** It answers "which templates" but not "which
  template asked this question". It also has to be kept in step with the topics as they are removed.
  Rejected: the topics already say it.
