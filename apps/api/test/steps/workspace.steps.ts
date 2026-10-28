import assert from 'node:assert/strict';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import {
  createWorkspace,
  introduce,
  myCurrentMembership,
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

When(
  '{person} signs in again',
  async function (this: ThriveWorld, name: string) {
    await this.signInAgain(name);
  },
);

Then(
  '{person} is in {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const current = await myCurrentMembership(this, name);
    assert.equal(current?.workspace.name, workspaceName);
  },
);

Then(
  '{person} is asked to choose a Workspace',
  async function (this: ThriveWorld, name: string) {
    assert.equal(await myCurrentMembership(this, name), null);
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

/** One person as a list shows them: a Member, or a giver, Receiver or requester inside an item. */
type ListedPerson = { accountId?: string; photoUrl?: string | null };

/**
 * The people one item of the last list names, whatever its shape: the item itself on the list of
 * Members, nested giver and requester objects and every Receiver, or a flat `giverAccountId` and
 * `giverPhotoUrl` pair.
 */
function peopleIn(item: Record<string, unknown>): ListedPerson[] {
  return [
    item as ListedPerson,
    item.giver as ListedPerson,
    ...((item.receivers as ListedPerson[] | undefined) ?? []),
    item.requester as ListedPerson,
    {
      accountId: item.giverAccountId as string | undefined,
      photoUrl: item.giverPhotoUrl as string | null | undefined,
    },
  ].filter((person) => person?.accountId !== undefined);
}

/**
 * The photo the last list showed for `name` — of Members, or of Feedback or Asks naming them —
 * or `undefined` if they were not in it.
 */
function listedPhotoOf(
  world: ThriveWorld,
  name: string,
): string | null | undefined {
  assert.equal(world.lastResponse?.status, 200);
  const items: Record<string, unknown>[] = world.lastResponse?.body.items;
  const { accountId } = world.person(name);
  return items
    .flatMap(peopleIn)
    .find((person) => person.accountId === accountId)?.photoUrl;
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
