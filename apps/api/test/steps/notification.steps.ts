import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ApiResponse, ThriveWorld } from '../support/world';

/** The bell is a Workspace's: a Member of several reads one at a time. */
function notificationsOf(world: ThriveWorld, name: string): string {
  return `/v1/workspaces/${world.workspaceOf(name)}/notifications`;
}

/**
 * A Notification is written **after** the thing it is about has committed, and the API has
 * already answered by the time a step runs. So these steps wait for it rather than pretending
 * it is atomic — which is also the honest description of the behaviour.
 */
async function eventually<T>(
  read: () => Promise<T>,
  isReady: (value: T) => boolean,
  what: string,
  timeoutMs = 2000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await read();
    if (isReady(value)) {
      return value;
    }
    if (Date.now() > deadline) {
      assert.fail(`Timed out after ${timeoutMs}ms waiting for ${what}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function listFor(world: ThriveWorld, name: string): Promise<ApiResponse> {
  return world.as(name, 'GET', notificationsOf(world, name));
}

function countFor(world: ThriveWorld, name: string): Promise<ApiResponse> {
  return world.as(name, 'GET', `${notificationsOf(world, name)}/unread-count`);
}

/** Waits for a line of the given type to arrive, and answers it. */
async function toldOf(world: ThriveWorld, name: string, type: string) {
  const read = await eventually(
    () => listFor(world, name),
    // biome-ignore lint/suspicious/noExplicitAny: a response body as JSON
    (response: any) =>
      response.body?.items?.some(
        (item: { type: string }) => item.type === type,
      ) === true,
    `a ${type} notification for ${name}`,
  );
  return read.body.items.find((item: { type: string }) => item.type === type);
}

When(
  '{person} looks at what they have been told',
  async function (this: ThriveWorld, name: string) {
    await listFor(this, name);
  },
);

When(
  '{person} reads the notification waiting for them',
  async function (this: ThriveWorld, name: string) {
    const told = await toldOf(this, name, 'ASK_RECEIVED');
    this.succeeded(
      await this.as(
        name,
        'POST',
        `${notificationsOf(this, name)}/${told.id}/read`,
      ),
      `${name} reading a notification`,
    );
  },
);

When(
  '{person} marks everything read',
  async function (this: ThriveWorld, name: string) {
    // Wait for both to have arrived, so this is not a race with the second one.
    await eventually(
      () => listFor(this, name),
      // biome-ignore lint/suspicious/noExplicitAny: a response body as JSON
      (response: any) => response.body?.items?.length === 2,
      `${name}'s two notifications`,
    );
    this.succeeded(
      await this.as(name, 'POST', `${notificationsOf(this, name)}/read`),
      `${name} marking everything read`,
    );
  },
);

Then(
  '{person} is told that {person} asked them for Feedback',
  async function (this: ThriveWorld, name: string, actor: string) {
    const told = await toldOf(this, name, 'ASK_RECEIVED');
    assert.equal(told.actor.accountId, this.person(actor).accountId);
  },
);

Then(
  '{person} is told that {person} answered their request',
  async function (this: ThriveWorld, name: string, actor: string) {
    const told = await toldOf(this, name, 'ASK_ANSWERED');
    assert.equal(told.actor.accountId, this.person(actor).accountId);
  },
);

Then(
  '{person} is told that {person} wrote Feedback to them',
  async function (this: ThriveWorld, name: string, actor: string) {
    const told = await toldOf(this, name, 'FEEDBACK_RECEIVED');
    assert.equal(told.actor.accountId, this.person(actor).accountId);
  },
);

Then(
  '{person} is told that {person} shared Feedback with them',
  async function (this: ThriveWorld, name: string, actor: string) {
    const told = await toldOf(this, name, 'FEEDBACK_SHARED');
    assert.equal(told.actor.accountId, this.person(actor).accountId);
  },
);

Then(
  '{person} has {int} unread notification(s)',
  async function (this: ThriveWorld, name: string, expected: number) {
    const read = await eventually(
      () => countFor(this, name),
      // biome-ignore lint/suspicious/noExplicitAny: a response body as JSON
      (response: any) => response.body?.count === expected,
      `${name} to have ${expected} unread`,
    );
    assert.equal(read.body.count, expected);
  },
);

Then(
  '{person} still has {int} notification(s)',
  async function (this: ThriveWorld, name: string, expected: number) {
    // Marking read keeps the lines; only the count goes.
    const read = this.succeeded(
      await listFor(this, name),
      `${name} reading their notifications`,
    );
    assert.equal(read.body.items.length, expected);
  },
);

Then(
  'nothing {person} is told carries {string}',
  async function (this: ThriveWorld, name: string, words: string) {
    const read = this.succeeded(
      await listFor(this, name),
      `${name} reading their notifications`,
    );
    // A Notification is a pointer, never a copy: the words stay where they were written.
    assert.ok(
      !JSON.stringify(read.body).includes(words),
      `Something told to ${name} carried "${words}".`,
    );
  },
);

When(
  '{person} looks at what {person} has been told',
  async function (this: ThriveWorld, name: string, owner: string) {
    // Somebody else's Workspace, named in the path. There is no way to name a *person*, so the
    // worst anybody can do is ask about a Workspace — and the guard answers the same thing it
    // answers for one that does not exist.
    await this.as(
      name,
      'GET',
      `/v1/workspaces/${this.workspaceOf(owner)}/notifications`,
    );
  },
);
