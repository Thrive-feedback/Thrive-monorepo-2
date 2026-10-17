import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { deactivate, myMemberships, reactivate } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

Given(
  '{person} has Deactivated {person}',
  async function (this: ThriveWorld, deactivator: string, name: string) {
    this.succeeded(
      await deactivate(this, deactivator, name),
      `${deactivator} Deactivating ${name}`,
    );
  },
);

When(
  '{person} Deactivates {person}',
  async function (this: ThriveWorld, deactivator: string, name: string) {
    await deactivate(this, deactivator, name);
  },
);

When(
  '{person} leaves their Workspace',
  async function (this: ThriveWorld, name: string) {
    await deactivate(this, name, name);
  },
);

When(
  "{person} looks at who was Deactivated in {person}'s Workspace",
  async function (this: ThriveWorld, name: string, admin: string) {
    await this.as(
      name,
      'GET',
      `/v1/workspaces/${this.workspaceOf(admin)}/members?status=DEACTIVATED`,
    );
  },
);

Then(
  '{person} is in no Workspace',
  async function (this: ThriveWorld, name: string) {
    assert.deepEqual(await myMemberships(this, name), []);
  },
);

Then(
  '{person} is told they may not Deactivate anyone else',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_DEACTIVATE');
  },
);

When(
  '{person} Reactivates {person}',
  async function (this: ThriveWorld, reactivator: string, name: string) {
    await reactivate(this, reactivator, name);
  },
);

Then(
  '{person} is told they may not Reactivate anyone',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_REACTIVATE');
  },
);

Then(
  '{person} belongs to {string} and {string}',
  async function (
    this: ThriveWorld,
    name: string,
    first: string,
    second: string,
  ) {
    const memberships = await myMemberships(this, name);
    assert.deepEqual(
      memberships.map((membership) => membership.workspace.name).sort(),
      [first, second].sort(),
    );
  },
);
