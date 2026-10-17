import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { deactivate, myMemberships } from '../support/journeys';
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
