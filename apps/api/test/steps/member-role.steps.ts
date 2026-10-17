import { Given, Then, When } from '@cucumber/cucumber';
import { changeRole } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

Given(
  '{person} has made {person} an Admin',
  async function (this: ThriveWorld, admin: string, name: string) {
    this.succeeded(
      await changeRole(this, admin, name, 'ADMIN'),
      `${admin} making ${name} an Admin`,
    );
  },
);

When(
  '{person} makes {person} an Admin',
  async function (this: ThriveWorld, changer: string, name: string) {
    await changeRole(this, changer, name, 'ADMIN');
  },
);

When(
  '{person} makes {person} a Member',
  async function (this: ThriveWorld, changer: string, name: string) {
    await changeRole(this, changer, name, 'MEMBER');
  },
);

Then(
  '{person} is told to make someone else an Admin first',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('LAST_ADMIN');
  },
);

Then(
  '{person} is told they may not change Roles',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_CHANGE_ROLES');
  },
);

Then(
  '{person} is told {person} is not a Member there',
  function (this: ThriveWorld, _name: string, _other: string) {
    this.refusedWith('MEMBER_NOT_FOUND');
  },
);
