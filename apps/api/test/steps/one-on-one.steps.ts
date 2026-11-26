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
  'the topic changed': { code: 'ONE_ON_ONE_TOPIC_CHANGED', status: 409 },
  'the 1:1 is not running': { code: 'ONE_ON_ONE_NOT_RUNNING', status: 409 },
};

/** A weekly 1:1 on Thursdays at 10:00 Bangkok time, the template every scenario uses. */
const WEEKLY = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 600,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
} as const;

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
  '{person} has added {string} to the next meeting',
  async function (this: ThriveWorld, name: string, text: string) {
    this.succeeded(
      await addTopic(this, name, text),
      `${name} adding "${text}"`,
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
  /^(\w+) is told (there is no such 1:1|it is not theirs to answer|they already have one|the topic is not theirs|the meeting has not started|the topic changed|the 1:1 is not running)$/,
  function (this: ThriveWorld, _name: string, reason: string) {
    const refusal = REFUSALS[reason];
    assert.ok(refusal, `No refusal is known as "${reason}".`);
    this.refusedWith(refusal.code);
    assert.equal(this.lastResponse?.status, refusal.status);
  },
);
