import assert from 'node:assert/strict';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import {
  createWorkspace,
  introduce,
  myMemberships,
  ownAWorkspace,
} from '../support/journeys';
import { googlePhotoUrlOf } from '../support/workspace.integration-fixtures';
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
  '{person} is an Admin of {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const memberships = await myMemberships(this, name);
    assert.deepEqual(
      memberships.map((m) => [m.workspace.name, m.role]),
      [[workspaceName, 'ADMIN']],
    );
  },
);

Then(
  '{person} is told to introduce themselves first',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('PROFILE_REQUIRED');
  },
);

When(
  '{person} switches to {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const memberships = await myMemberships(this, name);
    const chosen = memberships.find((m) => m.workspace.name === workspaceName);
    assert.ok(chosen, `${name} is not in ${workspaceName}.`);
    await this.as(name, 'POST', `/v1/workspaces/${chosen.workspace.id}/switch`);
  },
);

When(
  "{person} switches to {person}'s Workspace",
  async function (this: ThriveWorld, name: string, owner: string) {
    await this.as(
      name,
      'POST',
      `/v1/workspaces/${this.workspaceOf(owner)}/switch`,
    );
  },
);

Then(
  '{person} is in {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const [current] = await myMemberships(this, name);
    assert.equal(current?.workspace.name, workspaceName);
  },
);

When(
  "{person} looks at who is in {person}'s Workspace",
  async function (this: ThriveWorld, name: string, admin: string) {
    await this.as(
      name,
      'GET',
      `/v1/workspaces/${this.workspaceOf(admin)}/members`,
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

/** The photo the last list of Members showed for `name`, or `undefined` if they were not in it. */
function listedPhotoOf(
  world: ThriveWorld,
  name: string,
): string | null | undefined {
  assert.equal(world.lastResponse?.status, 200);
  const items: { accountId: string; photoUrl: string | null }[] =
    world.lastResponse?.body.items;
  const { accountId } = world.person(name);
  return items.find((member) => member.accountId === accountId)?.photoUrl;
}

Then(
  "{person} sees {person}'s Google photo",
  function (this: ThriveWorld, _viewer: string, name: string) {
    assert.equal(
      listedPhotoOf(this, name),
      googlePhotoUrlOf(this.person(name)),
    );
  },
);

Then(
  '{person} sees no photo for {person}',
  function (this: ThriveWorld, _viewer: string, name: string) {
    assert.equal(listedPhotoOf(this, name), null);
  },
);
