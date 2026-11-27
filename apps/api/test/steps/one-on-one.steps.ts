import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ApiResponse, ThriveWorld } from '../support/world';

/**
 * What each refusal of a 1:1 is told, by the code the API answers and the status it answers with.
 * The feature says the refusal in words; the wire stays here (BE_13 R2).
 */
const REFUSALS: Readonly<Record<string, { code: string; status: number }>> = {
  'there is no such 1:1': { code: 'ONE_ON_ONE_NOT_FOUND', status: 404 },
  'it is not theirs to answer': {
    code: 'ONE_ON_ONE_NOT_YOURS_TO_ANSWER',
    status: 403,
  },
  'they already have one': { code: 'ONE_ON_ONE_ALREADY_EXISTS', status: 409 },
  'the topic is not theirs': {
    code: 'ONE_ON_ONE_TOPIC_NOT_YOURS',
    status: 403,
  },
  'the meeting has not started': {
    code: 'ONE_ON_ONE_MEETING_NOT_STARTED',
    status: 409,
  },
  'the meeting has already started': {
    code: 'ONE_ON_ONE_MEETING_ALREADY_STARTED',
    status: 409,
  },
  'the topic changed': { code: 'ONE_ON_ONE_TOPIC_CHANGED', status: 409 },
  'the 1:1 is not running': { code: 'ONE_ON_ONE_NOT_RUNNING', status: 409 },
  'the template cannot be kept': {
    code: 'ONE_ON_ONE_TEMPLATE_INVALID',
    status: 400,
  },
  'they keep one by that name already': {
    code: 'ONE_ON_ONE_TEMPLATE_NAME_TAKEN',
    status: 409,
  },
  'the template is not theirs': {
    code: 'ONE_ON_ONE_TEMPLATE_NOT_YOURS',
    status: 403,
  },
};

/** A weekly 1:1 on Thursdays, the schedule every scenario uses: a day, with no time of day. */
const WEEKLY = {
  cadence: 'WEEKLY',
  weekday: 4,
} as const;

/** The calendar clock's offset from UTC (ADR 0095): a day there starts at 17:00 UTC the day before. */
const CALENDAR_UTC_OFFSET_HOURS = 7;

/** The scenario's one 1:1 and its next meeting once opened, kept on the world (BE_13 R5). */
function stateOf(world: ThriveWorld) {
  return world.oneOnOne;
}

function oneOnOneIdOf(world: ThriveWorld): string {
  const { id } = stateOf(world);
  assert.ok(id, 'No 1:1 was started in this scenario.');
  return id;
}

function oneOnOnePath(world: ThriveWorld, name: string): string {
  return `/v1/workspaces/${world.workspaceOf(name)}/one-on-ones/${oneOnOneIdOf(world)}`;
}

function invite(world: ThriveWorld, from: string, to: string) {
  return world.as(
    from,
    'POST',
    `/v1/workspaces/${world.workspaceOf(from)}/one-on-ones`,
    {
      invitedAccountId: world.person(to).accountId,
      schedule: WEEKLY,
    },
  );
}

function templatesPath(world: ThriveWorld, name: string): string {
  return `/v1/workspaces/${world.workspaceOf(name)}/one-on-one-templates`;
}

function templateIdOf(world: ThriveWorld, template: string): string {
  const id = world.oneOnOneTemplates.get(template);
  assert.ok(id, `No template "${template}" was kept in this scenario.`);
  return id;
}

function keepTemplate(
  world: ThriveWorld,
  name: string,
  template: string,
  scope: 'PERSONAL' | 'WORKSPACE',
  questions: readonly string[] = ['What is on your mind?'],
) {
  return world.as(name, 'POST', templatesPath(world, name), {
    scope,
    name: template,
    questions,
  });
}

/** The names of the templates `name` can start a 1:1 from. */
async function templatesSeenBy(
  world: ThriveWorld,
  name: string,
): Promise<readonly string[]> {
  const response = world.succeeded(
    await world.as(name, 'GET', templatesPath(world, name)),
    `${name} listing the templates`,
  );
  return response.body.items.map((each: { name: string }) => each.name);
}

function accept(world: ThriveWorld, name: string) {
  return world.as(name, 'POST', `${oneOnOnePath(world, name)}/accept`);
}

/** The next meeting, opened if nobody has written to it yet, as the page does on a first write. */
async function nextMeetingId(
  world: ThriveWorld,
  name: string,
): Promise<string> {
  const state = stateOf(world);
  if (!state.meetingId) {
    const opened = world.succeeded(
      await world.as(name, 'POST', `${oneOnOnePath(world, name)}/meetings`),
      `${name} opening the next meeting`,
    );
    state.meetingId = opened.body.id;
  }
  assert.ok(state.meetingId);
  return state.meetingId;
}

function meetingPath(world: ThriveWorld, name: string, meetingId: string) {
  return `${oneOnOnePath(world, name)}/meetings/${meetingId}`;
}

/** The next meeting as `name` reads it. */
async function readNextMeeting(world: ThriveWorld, name: string) {
  const response = world.succeeded(
    await world.as(name, 'GET', `${oneOnOnePath(world, name)}/meetings/next`),
    `${name} reading the next meeting`,
  );
  return response.body;
}

async function topicIdOf(
  world: ThriveWorld,
  name: string,
  text: string,
): Promise<string> {
  const next = await readNextMeeting(world, name);
  const topic = next.meeting?.topics.find(
    (each: { text: string }) => each.text === text,
  );
  assert.ok(topic, `"${text}" is not on the next meeting's agenda.`);
  return topic.id;
}

async function addTopic(
  world: ThriveWorld,
  name: string,
  text: string,
): Promise<ApiResponse> {
  const meetingId = await nextMeetingId(world, name);
  return world.as(
    name,
    'POST',
    `${meetingPath(world, name, meetingId)}/topics`,
    {
      text,
    },
  );
}

async function writeNote(
  world: ThriveWorld,
  name: string,
  text: string,
  topic: string,
  readAt: string | null,
): Promise<ApiResponse> {
  const meetingId = await nextMeetingId(world, name);
  const topicId = await topicIdOf(world, name, topic);
  return world.as(
    name,
    'PATCH',
    `${meetingPath(world, name, meetingId)}/topics/${topicId}`,
    { note: text, noteReadAt: readAt },
  );
}

/** Uses a template for the next meeting, opening it first if nobody has written to it yet. */
async function useTemplate(
  world: ThriveWorld,
  name: string,
  template: string,
): Promise<ApiResponse> {
  const meetingId = await nextMeetingId(world, name);
  return world.as(
    name,
    'PUT',
    `${meetingPath(world, name, meetingId)}/template`,
    { templateKey: templateIdOf(world, template) },
  );
}

/** The texts on the next meeting's agenda as `name` reads it, in order. */
async function agendaOf(
  world: ThriveWorld,
  name: string,
): Promise<readonly string[]> {
  const next = await readNextMeeting(world, name);
  assert.ok(next.meeting, 'Nobody has written to the next meeting yet.');
  return next.meeting.topics.map((topic: { text: string }) => topic.text);
}

Given(
  '{person} has invited {person} to a weekly 1:1',
  async function (this: ThriveWorld, from: string, to: string) {
    const response = this.succeeded(
      await invite(this, from, to),
      `${from} inviting ${to} to a 1:1`,
    );
    stateOf(this).id = response.body.id;
  },
);

Given(
  '{person} and {person} have a running weekly 1:1',
  async function (this: ThriveWorld, from: string, to: string) {
    const response = this.succeeded(
      await invite(this, from, to),
      `${from} inviting ${to} to a 1:1`,
    );
    stateOf(this).id = response.body.id;
    this.succeeded(await accept(this, to), `${to} accepting the 1:1`);
  },
);

Given(
  '{person} and {person} have a 1:1 held once next week',
  async function (this: ThriveWorld, from: string, to: string) {
    // A week from today on the calendar clock, so the day is still to come whenever it runs.
    const startsOn = new Date(
      Date.now() + CALENDAR_UTC_OFFSET_HOURS * 3_600_000 + 7 * 86_400_000,
    )
      .toISOString()
      .slice(0, 10);
    const response = this.succeeded(
      await this.as(
        from,
        'POST',
        `/v1/workspaces/${this.workspaceOf(from)}/one-on-ones`,
        {
          invitedAccountId: this.person(to).accountId,
          schedule: { cadence: 'ONCE', weekday: 1, startsOn },
        },
      ),
      `${from} inviting ${to} to a 1:1 held once`,
    );
    stateOf(this).id = response.body.id;
    this.succeeded(await accept(this, to), `${to} accepting the 1:1`);
  },
);

Given(
  /^(\w+) has kept a template "([^"]+)"( for the Workspace)? asking "([^"]+)"$/,
  async function (
    this: ThriveWorld,
    name: string,
    template: string,
    forWorkspace: string | undefined,
    question: string,
  ) {
    const response = this.succeeded(
      await keepTemplate(
        this,
        name,
        template,
        forWorkspace ? 'WORKSPACE' : 'PERSONAL',
        [question],
      ),
      `${name} keeping the template "${template}"`,
    );
    this.oneOnOneTemplates.set(template, response.body.id);
  },
);

Given(
  '{person} has added {string} to the next meeting',
  async function (this: ThriveWorld, name: string, text: string) {
    this.succeeded(
      await addTopic(this, name, text),
      `${name} adding "${text}"`,
    );
  },
);

Given(
  '{person} has used {string} for the next meeting',
  async function (this: ThriveWorld, name: string, template: string) {
    this.succeeded(
      await useTemplate(this, name, template),
      `${name} using "${template}"`,
    );
  },
);

Given(
  '{person} has started the next meeting',
  async function (this: ThriveWorld, name: string) {
    const meetingId = await nextMeetingId(this, name);
    this.succeeded(
      await this.as(
        name,
        'POST',
        `${meetingPath(this, name, meetingId)}/start`,
      ),
      `${name} starting the meeting`,
    );
  },
);

Given(
  '{person} has written {string} on {string}',
  async function (
    this: ThriveWorld,
    name: string,
    text: string,
    topic: string,
  ) {
    this.succeeded(
      await writeNote(this, name, text, topic, null),
      `${name} writing on "${topic}"`,
    );
  },
);

Given(
  '{person} has ended the 1:1',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(name, 'POST', `${oneOnOnePath(this, name)}/end`),
      `${name} ending the 1:1`,
    );
  },
);

When(
  '{person} keeps a template {string} of their own',
  async function (this: ThriveWorld, name: string, template: string) {
    await keepTemplate(this, name, template, 'PERSONAL');
  },
);

When(
  '{person} keeps a template {string} of their own with no question',
  async function (this: ThriveWorld, name: string, template: string) {
    await keepTemplate(this, name, template, 'PERSONAL', []);
  },
);

When(
  '{person} keeps a template {string} for the Workspace',
  async function (this: ThriveWorld, name: string, template: string) {
    await keepTemplate(this, name, template, 'WORKSPACE');
  },
);

When(
  '{person} renames the template {string} to {string}',
  async function (
    this: ThriveWorld,
    name: string,
    template: string,
    renamed: string,
  ) {
    await this.as(
      name,
      'PUT',
      `${templatesPath(this, name)}/${templateIdOf(this, template)}`,
      { name: renamed, questions: ['What is on your mind?'] },
    );
  },
);

When(
  '{person} removes the template {string}',
  async function (this: ThriveWorld, name: string, template: string) {
    this.succeeded(
      await this.as(
        name,
        'DELETE',
        `${templatesPath(this, name)}/${templateIdOf(this, template)}`,
      ),
      `${name} removing the template "${template}"`,
    );
  },
);

When(
  '{person} accepts the 1:1',
  async function (this: ThriveWorld, name: string) {
    await accept(this, name);
  },
);

When(
  '{person} invites {person} to a weekly 1:1',
  async function (this: ThriveWorld, from: string, to: string) {
    await invite(this, from, to);
  },
);

When(
  "{person} opens {person}'s 1:1 with {person}",
  async function (this: ThriveWorld, name: string, _from: string, _to: string) {
    await this.as(name, 'GET', oneOnOnePath(this, name));
  },
);

When(
  '{person} removes {string} from the next meeting',
  async function (this: ThriveWorld, name: string, text: string) {
    const meetingId = await nextMeetingId(this, name);
    const topicId = await topicIdOf(this, name, text);
    await this.as(
      name,
      'DELETE',
      `${meetingPath(this, name, meetingId)}/topics/${topicId}`,
    );
  },
);

When(
  '{person} adds {string} to the next meeting',
  async function (this: ThriveWorld, name: string, text: string) {
    const state = stateOf(this);
    // The page opens the meeting with its first write; a refused open is the answer.
    if (!state.meetingId) {
      const opened = await this.as(
        name,
        'POST',
        `${oneOnOnePath(this, name)}/meetings`,
      );
      if (opened.status >= 300) {
        return;
      }
      state.meetingId = opened.body.id;
    }
    await addTopic(this, name, text);
  },
);

When(
  '{person} writes {string} on {string}',
  async function (
    this: ThriveWorld,
    name: string,
    text: string,
    topic: string,
  ) {
    await writeNote(this, name, text, topic, null);
  },
);

When(
  '{person} writes {string} on {string} from before {person} wrote',
  async function (
    this: ThriveWorld,
    name: string,
    text: string,
    topic: string,
    _other: string,
  ) {
    // Read before the other wrote, when nobody had written it.
    await writeNote(this, name, text, topic, null);
  },
);

When(
  '{person} uses {string} for the next meeting',
  async function (this: ThriveWorld, name: string, template: string) {
    await useTemplate(this, name, template);
  },
);

When(
  '{person} finishes the next meeting',
  async function (this: ThriveWorld, name: string) {
    const meetingId = await nextMeetingId(this, name);
    await this.as(name, 'POST', `${meetingPath(this, name, meetingId)}/finish`);
  },
);

Then(
  '{person} sees the 1:1 with {person} running',
  async function (this: ThriveWorld, name: string, other: string) {
    const response = this.succeeded(
      await this.as(name, 'GET', oneOnOnePath(this, name)),
      `${name} opening the 1:1`,
    );
    assert.equal(response.body.status, 'ACTIVE');
    assert.equal(response.body.withAccountId, this.person(other).accountId);
    assert.ok(response.body.nextMeetingAt, 'A running 1:1 has a next meeting.');
  },
);

Then(
  '{person} sees the 1:1 meets weekly on Thursday, with no time of day',
  async function (this: ThriveWorld, name: string) {
    const response = this.succeeded(
      await this.as(name, 'GET', oneOnOnePath(this, name)),
      `${name} opening the 1:1`,
    );
    const { schedule } = response.body;
    assert.equal(schedule.cadence, 'WEEKLY');
    assert.equal(schedule.weekday, 4);
    assert.ok(!('startMinute' in schedule), 'A schedule keeps no time.');
    assert.ok(!('lengthMinutes' in schedule), 'A schedule keeps no length.');
  },
);

Then(
  "{person}'s next meeting is on a Thursday, from the start of that day",
  async function (this: ThriveWorld, name: string) {
    const response = this.succeeded(
      await this.as(name, 'GET', oneOnOnePath(this, name)),
      `${name} opening the 1:1`,
    );
    const at = new Date(response.body.nextMeetingAt);
    const local = new Date(
      at.getTime() + CALENDAR_UTC_OFFSET_HOURS * 3_600_000,
    );
    assert.equal(local.getUTCDay(), 4, 'It meets on a Thursday.');
    assert.equal(
      local.getUTCHours() * 60 + local.getUTCMinutes(),
      0,
      'It starts with the day.',
    );
  },
);

Then(
  '{person} sees the 1:1 has no next meeting',
  async function (this: ThriveWorld, name: string) {
    const response = this.succeeded(
      await this.as(name, 'GET', oneOnOnePath(this, name)),
      `${name} opening the 1:1`,
    );
    assert.equal(response.body.status, 'ACTIVE');
    assert.equal(response.body.nextMeetingAt, null, 'Its one meeting is met.');
    assert.equal(response.body.meetingInProgress, false);
  },
);

Then(
  '{person} sees one past meeting with {string}',
  async function (this: ThriveWorld, name: string, text: string) {
    const response = this.succeeded(
      await this.as(name, 'GET', `${oneOnOnePath(this, name)}/meetings`),
      `${name} reading the past meetings`,
    );
    assert.equal(response.body.items.length, 1);
    assert.ok(
      response.body.items[0].topics.some(
        (topic: { text: string }) => topic.text === text,
      ),
    );
  },
);

Then(
  "{person}'s next meeting opens with {string} carried over",
  async function (this: ThriveWorld, name: string, text: string) {
    const next = await readNextMeeting(this, name);
    assert.equal(next.meeting, null);
    assert.ok(next.carried.includes(text), `"${text}" was not carried over.`);
  },
);

Then(
  '{person} cannot use {string} for the next meeting',
  async function (this: ThriveWorld, name: string, template: string) {
    const response = await useTemplate(this, name, template);
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'ONE_ON_ONE_TEMPLATE_UNKNOWN');
  },
);

Then(
  "{person}'s next meeting has {string}",
  async function (this: ThriveWorld, name: string, text: string) {
    assert.ok(
      (await agendaOf(this, name)).includes(text),
      `"${text}" is not on the next meeting's agenda.`,
    );
  },
);

Then(
  /^(\w+)'s next meeting has only "([^"]+)"(?: and "([^"]+)")?$/,
  async function (
    this: ThriveWorld,
    name: string,
    first: string,
    // Cucumber passes `null` for the second name when the step names one topic.
    second: string | null,
  ) {
    assert.deepEqual(
      await agendaOf(this, name),
      second === null ? [first] : [first, second],
    );
  },
);

Then(
  '{person} sees the template {string}',
  async function (this: ThriveWorld, name: string, template: string) {
    assert.ok((await templatesSeenBy(this, name)).includes(template));
  },
);

Then(
  '{person} does not see the template {string}',
  async function (this: ThriveWorld, name: string, template: string) {
    assert.ok(!(await templatesSeenBy(this, name)).includes(template));
  },
);

Then(
  /^(\w+) is told (there is no such 1:1|it is not theirs to answer|they already have one|the topic is not theirs|the meeting has not started|the meeting has already started|the topic changed|the 1:1 is not running|the template is not theirs|the template cannot be kept|they keep one by that name already)$/,
  function (this: ThriveWorld, _name: string, reason: string) {
    const refusal = REFUSALS[reason];
    assert.ok(refusal, `No refusal is known as "${reason}".`);
    this.refusedWith(refusal.code);
    assert.equal(this.lastResponse?.status, refusal.status);
  },
);
