import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import { assertLocalDatabase } from './seed-local.guard';

/**
 * Fills a local database with a Workspace, three Members and Feedback in every state a screen can
 * show, then prints how to be signed in as the Owner (#173).
 *
 * Everything that can go through the product's own API does, so the rows this leaves behind obey
 * the same rules a person's clicks would. Two things cannot, and only those are written directly:
 * a session, because Google cannot be driven from a script, and the other Members' memberships,
 * because inviting them would send a real email — local included, there is no switch (ADR 0038).
 *
 * Each run seeds its own Workspace with its own people, so running it twice collides with nothing.
 */

const API_BASE_URL = process.env.SEED_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE_URL = process.env.SEED_WEB_BASE_URL ?? 'http://localhost:3001';

type Person = {
  readonly name: string;
  readonly accountId: string;
  readonly email: string;
  /** The `cookie` header a browser holding this session would send. */
  readonly credential: string;
};

async function call(
  person: Person,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ [key: string]: unknown }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      cookie: person.credential,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${person.name}: ${method} ${path} answered ${response.status} ${text}`,
    );
  }
  return text === '' ? {} : JSON.parse(text);
}

async function assertApiIsRunning(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      return;
    }
  } catch {
    // Falls through to the same message: unreachable and unhealthy need the same fix.
  }
  throw new Error(
    `The API is not answering at ${API_BASE_URL}. Start the app first — \`bun run dev\` from the repository root — then run this again.`,
  );
}

async function main(): Promise<void> {
  const configuration = loadConfiguration();
  assertLocalDatabase(configuration.database.url);
  await assertApiIsRunning();

  const prismaService = new PrismaService(configuration.database);
  const auth = createAuth(
    prismaService,
    configuration.auth,
    new UuidIdGenerator(),
  );

  /** A signed-in Account: the one thing a script must write itself. */
  async function signIn(name: string, fullName: string): Promise<Person> {
    const accountId = uuidv7();
    // The whole id, not a prefix of it: a UUIDv7 starts with a timestamp, so two runs a few
    // seconds apart share their first characters and would collide on the address.
    const email = `${name.toLowerCase()}-${accountId}@acme.test`;
    await prismaService.user.create({
      // Verified, as Google marks every Account it signs in.
      data: { id: accountId, name: fullName, email, emailVerified: true },
    });
    const { internalAdapter } = await auth.$context;
    const session = await internalAdapter.createSession(accountId);
    const signature = await makeSignature(
      session.token,
      configuration.auth.secret,
    );
    const token = encodeURIComponent(`${session.token}.${signature}`);
    return {
      name: fullName,
      accountId,
      email,
      credential: `thrive.session_token=${token}`,
    };
  }

  const owner = await signIn('ann', 'Ann Lee');
  const teammate = await signIn('ben', 'Ben Carter');
  // A third Member, because a piece shared *with* Ann has to be written by somebody else to
  // somebody else: neither the Giver nor the Receiver can be selected to read it (#88).
  const third = await signIn('cara', 'Cara Diaz');

  for (const person of [owner, teammate, third]) {
    await call(person, 'POST', '/v1/profiles', {
      fullName: person.name,
      displayName: person.name.split(' ')[0],
    });
  }

  const workspace = await call(owner, 'POST', '/v1/workspaces', {
    name: 'Acme',
  });
  const workspaceId = workspace.id as string;
  for (const person of [teammate, third]) {
    await prismaService.member.create({
      data: {
        id: uuidv7(),
        workspaceId,
        userId: person.accountId,
        role: 'member',
      },
    });
  }

  async function ask(
    requester: Person,
    giver: Person,
    topic: string,
  ): Promise<string> {
    const request = await call(
      requester,
      'POST',
      `/v1/workspaces/${workspaceId}/feedback-requests`,
      // Required since #84 gave the Requester the choice; the narrowest one keeps these
      // requests out of Shared with me and the feed, which have their own seeded pieces.
      { topic, giverAccountIds: [giver.accountId], visibility: 'ONLY_ME' },
    );
    return request.id as string;
  }

  async function answer(
    giver: Person,
    requestId: string,
    body: string,
  ): Promise<void> {
    const waiting = await call(
      giver,
      'GET',
      `/v1/workspaces/${workspaceId}/feedback-asks`,
    );
    const asks = waiting.items as {
      askId: string;
      feedbackRequestId: string;
    }[];
    const theirs = asks.find((one) => one.feedbackRequestId === requestId);
    if (!theirs) {
      throw new Error(`${giver.name} has no Ask waiting on ${requestId}.`);
    }
    await call(
      giver,
      'POST',
      `/v1/workspaces/${workspaceId}/feedback-asks/${theirs.askId}/answers`,
      { body },
    );
  }

  const answeredRequest = await ask(
    owner,
    teammate,
    'Running the planning meeting',
  );
  const waitingRequest = await ask(
    owner,
    teammate,
    'How I handled the incident review',
  );
  await answer(
    teammate,
    answeredRequest,
    'You open strongly and keep everyone with you — until the detail near the end, where the room goes quiet. Try parking the detail in a follow-up.',
  );

  const alreadyAnswered = await ask(
    teammate,
    owner,
    'The way I write release notes',
  );
  await ask(teammate, owner, 'My pull request reviews');
  await ask(teammate, owner, 'How I ran the retro last week');
  await answer(
    owner,
    alreadyAnswered,
    'They read clearly and they land a day late. Draft them while the work is fresh, rather than writing them at the end.',
  );

  await call(teammate, 'POST', `/v1/workspaces/${workspaceId}/feedback`, {
    receiverAccountId: owner.accountId,
    topic: 'The customer demo on Tuesday',
    body: 'You kept the room with you when the demo broke, and the recap at the end landed. Keep doing that.',
    visibility: 'ONLY_ME',
  });

  await call(third, 'POST', `/v1/workspaces/${workspaceId}/feedback`, {
    receiverAccountId: teammate.accountId,
    topic: 'The pricing page rewrite',
    body: 'The second paragraph does the work now, and the rest got out of its way. Worth saying what it costs a bit earlier.',
    visibility: 'EVERYONE',
  });

  await call(teammate, 'POST', `/v1/workspaces/${workspaceId}/feedback`, {
    receiverAccountId: third.accountId,
    topic: 'Onboarding the new designers',
    body: 'Your onboarding notes answered every question I had in my first week. Writing them down instead of only explaining them is what made the difference.',
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: [owner.accountId],
  });

  await prismaService.$disconnect();

  console.log(`
Seeded a Workspace called Acme.

  Open        ${WEB_BASE_URL}/home
  Signed in as ${owner.name} <${owner.email}>, its Owner, with ${teammate.name} and ${third.name}

To be them, add this cookie for ${WEB_BASE_URL} in your browser's developer tools
(Application → Cookies). Google sign-in needs real credentials, which is why this exists:

  name   thrive.session_token
  value  ${owner.credential.replace('thrive.session_token=', '')}

What is on screen:

  My requests     2 sent — "Running the planning meeting" answered by Ben, "How I handled the
                  incident review" still waiting
  Waiting for me  2 Asks from Ben to answer, and a third she has already answered
  Feedback for me 2 pieces — what Ben wrote back, and what he gave her without being asked.
                  The one she gave Ben is his, not hers
  Shared with me  1 piece — what Ben wrote to Cara and chose to show Ann. She is neither its
                  Giver nor its Receiver, which is the whole point of the tab
  Workspace feed  1 piece — what Cara wrote to Ben and shared with everyone. Every Member of
                  Acme reads the same feed, and nobody outside it reads any of it
  The answer      ${WEB_BASE_URL}/home?tab=my-requests&request=${answeredRequest}
  Still waiting   ${WEB_BASE_URL}/home?tab=my-requests&request=${waitingRequest}
  Written to her  ${WEB_BASE_URL}/home?tab=received
  Shared with her ${WEB_BASE_URL}/home?tab=shared
  The feed        ${WEB_BASE_URL}/home

Run this again for another Workspace with its own people; nothing is overwritten.
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
