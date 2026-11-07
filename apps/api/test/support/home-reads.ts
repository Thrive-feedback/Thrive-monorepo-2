import assert from 'node:assert/strict';
import type { ApiResponse, ThriveWorld } from './world';

/**
 * What a Member reads of Feedback, through the pages they read it on: Home, filtered to Everyone in
 * the Workspace or to what was shared with them, and Received, which holds what was written to them
 * and the requests they sent (ADR 0083). Each read keeps the answer it got as the world's last
 * response, in the shape the steps after it read, so a rule says the same whichever page shows it.
 */

interface Person {
  readonly accountId: string;
  readonly name: string | null;
  readonly photoUrl: string | null;
  readonly status: string;
}

interface Answer {
  readonly id?: string;
  readonly message: string;
  readonly tags: unknown;
  readonly answeredAt: string;
}

interface Ask {
  readonly person: Person;
  readonly status: string;
  readonly answer: Answer | null;
}

interface FeedbackItem {
  readonly kind: 'FEEDBACK';
  readonly id: string;
  readonly origin: string;
  readonly feedbackRequestId: string | null;
  readonly giver: Person;
  readonly receivers: readonly Person[];
  readonly message: string;
  readonly tags: unknown;
  readonly createdAt: string;
  readonly request: { readonly asked: readonly Ask[] } | null;
}

interface RequestItem {
  readonly kind: 'REQUEST';
  readonly id: string;
  readonly message: string;
  readonly tags: unknown;
  readonly postcard: unknown;
  readonly visibility: string;
  readonly selectedPeople: readonly Person[];
  readonly asked: readonly Ask[];
}

type Item = FeedbackItem | RequestItem | { readonly kind: 'KUDOS' };

/** The last response, with `body` swapped for what the steps after it read. */
function keep(world: ThriveWorld, response: ApiResponse, body: unknown) {
  world.lastResponse = { status: response.status, body };
  return world.lastResponse;
}

function feedbackOf(items: readonly Item[]): FeedbackItem[] {
  return items.filter((item): item is FeedbackItem => item.kind === 'FEEDBACK');
}

function requestsOf(items: readonly Item[]): RequestItem[] {
  return items.filter((item): item is RequestItem => item.kind === 'REQUEST');
}

/** One piece on Home, naming everyone asked on the request it answers rather than their Asks. */
function asFeedOf(item: FeedbackItem) {
  return {
    ...item,
    request: item.request && {
      ...item.request,
      asked: item.request.asked.map((ask) => ask.person),
    },
  };
}

/**
 * Home showing Feedback for everyone in a Workspace, as `reader` reads it. Kudos sit on Home too,
 * and are left out: the Workspace feed is the Feedback.
 */
export async function readWorkspaceFeed(
  world: ThriveWorld,
  reader: string,
  workspaceId: string,
) {
  const response = await world.as(
    reader,
    'GET',
    `/v1/workspaces/${workspaceId}/feed-items?show=EVERYONE`,
  );
  if (response.status !== 200) {
    return response;
  }
  return keep(world, response, {
    items: feedbackOf(response.body.items).map(asFeedOf),
  });
}

/** Home showing what somebody selected `reader` to read. */
export async function readSharedWithMe(world: ThriveWorld, reader: string) {
  const response = await world.as(
    reader,
    'GET',
    `/v1/workspaces/${world.workspaceOf(reader)}/feed-items?show=SHARED_WITH_ME`,
  );
  if (response.status !== 200) {
    return response;
  }
  return keep(world, response, {
    items: feedbackOf(response.body.items).map(asFeedOf),
  });
}

async function readReceived(world: ThriveWorld, reader: string, show: string) {
  return world.as(
    reader,
    'GET',
    `/v1/workspaces/${world.workspaceOf(reader)}/received-items?show=${show}`,
  );
}

/**
 * Every piece of Feedback written to `reader`, newest first: what was given to them unasked, and
 * every answer to the requests they sent, which Received holds inside each request.
 */
export async function readWrittenTo(world: ThriveWorld, reader: string) {
  const response = await readReceived(world, reader, 'ALL');
  if (response.status !== 200) {
    return response;
  }
  const items: readonly Item[] = response.body.items;
  const { accountId } = world.person(reader);
  const offered = feedbackOf(items).map((item) => ({
    id: item.id,
    origin: item.origin,
    feedbackRequestId: item.feedbackRequestId,
    giverAccountId: item.giver.accountId,
    giverName: item.giver.name,
    giverPhotoUrl: item.giver.photoUrl,
    giverStatus: item.giver.status,
    otherReceivers: item.receivers.filter(
      (person) => person.accountId !== accountId,
    ),
    message: item.message,
    tags: item.tags,
    createdAt: item.createdAt,
  }));
  const answers = requestsOf(items).flatMap((request) =>
    request.asked.flatMap((ask) =>
      ask.answer
        ? [
            {
              id: ask.answer.id,
              origin: 'REQUESTED',
              feedbackRequestId: request.id,
              giverAccountId: ask.person.accountId,
              giverName: ask.person.name,
              giverPhotoUrl: ask.person.photoUrl,
              giverStatus: ask.person.status,
              otherReceivers: [],
              message: ask.answer.message,
              tags: ask.answer.tags,
              createdAt: ask.answer.answeredAt,
            },
          ]
        : [],
    ),
  );
  const written = [...offered, ...answers].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  return keep(world, response, { items: written });
}

/** One request as its Requester reads it in Received: who was asked, and what each answered. */
function asRequestOf(request: RequestItem) {
  return {
    id: request.id,
    message: request.message,
    tags: request.tags,
    postcard: request.postcard,
    visibility: {
      value: request.visibility,
      selectedPeople: request.selectedPeople,
    },
    asks: request.asked.map((ask) => ({
      giverAccountId: ask.person.accountId,
      status: ask.status,
      answer: ask.answer,
    })),
  };
}

/** The requests `requester` sent, as Received holds them. */
export async function readRequestsSent(world: ThriveWorld, requester: string) {
  const response = await readReceived(world, requester, 'REQUESTS');
  if (response.status !== 200) {
    return response;
  }
  return keep(world, response, {
    items: requestsOf(response.body.items).map(asRequestOf),
  });
}

/**
 * The scenario's request, opened by `opener` where they read it: their own in Received, or, for
 * someone asked, their Ask on it, which is all of a request a Giver is shown.
 */
export async function openTheRequest(
  world: ThriveWorld,
  opener: string,
  askIdOf: (world: ThriveWorld, giver: string) => Promise<string>,
): Promise<ApiResponse> {
  assert.ok(
    world.feedbackRequest,
    'No Feedback request was sent in this scenario.',
  );
  const { id, workspaceId } = world.feedbackRequest;
  const sent = await readReceived(world, opener, 'REQUESTS');
  const own = requestsOf(sent.status === 200 ? sent.body.items : []).find(
    (request) => request.id === id,
  );
  if (own) {
    return keep(world, sent, asRequestOf(own));
  }
  const askId = await askIdOf(world, opener);
  return world.as(
    opener,
    'GET',
    `/v1/workspaces/${workspaceId}/feedback-asks/${askId}`,
  );
}
