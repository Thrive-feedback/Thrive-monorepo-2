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
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirected to ${to}`);
  },
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const TEMPLATE_ID = '0199a0f0-0000-7000-8000-0000000000c1';

vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: async () => ({
    email: 'ann@acme.test',
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'MEMBER',
    },
  }),
}));

const {
  keepOneOnOneTemplate,
  removeOneOnOneTemplate,
  rewriteOneOnOneTemplate,
} = await import(
  '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_lib/one-on-one-template-actions.service'
);

const TEMPLATES = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/one-on-one-templates`;

/** Answers the route, keeping the body the API was given. */
function apiAccepts(
  method: 'post' | 'put' | 'delete',
  url: string,
  answer: () => Response,
): { body?: unknown; called: boolean } {
  const received: { body?: unknown; called: boolean } = { called: false };
  server.use(
    http[method](url, async ({ request }) => {
      received.called = true;
      const text = await request.text();
      received.body = text === '' ? undefined : JSON.parse(text);
      return answer();
    }),
  );
  return received;
}

beforeEach(() => {
  revalidatePath.mockClear();
});

describe('keeping 1:1 templates', () => {
  it('sends what was written trimmed, without blank questions, and reads the 1:1s page again', async () => {
    const received = apiAccepts('post', TEMPLATES, () =>
      HttpResponse.json({ id: TEMPLATE_ID }, { status: 201 }),
    );

    const result = await keepOneOnOneTemplate(WORKSPACE_ID, 'PERSONAL', {
      name: '  Sprint retro ',
      suggestedWhen: ' After each sprint ',
      questions: [' What slowed us? ', '   ', 'What helped?'],
    });

    expect(result).toEqual({ ok: true, id: TEMPLATE_ID });
    expect(received.body).toEqual({
      scope: 'PERSONAL',
      name: 'Sprint retro',
      suggestedWhen: 'After each sprint',
      questions: ['What slowed us?', 'What helped?'],
    });
    expect(revalidatePath).toHaveBeenCalledWith('/one-on-ones');
  });

  it('sends nothing for a template with no name or no question', async () => {
    const received = apiAccepts('post', TEMPLATES, () =>
      HttpResponse.json({ id: TEMPLATE_ID }, { status: 201 }),
    );

    const unnamed = await keepOneOnOneTemplate(WORKSPACE_ID, 'PERSONAL', {
      name: ' ',
      suggestedWhen: '',
      questions: ['Q?'],
    });
    const unasked = await keepOneOnOneTemplate(WORKSPACE_ID, 'PERSONAL', {
      name: 'Retro',
      suggestedWhen: '',
      questions: ['  '],
    });

    expect(unnamed.ok).toBe(false);
    expect(unasked.ok).toBe(false);
    expect(received.called).toBe(false);
  });

  it('sends nothing for a layer a person cannot keep in, or a question longer than a topic', async () => {
    const received = apiAccepts('post', TEMPLATES, () =>
      HttpResponse.json({ id: TEMPLATE_ID }, { status: 201 }),
    );

    const thrives = await keepOneOnOneTemplate(
      WORKSPACE_ID,
      'THRIVE' as 'PERSONAL',
      { name: 'Retro', suggestedWhen: '', questions: ['Q?'] },
    );
    const tooLong = await keepOneOnOneTemplate(WORKSPACE_ID, 'PERSONAL', {
      name: 'Retro',
      suggestedWhen: '',
      questions: ['q'.repeat(201)],
    });

    expect(thrives.ok).toBe(false);
    expect(tooLong.ok).toBe(false);
    expect(received.called).toBe(false);
  });

  it('says plainly when the name is taken in that layer', async () => {
    server.use(
      http.post(TEMPLATES, () =>
        HttpResponse.json(
          {
            error: {
              code: 'ONE_ON_ONE_TEMPLATE_NAME_TAKEN',
              message: 'nope',
              correlationId: 'correlation-1',
            },
          },
          { status: 409 },
        ),
      ),
    );

    const result = await keepOneOnOneTemplate(WORKSPACE_ID, 'WORKSPACE', {
      name: 'Team health',
      suggestedWhen: '',
      questions: ['How is the team?'],
    });

    expect(result).toEqual({
      ok: false,
      message:
        'There is already a template by that name here. Choose another name.',
      code: 'ONE_ON_ONE_TEMPLATE_NAME_TAKEN',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('rewriting and removing 1:1 templates', () => {
  it('rewrites one by its id', async () => {
    const received = apiAccepts(
      'put',
      `${TEMPLATES}/${TEMPLATE_ID}`,
      () => new HttpResponse(null, { status: 204 }),
    );

    const result = await rewriteOneOnOneTemplate(WORKSPACE_ID, TEMPLATE_ID, {
      name: 'Retro',
      suggestedWhen: '',
      questions: ['What should we stop?'],
    });

    expect(result.ok).toBe(true);
    expect(received.body).toEqual({
      name: 'Retro',
      suggestedWhen: '',
      questions: ['What should we stop?'],
    });
  });

  it('removes one by its id, and sends nothing for an id that is not one', async () => {
    const received = apiAccepts(
      'delete',
      `${TEMPLATES}/${TEMPLATE_ID}`,
      () => new HttpResponse(null, { status: 204 }),
    );

    expect((await removeOneOnOneTemplate(WORKSPACE_ID, 'retro')).ok).toBe(
      false,
    );
    expect(received.called).toBe(false);
    expect((await removeOneOnOneTemplate(WORKSPACE_ID, TEMPLATE_ID)).ok).toBe(
      true,
    );
    expect(received.called).toBe(true);
  });
});
