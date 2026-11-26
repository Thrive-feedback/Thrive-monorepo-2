import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import { assertLocalDatabase } from './seed-local.guard';

/**
 * Fills a local database with a Workspace that looks lived in: ten Members, three Workspace Goals,
 * and two weeks of Feedback, asked and given at every Visibility, and Kudos, several a day with a
 * few quiet days between, so Home's week, its ribbon and its days all have something to show. Then
 * it prints how to be signed in as its Admin (#173).
 *
 * Everything that can go through the product's own API does, so the rows this leaves behind obey
 * the same rules a person's clicks would. Four things cannot, and only those are written directly:
 * - a session, because Google cannot be driven from a script;
 * - the other Members' memberships, because inviting them would send a real email — local
 *   included, there is no switch (ADR 0038);
 * - when each piece was written: the API stamps everything now, and a Home whose week is one busy
 *   day shows nothing of how it reads, so each piece is moved back to its day afterwards, its Asks
 *   and its request with it;
 * - with `SEED_JOIN_EMAIL`, the browser sessions of that Account, pointed at the seeded Workspace so
 *   the next page it opens is this one rather than a choice.
 *
 * `SEED_JOIN_EMAIL` lets a developer see it as themselves: the Account that signed in with that
 * address joins as an Admin, and the pieces and Asks addressed to the Admin are addressed to them.
 * The Account must exist, so it is checked before anything is written.
 *
 * Each run seeds its own Workspace with its own people and the same pieces on the same days counted
 * back from today, so running it twice collides with nothing.
 */

const API_BASE_URL = process.env.SEED_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE_URL = process.env.SEED_WEB_BASE_URL ?? 'http://localhost:3001';
const JOIN_EMAIL = process.env.SEED_JOIN_EMAIL?.trim() || undefined;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The clock Home counts its days on (ADR 0095), so a piece lands on the day it is seeded for. */
const CALENDAR_UTC_OFFSET_HOURS = 7;

type Person = {
  readonly name: string;
  readonly accountId: string;
  readonly email: string;
  /** The `cookie` header a browser holding this session would send. */
  readonly credential: string;
};

/** The invented people, by the key the pieces below name them with. The first is the Admin. */
const PEOPLE = {
  ann: 'Ann Lee',
  ben: 'Ben Carter',
  cara: 'Cara Diaz',
  dev: 'Dev Patel',
  elena: 'Elena Rossi',
  femi: 'Femi Okafor',
  grace: 'Grace Kim',
  hugo: 'Hugo Martin',
  isla: 'Isla Novak',
  jun: 'Jun Tanaka',
} as const;

/** `me` is whoever reads Home: the joining Account when there is one, Ann otherwise. */
type Who = keyof typeof PEOPLE | 'me';

type Visibility = 'ONLY_ME' | 'SELECTED_PEOPLE' | 'EVERYONE';

/** When a piece was written: days back from today, and the hour of that day, on Home's clock. */
type When = { readonly day: number; readonly hour: number };

type Offered = When & {
  readonly from: Who;
  readonly to: readonly Who[];
  readonly visibility: Visibility;
  readonly selected?: readonly Who[];
  readonly message: string;
};

type Answered = When & {
  readonly requester: Who;
  readonly giver: Who;
  readonly visibility: Visibility;
  readonly selected?: readonly Who[];
  readonly request: string;
  /** Left out, the Ask is still waiting. */
  readonly answer?: string;
};

/** A Kudos, its @mentions written `{who}` and filled in with each person's handle. */
type Praise = When & { readonly from: Who; readonly message: string };

const WORKSPACE_GOALS = ['Ownership', 'Craft', 'Kindness'] as const;

/** Two weeks of Feedback given unasked. Days 2, 5 and 10 hold nothing at all. */
const OFFERED: readonly Offered[] = [
  {
    day: 0,
    hour: 9,
    from: 'cara',
    to: ['ben'],
    visibility: 'EVERYONE',
    message:
      'The migration plan you wrote let three teams move on the same afternoon without a single question in the channel. That is #Ownership.',
  },
  {
    day: 0,
    hour: 11,
    from: 'elena',
    to: ['me'],
    visibility: 'EVERYONE',
    message:
      'You cut the planning meeting to twenty minutes and nobody missed a thing. The written agenda beforehand made it possible.',
  },
  {
    day: 1,
    hour: 10,
    from: 'hugo',
    to: ['isla'],
    visibility: 'SELECTED_PEOPLE',
    selected: ['me'],
    message:
      'Your design review notes were kind and still precise. Pointing at the one thing to change first made it easy to act on.',
  },
  {
    day: 1,
    hour: 15,
    from: 'femi',
    to: ['grace'],
    visibility: 'EVERYONE',
    message:
      'Pairing with you on the flaky test taught me more than the fix did. You explained every step before you took it.',
  },
  {
    day: 3,
    hour: 14,
    from: 'me',
    to: ['ben'],
    visibility: 'EVERYONE',
    message:
      'The release notes landed on the day for the first time this quarter. Drafting them as you went clearly works. #Craft',
  },
  {
    day: 4,
    hour: 9,
    from: 'dev',
    to: ['cara'],
    visibility: 'EVERYONE',
    message:
      'When the client changed the brief, you rewrote the timeline in an hour and told everyone what it cost. Calm and clear.',
  },
  {
    day: 4,
    hour: 13,
    from: 'jun',
    to: ['hugo'],
    visibility: 'SELECTED_PEOPLE',
    selected: ['me', 'ben'],
    message:
      'The demo ran long because the questions were good, but the last five minutes were rushed. Try leaving them for questions.',
  },
  {
    day: 4,
    hour: 17,
    from: 'ben',
    to: ['me'],
    visibility: 'ONLY_ME',
    message:
      'In the one-to-one you heard me out before you answered, and it made the hard part easier to say. Thank you.',
  },
  {
    day: 6,
    hour: 10,
    from: 'isla',
    to: ['dev'],
    visibility: 'EVERYONE',
    message:
      'Your onboarding checklist saved the new hires a day each. Writing it down instead of explaining it again is the gift.',
  },
  {
    day: 6,
    hour: 16,
    from: 'elena',
    to: ['jun'],
    visibility: 'ONLY_ME',
    message:
      'The estimate you gave in standup was a guess said as a promise. Saying how sure you are would help the rest of us plan.',
  },
  {
    day: 7,
    hour: 11,
    from: 'ben',
    to: ['grace'],
    visibility: 'EVERYONE',
    message:
      'You stayed late to unblock the support queue and wrote up what you found for the morning shift. #Kindness',
  },
  {
    day: 8,
    hour: 15,
    from: 'femi',
    to: ['me', 'cara'],
    visibility: 'EVERYONE',
    message:
      'The two of you turned a tense retro into a list of three things we actually did. Good facilitation is mostly listening.',
  },
  {
    day: 9,
    hour: 10,
    from: 'grace',
    to: ['elena'],
    visibility: 'EVERYONE',
    message:
      'The accessibility audit was thorough and you ranked what to fix by who it hurts most. That ordering made it doable.',
  },
  {
    day: 9,
    hour: 14,
    from: 'jun',
    to: ['dev'],
    visibility: 'SELECTED_PEOPLE',
    selected: ['me'],
    message:
      'Your code reviews are fast, which I love, but a few approvals came before the tests ran. Worth waiting for green.',
  },
  {
    day: 11,
    hour: 12,
    from: 'isla',
    to: ['ben'],
    visibility: 'EVERYONE',
    message:
      'You noticed the new starter eating alone and asked her to lunch. Small, and the whole floor felt it. #Kindness',
  },
  {
    day: 12,
    hour: 9,
    from: 'cara',
    to: ['hugo'],
    visibility: 'EVERYONE',
    message:
      'The prototype you built over two days answered the question we had argued about for two weeks. #Craft',
  },
  {
    day: 13,
    hour: 16,
    from: 'dev',
    to: ['jun'],
    visibility: 'EVERYONE',
    message:
      'You owned the outage end to end, from the first alert to the write-up, and the write-up blamed no one. #Ownership',
  },
];

/** Feedback asked for: answered, so it shows where its Visibility lets it, or still waiting. */
const ASKED: readonly Answered[] = [
  {
    day: 0,
    hour: 13,
    requester: 'dev',
    giver: 'femi',
    visibility: 'EVERYONE',
    request: 'How I ran the sprint kickoff',
    answer:
      'You set one goal and kept coming back to it, which kept the room focused. The backlog walk-through could be half as long.',
  },
  {
    day: 3,
    hour: 10,
    requester: 'me',
    giver: 'grace',
    visibility: 'EVERYONE',
    request: 'The way I share decisions with the team',
    answer:
      'Writing the decision and the reason in one message is great. Saying who was in the room when it was made would help too.',
  },
  {
    day: 6,
    hour: 12,
    requester: 'hugo',
    giver: 'elena',
    visibility: 'SELECTED_PEOPLE',
    selected: ['me'],
    request: 'My first month leading the design team',
    answer:
      'You protect the team’s focus time fiercely and it shows in the work. Share more of what you hear from leadership, too.',
  },
  {
    day: 8,
    hour: 11,
    requester: 'cara',
    giver: 'ben',
    visibility: 'EVERYONE',
    request: 'How I present project updates',
    answer:
      'Leading with the risk instead of the progress is what makes your updates useful. Keep the slides; drop the appendix.',
  },
  {
    day: 11,
    hour: 15,
    requester: 'me',
    giver: 'jun',
    visibility: 'SELECTED_PEOPLE',
    selected: ['ben'],
    request: 'My feedback on your pull requests',
    answer:
      'Your comments are specific and kind. Marking which ones block the merge would save me guessing.',
  },
  // Waiting for whoever reads Home.
  {
    day: 0,
    hour: 8,
    requester: 'isla',
    giver: 'me',
    visibility: 'EVERYONE',
    request: 'How I handled the customer escalation on Monday',
  },
  {
    day: 1,
    hour: 9,
    requester: 'ben',
    giver: 'me',
    visibility: 'ONLY_ME',
    request: 'My pull request reviews this sprint',
  },
  {
    day: 3,
    hour: 16,
    requester: 'cara',
    giver: 'me',
    visibility: 'SELECTED_PEOPLE',
    selected: ['dev'],
    request: 'The roadmap draft I shared on Thursday',
  },
  {
    day: 6,
    hour: 11,
    requester: 'femi',
    giver: 'me',
    visibility: 'ONLY_ME',
    request: 'Running my first all-hands',
  },
  // What the reader asked and is still waiting on.
  {
    day: 1,
    hour: 14,
    requester: 'me',
    giver: 'hugo',
    visibility: 'ONLY_ME',
    request: 'How I gave the team the news about the re-org',
  },
];

const PRAISE: readonly Praise[] = [
  {
    day: 0,
    hour: 16,
    from: 'jun',
    message:
      'Launch day went without a hitch. Thank you {me} and {hugo} for the late checks!',
  },
  {
    day: 1,
    hour: 12,
    from: 'ben',
    message:
      '{cara} and {dev} rebuilt the dashboard in a week. Beautiful work.',
  },
  {
    day: 1,
    hour: 17,
    from: 'isla',
    message:
      '{me}, thanks for covering my on-call so I could be at the wedding.',
  },
  {
    day: 3,
    hour: 11,
    from: 'cara',
    message:
      'Shout-out to {jun} and {elena} for the cleanest handover I have seen. #Ownership',
  },
  {
    day: 4,
    hour: 15,
    from: 'femi',
    message: '{isla} found the bug that had us stuck since Tuesday.',
  },
  {
    day: 6,
    hour: 9,
    from: 'grace',
    message:
      'Coffee is on me for {ben}, {femi} and {jun}: the office move was painless.',
  },
  {
    day: 7,
    hour: 14,
    from: 'dev',
    message: 'Thank you {me} for the thoughtful onboarding plan. #Kindness',
  },
  {
    day: 8,
    hour: 10,
    from: 'hugo',
    message: '{isla} and {cara} made the workshop fun and useful at once.',
  },
  {
    day: 11,
    hour: 10,
    from: 'elena',
    message: '{femi} answered forty support tickets today with a smile.',
  },
  {
    day: 12,
    hour: 15,
    from: 'ben',
    message: 'Huge thanks {me} and {grace} for the quarterly report. #Craft',
  },
  {
    day: 13,
    hour: 11,
    from: 'jun',
    message: '{dev}, your talk at the meetup made us all proud.',
  },
];

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

/**
 * The instant `hour` o'clock fell, `day` days back, on Home's clock. Today's later hours have not
 * come yet, so those are a few minutes ago instead, still in the order of their hours.
 */
function instantOf({ day, hour }: When, now: number): Date {
  const onTheClock = new Date(now + CALENDAR_UTC_OFFSET_HOURS * HOUR_MS);
  const midnight =
    Date.UTC(
      onTheClock.getUTCFullYear(),
      onTheClock.getUTCMonth(),
      onTheClock.getUTCDate(),
    ) -
    CALENDAR_UTC_OFFSET_HOURS * HOUR_MS;
  const at = midnight - day * DAY_MS + hour * HOUR_MS;
  return new Date(Math.min(at, now - (25 - hour) * 60 * 1000));
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
  const now = Date.now();

  // Before anything is written, so a mistyped address leaves nothing half seeded behind.
  const joining = JOIN_EMAIL
    ? await prismaService.user.findUnique({
        where: { email: JOIN_EMAIL },
        include: { profile: true },
      })
    : null;
  if (JOIN_EMAIL && !joining) {
    await prismaService.$disconnect();
    console.log(`
No Account has signed in as ${JOIN_EMAIL} on this database yet, so nothing was seeded.

Sign in once at ${WEB_BASE_URL} with that Google account, then run this again.
`);
    return;
  }

  /** A session for an Account, written as Better Auth writes one: the one thing it cannot be asked. */
  async function sessionFor(
    accountId: string,
  ): Promise<{ id: string; credential: string }> {
    const { internalAdapter } = await auth.$context;
    const session = await internalAdapter.createSession(accountId);
    const signature = await makeSignature(
      session.token,
      configuration.auth.secret,
    );
    const token = encodeURIComponent(`${session.token}.${signature}`);
    return { id: session.id, credential: `thrive.session_token=${token}` };
  }

  // One domain per run, so each run's people have their own addresses while keeping readable
  // handles: a handle comes from the part before the `@`, and a second run's `ann.lee` simply
  // becomes `ann.lee-2`. The whole id, because a UUIDv7 starts with a timestamp, so two runs a few
  // seconds apart share their first characters.
  const run = uuidv7();

  /** A signed-in Account for one of the invented people. */
  async function signIn(fullName: string): Promise<Person> {
    const accountId = uuidv7();
    const email = `${fullName.toLowerCase().replace(' ', '.')}@${run}.acme.test`;
    await prismaService.user.create({
      // Verified, as Google marks every Account it signs in.
      data: { id: accountId, name: fullName, email, emailVerified: true },
    });
    const { credential } = await sessionFor(accountId);
    return { name: fullName, accountId, email, credential };
  }

  const people = new Map<keyof typeof PEOPLE, Person>();
  for (const [key, fullName] of Object.entries(PEOPLE)) {
    const person = await signIn(fullName);
    await call(person, 'POST', '/v1/profiles', {
      fullName,
      displayName: fullName.split(' ')[0],
    });
    people.set(key as keyof typeof PEOPLE, person);
  }
  const admin = people.get('ann');
  if (!admin) {
    throw new Error('The seed names no Admin.');
  }

  let joiner: (Person & { sessionId: string }) | null = null;
  if (joining) {
    const { id, credential } = await sessionFor(joining.id);
    joiner = {
      name: joining.profile?.fullName ?? joining.name,
      accountId: joining.id,
      email: joining.email,
      credential,
      sessionId: id,
    };
    if (!joining.profile) {
      // As "Introduce yourself" would, with the name Google gave, so Home opens rather than asking.
      await call(joiner, 'POST', '/v1/profiles', {
        fullName: joining.name,
        displayName: joining.name.split(' ')[0] ?? joining.name,
      });
    }
  }

  const reader = joiner ?? admin;
  const resolve = (who: Who): Person => {
    const person = who === 'me' ? reader : people.get(who);
    if (!person) {
      throw new Error(`The seed names nobody called ${who}.`);
    }
    return person;
  };
  const idsOf = (whos: readonly Who[] | undefined) =>
    whos?.map((who) => resolve(who).accountId);

  const workspace = await call(admin, 'POST', '/v1/workspaces', {
    name: 'Acme',
  });
  const workspaceId = workspace.id as string;
  const memberships = [...people.values()]
    .filter((person) => person !== admin)
    .map((person) => ({ person, role: 'member' }));
  if (joiner) {
    memberships.push({ person: joiner, role: 'admin' });
  }
  for (const { person, role } of memberships) {
    await prismaService.member.create({
      data: { id: uuidv7(), workspaceId, userId: person.accountId, role },
    });
  }
  if (joiner) {
    // Through the API for the session this script holds, and directly for the browser's own, so
    // the next page the developer opens is this Workspace rather than a choice between them.
    await call(joiner, 'POST', `/v1/workspaces/${workspaceId}/switch`);
    await prismaService.session.updateMany({
      where: { userId: joiner.accountId, id: { not: joiner.sessionId } },
      data: { activeOrganizationId: workspaceId },
    });
  }

  const handles = new Map<string, string>();
  for (const person of [...people.values(), ...(joiner ? [joiner] : [])]) {
    const current = await call(person, 'GET', '/v1/sessions/current');
    const account = current.account as { profile: { slug: string } | null };
    if (!account.profile) {
      throw new Error(`${person.name} has no Profile to be mentioned by.`);
    }
    handles.set(person.accountId, account.profile.slug);
  }

  for (const name of WORKSPACE_GOALS) {
    await call(admin, 'POST', `/v1/workspaces/${workspaceId}/workspace-goals`, {
      name,
    });
  }

  for (const piece of OFFERED) {
    const { id } = await call(
      resolve(piece.from),
      'POST',
      `/v1/workspaces/${workspaceId}/feedback`,
      {
        receiverAccountIds: idsOf(piece.to),
        message: piece.message,
        visibility: piece.visibility,
        selectedAccountIds: idsOf(piece.selected),
      },
    );
    const at = instantOf(piece, now);
    await prismaService.feedback.update({
      where: { id: id as string },
      data: { createdAt: at, updatedAt: at },
    });
  }

  for (const piece of ASKED) {
    const requester = resolve(piece.requester);
    const giver = resolve(piece.giver);
    const answeredAt = instantOf(piece, now);
    // Asked a few hours before it was answered, or before it was last looked at.
    const askedAt = new Date(answeredAt.getTime() - 3 * HOUR_MS);
    const { id } = await call(
      requester,
      'POST',
      `/v1/workspaces/${workspaceId}/feedback-requests`,
      {
        message: piece.request,
        giverAccountIds: [giver.accountId],
        visibility: piece.visibility,
        selectedAccountIds: idsOf(piece.selected),
      },
    );
    const requestId = id as string;
    await prismaService.feedbackRequest.update({
      where: { id: requestId },
      data: { createdAt: askedAt, updatedAt: askedAt },
    });
    await prismaService.feedbackAsk.updateMany({
      where: { feedbackRequestId: requestId },
      data: { createdAt: askedAt, updatedAt: askedAt },
    });
    if (piece.answer === undefined) {
      continue;
    }
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
    const { feedbackId } = await call(
      giver,
      'POST',
      `/v1/workspaces/${workspaceId}/feedback-asks/${theirs.askId}/answers`,
      { message: piece.answer },
    );
    await prismaService.feedback.update({
      where: { id: feedbackId as string },
      data: { createdAt: answeredAt, updatedAt: answeredAt },
    });
    await prismaService.feedbackAsk.update({
      where: { id: theirs.askId },
      data: { updatedAt: answeredAt },
    });
  }

  for (const piece of PRAISE) {
    const message = piece.message.replace(
      /\{(\w+)\}/gu,
      (_, who: string) => `@${handles.get(resolve(who as Who).accountId)}`,
    );
    const { id } = await call(
      resolve(piece.from),
      'POST',
      `/v1/workspaces/${workspaceId}/kudos`,
      { message },
    );
    const at = instantOf(piece, now);
    await prismaService.kudos.update({
      where: { id: id as string },
      data: { createdAt: at, updatedAt: at },
    });
  }

  if (joiner) {
    // Only the one this script wrote: the developer's own sessions stay theirs.
    await prismaService.session.delete({ where: { id: joiner.sessionId } });
  }
  await prismaService.$disconnect();

  const waitingForReader = ASKED.filter(
    (piece) => piece.giver === 'me' && piece.answer === undefined,
  ).length;
  const quietDays = [...Array(14).keys()].filter(
    (day) =>
      ![...OFFERED, ...ASKED.filter((piece) => piece.answer), ...PRAISE].some(
        (piece) => piece.day === day,
      ),
  );
  const signInLines = joiner
    ? `  Signed in as you, ${joiner.name} <${joiner.email}>, an Admin of Acme beside Ann Lee.
  Open ${WEB_BASE_URL}/home in the browser you signed in with. If it asks which Workspace,
  choose the newest Acme.`
    : `  Signed in as ${admin.name} <${admin.email}>, its Admin.

To be her, add this cookie for ${WEB_BASE_URL} in your browser's developer tools
(Application → Cookies). Google sign-in needs real credentials, which is why this exists:

  name   thrive.session_token
  value  ${admin.credential.replace('thrive.session_token=', '')}

To see it as yourself instead, sign in once at ${WEB_BASE_URL}, then run this again with
SEED_JOIN_EMAIL set to that Google address.`;

  console.log(`
Seeded a Workspace called Acme: ${people.size + (joiner ? 1 : 0)} Members, ${WORKSPACE_GOALS.length} Workspace Goals,
${OFFERED.length} pieces of Feedback given unasked, ${ASKED.filter((piece) => piece.answer).length} answered requests and ${PRAISE.length} Kudos over the
last two weeks, nothing on days ${quietDays.join(', ')} back.

${signInLines}

What is on screen for ${reader.name}:

  Home            ${WEB_BASE_URL}/home
                  the week counted day by day, two quiet days in it; scroll for the small week
  Shared with you ${WEB_BASE_URL}/home?show=shared
  Received        ${WEB_BASE_URL}/received
  Your requests   ${WEB_BASE_URL}/received?show=requests
  Waiting for you ${WEB_BASE_URL}/waiting   ${waitingForReader} Asks to answer
  Kudos board     ${WEB_BASE_URL}/kudos

Run this again for another Workspace with its own people; nothing is overwritten.
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
