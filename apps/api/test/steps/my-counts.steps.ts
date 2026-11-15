import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

interface MyCounts {
  readonly waitingAsks: number;
  readonly newAnswers: number;
  readonly newOffered: number;
  readonly newKudos: number;
  readonly newShared: number;
}

function countsRead(world: ThriveWorld): MyCounts {
  const counts: MyCounts | undefined = world.lastResponse?.body;
  assert.ok(counts, 'No counts were read.');
  return counts;
}

function opens(world: ThriveWorld, name: string, list: string) {
  return world.as(
    name,
    'POST',
    `/v1/workspaces/${world.workspaceOf(name)}/me/seen`,
    { list },
  );
}

When(
  '{person} looks at their counts',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/me/counts`,
      ),
      `${name} reading their counts`,
    );
  },
);

When(
  "{person} looks at their counts in {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    await this.as(
      outsider,
      'GET',
      `/v1/workspaces/${this.workspaceOf(member)}/me/counts`,
    );
  },
);

When(
  "{person} opens what is shared with them in {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    await this.as(
      outsider,
      'POST',
      `/v1/workspaces/${this.workspaceOf(member)}/me/seen`,
      { list: 'SHARED_WITH_ME' },
    );
  },
);

Given(
  '{person} has opened {receivedKind} in what they have received',
  async function (this: ThriveWorld, name: string, kind: string) {
    this.succeeded(
      await opens(this, name, `RECEIVED_${kind}`),
      `${name} opening ${kind} in Received`,
    );
  },
);

Given(
  '{person} has opened what is shared with them',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await opens(this, name, 'SHARED_WITH_ME'),
      `${name} opening Shared with me`,
    );
  },
);

When(
  '{person} opens everything in what they have received at once',
  async function (this: ThriveWorld, name: string) {
    await opens(this, name, 'ALL');
  },
);

Then(
  '{person} has {int} Ask(s) waiting',
  function (this: ThriveWorld, _name: string, waiting: number) {
    assert.equal(countsRead(this).waitingAsks, waiting);
  },
);

Then(
  '{person} has {int} new in their requests, {int} new in Feedback given unasked and {int} new in Kudos',
  function (
    this: ThriveWorld,
    _name: string,
    answers: number,
    offered: number,
    kudos: number,
  ) {
    const counts = countsRead(this);
    assert.deepEqual(
      {
        newAnswers: counts.newAnswers,
        newOffered: counts.newOffered,
        newKudos: counts.newKudos,
      },
      { newAnswers: answers, newOffered: offered, newKudos: kudos },
    );
  },
);

Then(
  '{person} has {int} new shared with them',
  function (this: ThriveWorld, _name: string, shared: number) {
    assert.equal(countsRead(this).newShared, shared);
  },
);
