/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { POSTCARD_TEMPLATES } from '@/components/organisms/postcard-dialog/postcard-template.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readHomePostcard } = await import('./home-postcard.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const READER = '0199a0f0-0000-7000-8000-00000000000a';
const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const FIRST_ANSWER = '0199a0f0-0000-7000-8000-0000000000d1';
const SECOND_ANSWER = '0199a0f0-0000-7000-8000-0000000000d2';
const SENT_ON = '2026-10-31T03:00:00.000Z';

const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as CurrentMembership;

const NO_TAGS = { workspaceGoals: [], mentions: [] };

const person = (accountId: string, name: string | null, status = 'ACTIVE') => ({
  accountId,
  name,
  photoUrl: null,
  status,
});

const LOOK = {
  templateKey: 'system/postcard_template_2',
  tone: 'sage',
  textStyle: { font: 'classic', sizeStep: 3, align: 'center', ink: 'navy' },
  stickers: [],
  stampKey: 'system/stamp-02-ocean',
};

const OFFERED = {
  readerAccountId: READER,
  id: FIRST_ANSWER,
  origin: 'OFFERED',
  feedbackRequestId: null,
  giver: person(BEN, 'Ben Carter'),
  receivers: [person(CARA, 'Cara Diaz')],
  message: 'You kept the room with you.',
  postcard: LOOK,
  tags: NO_TAGS,
  createdAt: SENT_ON,
  request: null,
};

const answerBy = (id: string, accountId: string, name: string) => ({
  id,
  giver: person(accountId, name),
  message: `Written by ${name}`,
  tags: NO_TAGS,
  postcard: null,
  answeredAt: SENT_ON,
});

const REQUESTED = {
  ...OFFERED,
  id: SECOND_ANSWER,
  origin: 'REQUESTED',
  postcard: null,
  request: {
    message: 'How clear was the plan?',
    tags: NO_TAGS,
    requester: person(CARA, 'Cara Diaz'),
    postcard: LOOK,
    answers: [
      answerBy(FIRST_ANSWER, BEN, 'Ben Carter'),
      answerBy(SECOND_ANSWER, READER, 'Ann Lee'),
    ],
  },
};

function theApiAnswers(body: unknown, init?: ResponseInit) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback/:feedbackId`,
      () => HttpResponse.json(body as object, init),
    ),
  );
}

describe('readHomePostcard', () => {
  it('reads Feedback given unasked as the card it was written on', async () => {
    theApiAnswers(OFFERED);

    const postcard = await readHomePostcard(MEMBERSHIP, FIRST_ANSWER);

    expect(postcard?.title).toBe('Feedback from Ben Carter');
    expect(postcard?.card).toMatchObject({
      kind: 'give',
      templateKey: LOOK.templateKey,
      stampKey: LOOK.stampKey,
      message: OFFERED.message,
      sentOn: SENT_ON,
    });
  });

  it('calls what the reader gave theirs', async () => {
    theApiAnswers({ ...OFFERED, giver: person(READER, 'Ann Lee') });

    const postcard = await readHomePostcard(MEMBERSHIP, FIRST_ANSWER);

    expect(postcard?.title).toBe('Your Feedback');
  });

  it('draws what was not written on a postcard on a plain one', async () => {
    theApiAnswers({ ...OFFERED, postcard: null });

    const postcard = await readHomePostcard(MEMBERSHIP, FIRST_ANSWER);

    expect(postcard?.card).toMatchObject({
      templateKey: POSTCARD_TEMPLATES[0].key,
      tone: 'cream',
      textStyle: DEFAULT_TEXT_STYLE,
      stickers: [],
      stampKey: null,
    });
  });

  it('reads an answer on its request, opened at the answer pressed', async () => {
    theApiAnswers(REQUESTED);

    const postcard = await readHomePostcard(MEMBERSHIP, SECOND_ANSWER);

    expect(postcard?.title).toBe('Feedback for Cara Diaz');
    expect(postcard?.answerIndex).toBe(1);
    expect(postcard?.card).toMatchObject({
      kind: 'ask',
      ask: {
        requester: { name: 'Cara Diaz' },
        message: 'How clear was the plan?',
        templateKey: LOOK.templateKey,
      },
      messageTags: NO_TEXT_TAGS,
    });
  });

  it('sets an answer as its Giver chose, and plainly when they did not', async () => {
    const chosen = {
      textStyle: {
        font: 'signature',
        sizeStep: 1,
        align: 'right',
        ink: 'navy',
      },
      stickers: [],
    };
    theApiAnswers({
      ...REQUESTED,
      request: {
        ...REQUESTED.request,
        answers: [
          {
            ...answerBy(FIRST_ANSWER, BEN, 'Ben Carter'),
            postcard: chosen,
          },
          answerBy(SECOND_ANSWER, READER, 'Ann Lee'),
        ],
      },
    });

    const postcard = await readHomePostcard(MEMBERSHIP, SECOND_ANSWER);

    expect(postcard?.card).toMatchObject({
      answers: [
        { textStyle: chosen.textStyle },
        { textStyle: DEFAULT_TEXT_STYLE },
      ],
    });
  });

  it('keeps what the question and each answer were bound to apart', async () => {
    const onTheQuestion = {
      workspaceGoals: [{ name: 'Ownership' }],
      mentions: [],
    };
    const onTheAnswer = {
      workspaceGoals: [],
      mentions: [{ slug: 'ann.lee', displayName: 'Ann' }],
    };
    theApiAnswers({
      ...REQUESTED,
      tags: { workspaceGoals: [], mentions: [] },
      request: {
        ...REQUESTED.request,
        tags: onTheQuestion,
        answers: [
          {
            ...answerBy(FIRST_ANSWER, BEN, 'Ben Carter'),
            tags: onTheAnswer,
          },
        ],
      },
    });

    const postcard = await readHomePostcard(MEMBERSHIP, FIRST_ANSWER);

    expect(postcard?.card).toMatchObject({
      messageTags: onTheQuestion,
      answers: [{ messageTags: onTheAnswer }],
    });
  });

  it('says "for you" to the person who asked', async () => {
    theApiAnswers({
      ...REQUESTED,
      request: { ...REQUESTED.request, requester: person(READER, 'Ann Lee') },
    });

    const postcard = await readHomePostcard(MEMBERSHIP, SECOND_ANSWER);

    expect(postcard?.title).toBe('Feedback for you');
  });

  it('calls somebody with no name yet a teammate, and keeps who was Deactivated', async () => {
    theApiAnswers({
      ...OFFERED,
      giver: person(BEN, null),
      receivers: [person(CARA, 'Cara Diaz', 'DEACTIVATED')],
    });

    const postcard = await readHomePostcard(MEMBERSHIP, FIRST_ANSWER);

    expect(postcard?.title).toBe('Feedback from a teammate');
    expect(postcard?.card).toMatchObject({
      giver: { name: 'A teammate' },
      receivers: [{ name: 'Cara Diaz', inactive: true }],
    });
  });

  it('draws a request not written on a postcard on a plain one', async () => {
    theApiAnswers({
      ...REQUESTED,
      request: { ...REQUESTED.request, postcard: null },
    });

    const postcard = await readHomePostcard(MEMBERSHIP, SECOND_ANSWER);

    expect(postcard?.card).toMatchObject({
      ask: {
        templateKey: POSTCARD_TEMPLATES[0].key,
        tone: 'cream',
        stampKey: null,
      },
    });
  });

  it('answers nothing for what the reader may not open', async () => {
    theApiAnswers({ code: 'FEEDBACK_NOT_FOUND' }, { status: 404 });

    expect(await readHomePostcard(MEMBERSHIP, FIRST_ANSWER)).toBeNull();
  });

  it('does not hide a failure as not found', async () => {
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    await expect(readHomePostcard(MEMBERSHIP, FIRST_ANSWER)).rejects.toThrow();
  });
});
