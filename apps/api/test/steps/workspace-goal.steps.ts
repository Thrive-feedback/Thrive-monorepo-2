import assert from 'node:assert/strict';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import {
  addWorkspaceGoal,
  changeWorkspaceGoalStatus,
  listWorkspaceGoals,
} from '../support/journeys';
import type { ThriveWorld } from '../support/world';

/** What each refusal of a name is told, by the code the API answers. */
const NAME_REFUSALS: Readonly<Record<string, string>> = {
  'may not contain spaces': 'WORKSPACE_GOAL_NAME_HAS_SPACES',
  'is too long': 'WORKSPACE_GOAL_NAME_TOO_LONG',
  'is already taken': 'WORKSPACE_GOAL_NAME_TAKEN',
};

Given(
  '{person} has added the Workspace Goal {string}',
  async function (this: ThriveWorld, admin: string, name: string) {
    this.succeeded(
      await addWorkspaceGoal(this, admin, name),
      `${admin} adding the Workspace Goal ${name}`,
    );
  },
);

Given(
  '{person} has hidden the Workspace Goal {string}',
  async function (this: ThriveWorld, admin: string, name: string) {
    this.succeeded(
      await changeWorkspaceGoalStatus(this, admin, name, 'hide'),
      `${admin} hiding the Workspace Goal ${name}`,
    );
  },
);

When(
  '{person} adds the Workspace Goal {string}',
  async function (this: ThriveWorld, name: string, workspaceGoal: string) {
    await addWorkspaceGoal(this, name, workspaceGoal);
  },
);

When(
  '{person} adds the Workspace Goal {string} described as {string}',
  async function (
    this: ThriveWorld,
    name: string,
    workspaceGoal: string,
    description: string,
  ) {
    await addWorkspaceGoal(this, name, workspaceGoal, description);
  },
);

When(
  '{person} hides the Workspace Goal {string}',
  async function (this: ThriveWorld, name: string, workspaceGoal: string) {
    await changeWorkspaceGoalStatus(this, name, workspaceGoal, 'hide');
  },
);

When(
  '{person} shows the Workspace Goal {string} again',
  async function (this: ThriveWorld, name: string, workspaceGoal: string) {
    await changeWorkspaceGoalStatus(this, name, workspaceGoal, 'show');
  },
);

When(
  '{person} looks at the Workspace Goals',
  async function (this: ThriveWorld, name: string) {
    await listWorkspaceGoals(this, name);
  },
);

Then(
  '{person} sees these Workspace Goals:',
  function (this: ThriveWorld, _name: string, table: DataTable) {
    const items: {
      name: string;
      description: string | null;
      status: string;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((i) => [i.name, i.description ?? '', i.status]),
      table.hashes().map((row) => [row.Name, row.Description, row.Status]),
    );
  },
);

Then(
  '{person} sees no Workspace Goals',
  async function (this: ThriveWorld, name: string) {
    const response = this.succeeded(
      await listWorkspaceGoals(this, name),
      `${name} looking at the Workspace Goals`,
    );
    assert.deepEqual(response.body.items, []);
  },
);

Then(
  '{person} is told the name {}',
  function (this: ThriveWorld, _name: string, reason: string) {
    const code = NAME_REFUSALS[reason];
    assert.ok(code, `No refusal is known as "${reason}".`);
    this.refusedWith(code);
  },
);

Then(
  '{person} is told they may not manage Workspace Goals',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS');
  },
);
