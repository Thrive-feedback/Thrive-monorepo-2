import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import {
  createWorkspace,
  introduce,
  myMemberships,
  ownAWorkspace,
} from '../support/journeys';
import type { ThriveWorld } from '../support/world';

Given(
  '{person} has introduced themselves',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await introduce(this, name),
      `${name} introducing themselves`,
    );
  },
);

Given(
  '{person} owns a Workspace called {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    await ownAWorkspace(this, name, workspaceName);
  },
);

When(
  '{person} creates a Workspace called {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    await createWorkspace(this, name, workspaceName);
  },
);

Then(
  '{person} is the Owner of {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const memberships = await myMemberships(this, name);
    assert.deepEqual(
      memberships.map((m) => [m.workspace.name, m.role]),
      [[workspaceName, 'OWNER']],
    );
  },
);

Then(
  '{person} is told to introduce themselves first',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('PROFILE_REQUIRED');
  },
);

Then(
  '{person} is told they already belong to a Workspace',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('ALREADY_IN_A_WORKSPACE');
  },
);
