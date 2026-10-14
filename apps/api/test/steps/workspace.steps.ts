import assert from 'node:assert/strict';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
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

When(
  "{person} looks at who is in {person}'s Workspace",
  async function (this: ThriveWorld, name: string, owner: string) {
    await this.as(
      name,
      'GET',
      `/v1/workspaces/${this.workspaceOf(owner)}/members`,
    );
  },
);

Then(
  '{person} sees these Members, earliest first:',
  function (this: ThriveWorld, _name: string, table: DataTable) {
    assert.equal(this.lastResponse?.status, 200);
    const items: { accountId: string; role: string }[] =
      this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((member) => [member.accountId, member.role]),
      table
        .hashes()
        .map((row) => [this.person(row.Member as string).accountId, row.Role]),
    );
  },
);
