import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';
import { slugOf } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

/** What a piece of text was bound to when it was sent, as every read carries it. */
interface Tags {
  readonly workspaceGoals: readonly { readonly name: string }[];
  readonly mentions: readonly {
    readonly slug: string;
    readonly displayName: string;
  }[];
}

/** The `#a #b` of a feature file, as the names the API reads them back with. */
function workspaceGoalNames(written: string): string[] {
  return written === ''
    ? []
    : written.split(' ').map((hashtag) => hashtag.replace(/^#/u, ''));
}

/** The one item of the list just read: these scenarios each send exactly one thing. */
function onlyItem<T>(world: ThriveWorld): T {
  const items: T[] = world.lastResponse?.body.items;
  assert.equal(items.length, 1, `Expected one item, read ${items.length}`);
  return items[0] as T;
}

function namesOf(tags: Tags): string[] {
  return tags.workspaceGoals.map((workspaceGoal) => workspaceGoal.name);
}

Then(
  '{person} reads it tagged with {string}',
  function (this: ThriveWorld, _name: string, written: string) {
    const feedback = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(namesOf(feedback.tags), workspaceGoalNames(written));
  },
);

Then(
  '{person} reads it tagged with nothing',
  function (this: ThriveWorld, _name: string) {
    const feedback = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(namesOf(feedback.tags), []);
  },
);

Then(
  '{person} sees the request tagged with {string}',
  function (this: ThriveWorld, _name: string, written: string) {
    const request = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(namesOf(request.tags), workspaceGoalNames(written));
  },
);

Then(
  '{person} sees the Ask tagged with {string}',
  function (this: ThriveWorld, _name: string, written: string) {
    const ask = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(namesOf(ask.tags), workspaceGoalNames(written));
  },
);

Then(
  '{person} reads it mentioning {person}',
  async function (this: ThriveWorld, _name: string, mentioned: string) {
    const feedback = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(feedback.tags.mentions, [
      { slug: await slugOf(this, mentioned), displayName: mentioned },
    ]);
  },
);

Then(
  '{person} reads it mentioning nobody',
  function (this: ThriveWorld, _name: string) {
    const feedback = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(feedback.tags.mentions, []);
  },
);

Then(
  '{person} sees the request mentioning {person}',
  async function (this: ThriveWorld, _name: string, mentioned: string) {
    const request = onlyItem<{ tags: Tags }>(this);
    assert.deepEqual(request.tags.mentions, [
      { slug: await slugOf(this, mentioned), displayName: mentioned },
    ]);
  },
);
