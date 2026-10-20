/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const WORKSPACE_GOAL_ID = '0199a0f0-0000-7000-8000-000000000007';
const WORKSPACE_GOALS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`;
const HIDE = `${WORKSPACE_GOALS}/${WORKSPACE_GOAL_ID}/hide`;
const SHOW = `${WORKSPACE_GOALS}/${WORKSPACE_GOAL_ID}/show`;

const revalidatePath = vi.hoisted(() => vi.fn());

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: async () => ({
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'ADMIN',
    },
  }),
}));

const { addWorkspaceGoal, hideWorkspaceGoal, showWorkspaceGoal } = await import(
  './workspace-goal-actions.service'
);

function apiRefusesWith(url: string, code: string, status: number) {
  server.use(
    http.post(url, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('adding a Workspace Goal from Settings', () => {
  it('sends the tidied name and description, as the person, and draws the page again', async () => {
    const seen: { cookie: string | null; body: unknown }[] = [];
    server.use(
      http.post(WORKSPACE_GOALS, async ({ request }) => {
        seen.push({
          cookie: request.headers.get('cookie'),
          body: await request.json(),
        });
        return HttpResponse.json({ id: WORKSPACE_GOAL_ID }, { status: 201 });
      }),
    );

    expect(
      await addWorkspaceGoal(WORKSPACE_ID, {
        name: ' #ownership ',
        description: ' We finish what we start. ',
      }),
    ).toEqual({ ok: true });
    expect(seen[0]?.cookie).toContain('thrive.session_token=abc');
    expect(seen[0]?.body).toEqual({
      name: 'ownership',
      description: 'We finish what we start.',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/settings/workspace-goals');
  });

  it('sends no description when none was written', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(WORKSPACE_GOALS, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ id: WORKSPACE_GOAL_ID }, { status: 201 });
      }),
    );

    await addWorkspaceGoal(WORKSPACE_ID, {
      name: 'ownership',
      description: '',
    });

    expect(bodies[0]).toEqual({ name: 'ownership' });
  });

  it('refuses a name with a space without asking the API', async () => {
    expect(
      await addWorkspaceGoal(WORKSPACE_ID, {
        name: 'ship it',
        description: '',
      }),
    ).toEqual({
      ok: false,
      field: 'name',
      message: 'Use - instead of spaces.',
    });
  });

  it('says under the name when it is already taken', async () => {
    apiRefusesWith(WORKSPACE_GOALS, 'WORKSPACE_GOAL_NAME_TAKEN', 409);

    expect(
      await addWorkspaceGoal(WORKSPACE_ID, {
        name: 'Ownership',
        description: '',
      }),
    ).toEqual({
      ok: false,
      field: 'name',
      message:
        'This Workspace already has that name, or had it and hid it. Show the hidden one again instead.',
    });
  });

  it('says over the form when the person is not an Admin', async () => {
    apiRefusesWith(
      WORKSPACE_GOALS,
      'NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS',
      403,
    );

    expect(
      await addWorkspaceGoal(WORKSPACE_ID, {
        name: 'ownership',
        description: '',
      }),
    ).toEqual({
      ok: false,
      field: 'form',
      message: 'Only Admins can add Workspace Goals.',
    });
  });
});

describe('hiding and showing a Workspace Goal from Settings', () => {
  it('hides it, as the person, and draws the page again', async () => {
    const cookies: (string | null)[] = [];
    server.use(
      http.post(HIDE, ({ request }) => {
        cookies.push(request.headers.get('cookie'));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect(await hideWorkspaceGoal(WORKSPACE_ID, WORKSPACE_GOAL_ID)).toEqual({
      ok: true,
    });
    expect(cookies[0]).toContain('thrive.session_token=abc');
    expect(revalidatePath).toHaveBeenCalledWith('/settings/workspace-goals');
  });

  it('shows it again', async () => {
    server.use(http.post(SHOW, () => new HttpResponse(null, { status: 204 })));

    expect(await showWorkspaceGoal(WORKSPACE_ID, WORKSPACE_GOAL_ID)).toEqual({
      ok: true,
    });
  });

  it('says why when it was already hidden', async () => {
    apiRefusesWith(HIDE, 'WORKSPACE_GOAL_ALREADY_HIDDEN', 409);

    expect(await hideWorkspaceGoal(WORKSPACE_ID, WORKSPACE_GOAL_ID)).toEqual({
      ok: false,
      message: 'It was already hidden.',
    });
  });

  it('refuses an id that is not one, without asking the API', async () => {
    expect(await showWorkspaceGoal(WORKSPACE_ID, 'not-an-id')).toEqual({
      ok: false,
      message: "We couldn't show that Workspace Goal. Please try again.",
    });
  });
});
