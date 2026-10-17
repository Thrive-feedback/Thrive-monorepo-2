import assert from 'node:assert/strict';
import { harness } from './harness';
import type { ApiResponse, ThriveWorld } from './world';

/**
 * The calls a person makes through the product, shared by the steps that perform them and
 * the steps that set them up as a given (`BE_13` R3, R4).
 */

export function introduce(
  world: ThriveWorld,
  name: string,
): Promise<ApiResponse> {
  return world.as(name, 'POST', '/v1/profiles', {
    fullName: `${name} Lee`,
    displayName: name,
  });
}

export async function createWorkspace(
  world: ThriveWorld,
  name: string,
  workspaceName: string,
): Promise<ApiResponse> {
  const response = await world.as(name, 'POST', '/v1/workspaces', {
    name: workspaceName,
  });
  if (response.status === 201) {
    world.joined(name, response.body.id);
  }
  return response;
}

/** Signs `name` in if they are not yet, introduces them, and founds `workspaceName`. */
export async function ownAWorkspace(
  world: ThriveWorld,
  name: string,
  workspaceName: string,
): Promise<void> {
  if (!world.isSignedIn(name)) {
    await world.signIn(name);
  }
  world.succeeded(
    await introduce(world, name),
    `${name} introducing themselves`,
  );
  world.succeeded(
    await createWorkspace(world, name, workspaceName),
    `${name} creating ${workspaceName}`,
  );
}

/** `inviter` invites one or several people in a single send. */
export function invite(
  world: ThriveWorld,
  inviter: string,
  ...invitees: string[]
): Promise<ApiResponse> {
  return inviteWithRoles(
    world,
    inviter,
    invitees.map((invitee) => [invitee, 'MEMBER']),
  );
}

/** `inviter` invites each person with the Role beside them, in one send. */
export function inviteWithRoles(
  world: ThriveWorld,
  inviter: string,
  invitees: readonly (readonly [string, 'ADMIN' | 'MEMBER'])[],
): Promise<ApiResponse> {
  return world.as(
    inviter,
    'POST',
    `/v1/workspaces/${world.workspaceOf(inviter)}/invitations`,
    {
      invitations: invitees.map(([invitee, role]) => ({
        email: world.person(invitee).email,
        role,
      })),
    },
  );
}

/** `changer` gives `name` a Role in `changer`'s Workspace, from the Members screen. */
export function changeRole(
  world: ThriveWorld,
  changer: string,
  name: string,
  role: 'ADMIN' | 'MEMBER',
): Promise<ApiResponse> {
  return world.as(
    changer,
    'PATCH',
    `/v1/workspaces/${world.workspaceOf(changer)}/members/${world.person(name).accountId}`,
    { role },
  );
}

/** The Invitation id, read from the link in the email `invitee` was sent — as they would. */
export function invitationIdEmailedTo(
  world: ThriveWorld,
  invitee: string,
): string {
  const { email } = world.person(invitee);
  const sent = harness()
    .emailSender.sent.filter((message) => message.to === email)
    .at(-1);
  assert.ok(sent, `No Invitation was emailed to ${invitee}.`);
  const link = sent.text.match(/\/invitations\/([0-9a-f-]{36})/);
  assert.ok(
    link,
    `The email to ${invitee} has no Invitation link:\n${sent.text}`,
  );
  return link[1] as string;
}

export function accept(
  world: ThriveWorld,
  name: string,
  invitationId: string,
): Promise<ApiResponse> {
  return world.as(name, 'POST', `/v1/invitations/${invitationId}/accept`);
}

/** Signs `name` in, has `admin` invite them, and accepts from the email. */
export async function joinWorkspaceOf(
  world: ThriveWorld,
  name: string,
  admin: string,
): Promise<void> {
  if (!world.isSignedIn(name)) {
    await world.signIn(name);
  }
  world.succeeded(
    await invite(world, admin, name),
    `${admin} inviting ${name}`,
  );
  world.succeeded(
    await accept(world, name, invitationIdEmailedTo(world, name)),
    `${name} accepting the Invitation`,
  );
  world.joined(name, world.workspaceOf(admin));
}

/** Who besides the Giver and the Receiver may read Feedback, as a request or a gift sends it. */
export interface VisibilityChosen {
  readonly visibility: 'ONLY_ME' | 'SELECTED_PEOPLE' | 'EVERYONE';
  readonly selectedAccountIds?: readonly string[];
}

/** The `{sharedWith}` words of a feature file, as the API is sent them. */
export function visibilityOf(
  world: ThriveWorld,
  sharedWith: string,
): VisibilityChosen {
  if (sharedWith === 'nobody else') {
    return { visibility: 'ONLY_ME' };
  }
  if (sharedWith === 'everyone in the Workspace') {
    return { visibility: 'EVERYONE' };
  }
  return {
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: sharedWith
      .split(' and ')
      .map((name) => world.person(name).accountId),
  };
}

/** The Giver gives the Receiver Feedback without being asked, as Give feedback sends it. */
export async function giveFeedback(
  world: ThriveWorld,
  giver: string,
  receiver: string,
  topic: string,
  body: string,
  visibility: VisibilityChosen = { visibility: 'ONLY_ME' },
): Promise<ApiResponse> {
  const workspaceId = world.workspaceOf(giver);
  const response = await world.as(
    giver,
    'POST',
    `/v1/workspaces/${workspaceId}/feedback`,
    {
      receiverAccountId: world.person(receiver).accountId,
      topic,
      body,
      ...visibility,
    },
  );
  if (response.status === 201) {
    world.feedback = { id: response.body.id, workspaceId };
  }
  return response;
}

export async function askForFeedback(
  world: ThriveWorld,
  requester: string,
  giver: string,
  topic: string,
  visibility: VisibilityChosen = { visibility: 'ONLY_ME' },
): Promise<ApiResponse> {
  const workspaceId = world.workspaceOf(requester);
  const response = await world.as(
    requester,
    'POST',
    `/v1/workspaces/${workspaceId}/feedback-requests`,
    { topic, giverAccountIds: [world.person(giver).accountId], ...visibility },
  );
  if (response.status === 201) {
    world.feedbackRequest = { id: response.body.id, workspaceId };
  }
  return response;
}

export async function myMemberships(
  world: ThriveWorld,
  name: string,
): Promise<{ workspace: { name: string }; role: string }[]> {
  const response = world.succeeded(
    await world.as(name, 'GET', '/v1/members/mine'),
    `Listing ${name}'s memberships`,
  );
  return response.body.items;
}

export async function myInvitations(
  world: ThriveWorld,
  name: string,
): Promise<
  {
    invitationId: string;
    workspace: { name: string; memberCount: number };
  }[]
> {
  const response = world.succeeded(
    await world.as(name, 'GET', '/v1/invitations/mine'),
    `Listing the Invitations waiting for ${name}`,
  );
  return response.body.items;
}

/** The Giver answers the one Ask waiting for them, as the answer screen would. */
export async function answerTheirAsk(
  world: ThriveWorld,
  giver: string,
  body: string,
): Promise<ApiResponse> {
  const workspaceId = world.workspaceOf(giver);
  const response = await world.as(
    giver,
    'POST',
    `/v1/workspaces/${workspaceId}/feedback-asks/${await askIdWaitingFor(world, giver)}/answers`,
    { body },
  );
  if (response.status === 201) {
    world.feedback = { id: response.body.feedbackId, workspaceId };
  }
  return response;
}

/**
 * The id of the Ask `name` is answering: the one their screen already holds, or — the first
 * time — the one waiting in their own list, which is the only route that will show it to them.
 *
 * Remembering it is what lets a scenario press Send twice. A Giver who has just answered has
 * the id in front of them; their waiting list no longer does.
 */
export async function askIdWaitingFor(
  world: ThriveWorld,
  name: string,
): Promise<string> {
  const onScreen = world.askOnScreen(name);
  if (onScreen) {
    return onScreen;
  }
  const listed = world.succeeded(
    await world.as(
      name,
      'GET',
      `/v1/workspaces/${world.workspaceOf(name)}/feedback-asks`,
    ),
    `${name} listing what they have been asked`,
  );
  const askId: string | undefined = listed.body.items[0]?.askId;
  assert.ok(askId, `${name} has no Ask waiting for them.`);
  world.opened(name, askId);
  return askId;
}
