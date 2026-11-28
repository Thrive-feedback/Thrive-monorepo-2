/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ONE_ON_ONE_ID = '0199a0f0-0000-7000-8000-0000000000b1';
const MEETING_ID = '0199a0f0-0000-7000-8000-0000000000c1';
const TOPIC_A = '0199a0f0-0000-7000-8000-0000000000d1';
const TOPIC_B = '0199a0f0-0000-7000-8000-0000000000d2';

vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: async () => ({
    email: 'ann@acme.test',
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'MEMBER',
    },
  }),
}));

/** `redirect` works by throwing, so the fake does too, carrying where it went. */
class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirected to ${to}`);
  }
}
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));

const {
  addTopic,
  checkMeetingState,
  removePreviewTopic,
  reorderPreviewTopics,
  startMeeting,
  updateTopic,
} = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service'
);

const MEETINGS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/one-on-ones/${ONE_ON_ONE_ID}/meetings`;
const MEETING = `${MEETINGS}/${MEETING_ID}`;

function refusal(code: string, status: number) {
  return HttpResponse.json(
    { error: { code, message: 'nope', correlationId: 'correlation-1' } },
    { status },
  );
}

/** The next meeting as the API reads it once open, with these topics in order. */
function openWith(topics: readonly { id: string; text: string }[]) {
  return {
    meeting: {
      id: MEETING_ID,
      state: 'PREPARING',
      templateKey: 'weekly-check-in',
      occursAt: null,
      startedAt: null,
      startedByAccountId: null,
      finishedAt: null,
      finishedByAccountId: null,
      topics: topics.map((topic, position) => ({
        ...topic,
        source: 'TEMPLATE',
        authorAccountId: null,
        position,
        notes: '',
        notesUpdatedAt: null,
        notesUpdatedByAccountId: null,
        discussedAt: null,
      })),
    },
    carried: [],
    templateQuestions: [],
    carriedFromSkipped: null,
    carriedTopics: [],
    templateName: 'Weekly check-in',
  };
}

/** Opens the meeting, or answers the one open, reading back the agenda given. */
function apiHasAgenda(topics: readonly { id: string; text: string }[]) {
  server.use(
    http.post(MEETINGS, () =>
      HttpResponse.json({ id: MEETING_ID }, { status: 200 }),
    ),
    http.get(`${MEETINGS}/next`, () => HttpResponse.json(openWith(topics))),
  );
}

beforeEach(() => {
  revalidatePath.mockClear();
});

describe('writing to a meeting', () => {
  it('opens the next meeting before starting it, when nobody has written to it', async () => {
    const calls: string[] = [];
    server.use(
      http.post(MEETINGS, () => {
        calls.push('open');
        return HttpResponse.json({ id: MEETING_ID }, { status: 201 });
      }),
      http.post(`${MEETING}/start`, () => {
        calls.push('start');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await startMeeting(WORKSPACE_ID, ONE_ON_ONE_ID, null);

    expect(result).toEqual({ ok: true, id: MEETING_ID });
    expect(calls).toEqual(['open', 'start']);
    expect(revalidatePath).toHaveBeenCalledWith('/one-on-ones');
  });

  it('opens it before adding the first topic', async () => {
    const calls: string[] = [];
    server.use(
      http.post(MEETINGS, () => {
        calls.push('open');
        return HttpResponse.json({ id: MEETING_ID }, { status: 201 });
      }),
      http.post(`${MEETING}/topics`, () => {
        calls.push('add');
        return HttpResponse.json({ id: TOPIC_A }, { status: 201 });
      }),
    );

    const result = await addTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      null,
      'Career path',
    );

    expect(result).toEqual({ ok: true, id: TOPIC_A });
    expect(calls).toEqual(['open', 'add']);
  });

  it('sends what a topic was brought from, and says plainly when it is no longer to be brought', async () => {
    const sent: unknown[] = [];
    const brought = {
      kind: 'KUDOS',
      id: '0199a0f0-0000-7000-8000-0000000000e1',
    } as const;
    server.use(
      http.post(`${MEETING}/topics`, async ({ request }) => {
        sent.push(await request.json());
        return sent.length === 1
          ? HttpResponse.json({ id: TOPIC_A }, { status: 201 })
          : refusal('ONE_ON_ONE_TOPIC_SOURCE_NOT_FOUND', 404);
      }),
    );

    const added = await addTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      MEETING_ID,
      'Kudos from Nok: for staying late',
      brought,
    );
    const refused = await addTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      MEETING_ID,
      'Kudos from Nok: for staying late',
      brought,
    );

    expect(added).toEqual({ ok: true, id: TOPIC_A });
    expect(sent[0]).toEqual({
      text: 'Kudos from Nok: for staying late',
      broughtFrom: brought,
    });
    expect(refused).toMatchObject({
      ok: false,
      message: 'That isn’t something you can bring to this 1:1 any more.',
    });
  });

  it('sends nothing for a source that is not a piece of Feedback or a Kudos', async () => {
    const calls: string[] = [];
    server.use(
      http.post(`${MEETING}/topics`, () => {
        calls.push('add');
        return HttpResponse.json({ id: TOPIC_A }, { status: 201 });
      }),
    );

    const result = await addTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      MEETING_ID,
      'Something',
      { kind: 'FEEDBACK', id: 'not-an-id' },
    );

    expect(result).toEqual({
      ok: false,
      message: "That didn't go through. Please try again.",
    });
    expect(calls).toEqual([]);
  });

  it('says a refusal in words, by its code, and anything unknown plainly', async () => {
    server.use(
      http.post(`${MEETING}/start`, () =>
        refusal('ONE_ON_ONE_MEETING_ALREADY_STARTED', 409),
      ),
    );
    expect(await startMeeting(WORKSPACE_ID, ONE_ON_ONE_ID, MEETING_ID)).toEqual(
      {
        ok: false,
        message: 'It has already started. Sync to see.',
        code: 'ONE_ON_ONE_MEETING_ALREADY_STARTED',
      },
    );

    server.use(
      http.post(`${MEETING}/start`, () => refusal('SOMETHING_NEW', 409)),
    );
    expect(await startMeeting(WORKSPACE_ID, ONE_ON_ONE_ID, MEETING_ID)).toEqual(
      {
        ok: false,
        message: "That didn't go through. Please try again.",
        code: 'SOMETHING_NEW',
      },
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('sends a person signed out to sign in', async () => {
    server.use(
      http.post(`${MEETING}/start`, () => refusal('NOT_SIGNED_IN', 401)),
    );

    await expect(
      startMeeting(WORKSPACE_ID, ONE_ON_ONE_ID, MEETING_ID),
    ).rejects.toMatchObject({ to: '/signin' });
  });

  it('saves a note without reading the page again, but a tick reads it again', async () => {
    let body: unknown;
    server.use(
      http.patch(`${MEETING}/topics/${TOPIC_A}`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await updateTopic(WORKSPACE_ID, ONE_ON_ONE_ID, MEETING_ID, TOPIC_A, {
      note: 'Went well',
      noteReadAt: null,
    });
    expect(body).toEqual({ note: 'Went well', noteReadAt: null });
    expect(revalidatePath).not.toHaveBeenCalled();

    await updateTopic(WORKSPACE_ID, ONE_ON_ONE_ID, MEETING_ID, TOPIC_A, {
      discussed: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/one-on-ones');
  });

  it('sends nothing for a change it does not know, or an id that is not one', async () => {
    let sent = false;
    server.use(
      http.patch(`${MEETING}/topics/${TOPIC_A}`, () => {
        sent = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const unknown = await updateTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      MEETING_ID,
      TOPIC_A,
      // A key the API does not take, as a tampered browser might send.
      JSON.parse('{"discussed":true,"text":"Reworded"}'),
    );
    const badId = await updateTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      'not-a-meeting',
      TOPIC_A,
      { discussed: true },
    );

    expect(unknown.ok).toBe(false);
    expect(badId).toEqual({
      ok: false,
      message: "That didn't go through. Please try again.",
    });
    expect(sent).toBe(false);
  });
});

describe('changing the agenda before anybody wrote to it', () => {
  it('removes the topic at the place the person saw, when it is still the one they saw', async () => {
    apiHasAgenda([
      { id: TOPIC_A, text: 'Launch retro' },
      { id: TOPIC_B, text: 'What went well?' },
    ]);
    let removed = '';
    server.use(
      http.delete(`${MEETING}/topics/:topicId`, ({ params }) => {
        removed = String(params.topicId);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await removePreviewTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      1,
      'What went well?',
    );

    expect(result.ok).toBe(true);
    expect(removed).toBe(TOPIC_B);
  });

  it('removes nothing when the other person changed the agenda meanwhile', async () => {
    apiHasAgenda([
      { id: TOPIC_B, text: 'What went well?' },
      { id: TOPIC_A, text: 'Launch retro' },
    ]);
    let sent = false;
    server.use(
      http.delete(`${MEETING}/topics/:topicId`, () => {
        sent = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await removePreviewTopic(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      1,
      'What went well?',
    );

    expect(result).toEqual({
      ok: false,
      message: 'The agenda changed. Sync to see it.',
    });
    expect(sent).toBe(false);
  });

  it('moves a topic by the places the person saw, and refuses when the agenda is not what they saw', async () => {
    apiHasAgenda([
      { id: TOPIC_A, text: 'Launch retro' },
      { id: TOPIC_B, text: 'What went well?' },
    ]);
    let order: unknown;
    server.use(
      http.put(`${MEETING}/topics/order`, async ({ request }) => {
        order = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const moved = await reorderPreviewTopics(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      ['Launch retro', 'What went well?'],
      0,
      1,
    );
    expect(moved.ok).toBe(true);
    expect(order).toEqual({ topicIds: [TOPIC_B, TOPIC_A] });

    order = undefined;
    const stale = await reorderPreviewTopics(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      ['What went well?', 'Launch retro'],
      0,
      1,
    );
    expect(stale).toEqual({
      ok: false,
      message: 'The agenda changed. Sync to see it.',
    });
    expect(order).toBeUndefined();
  });
});

describe('where the next meeting stands', () => {
  it('says which meeting is open and whether it has started', async () => {
    apiHasAgenda([{ id: TOPIC_A, text: 'Launch retro' }]);

    expect(await checkMeetingState(WORKSPACE_ID, ONE_ON_ONE_ID)).toEqual({
      meetingId: MEETING_ID,
      state: 'PREPARING',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('says none is open, and nothing at all when it cannot be read', async () => {
    server.use(
      http.get(`${MEETINGS}/next`, () =>
        HttpResponse.json({
          meeting: null,
          carried: [],
          templateQuestions: [],
          carriedFromSkipped: null,
          carriedTopics: [],
          templateName: 'Weekly check-in',
        }),
      ),
    );
    expect(await checkMeetingState(WORKSPACE_ID, ONE_ON_ONE_ID)).toEqual({
      meetingId: null,
      state: null,
    });

    server.use(
      http.get(`${MEETINGS}/next`, () => refusal('ONE_ON_ONE_NOT_FOUND', 404)),
    );
    expect(await checkMeetingState(WORKSPACE_ID, ONE_ON_ONE_ID)).toBeNull();
  });
});
