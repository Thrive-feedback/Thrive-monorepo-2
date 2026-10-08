/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

const requestHeaders = new Headers();

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const { createWorkspace } = await import('./workspace-actions.service');

const WORKSPACES = `${TEST_API_BASE_URL}/v1/workspaces`;

function filledIn(workspaceName: string, teamSize?: string): FormData {
  const formData = new FormData();
  formData.set('workspaceName', workspaceName);
  if (teamSize !== undefined) {
    formData.set('teamSize', teamSize);
  }
  return formData;
}

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.post(WORKSPACES, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

function apiCreates(seen: Request[] = []) {
  server.use(
    http.post(WORKSPACES, ({ request }) => {
      seen.push(request);
      return HttpResponse.json(
        { id: '0199a0f0-0000-7000-8000-0000000000aa' },
        { status: 201 },
      );
    }),
  );
}

describe('creating the Workspace', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it("sends the name and team size with the browser's cookie, then moves on to Invite your teammates", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    apiCreates(seen);

    await expect(
      createWorkspace({}, filledIn('Acme Corp', 'FROM_11_TO_50')),
    ).rejects.toThrow('redirect:/register/invite-teammates');
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
    expect(await seen[0]?.json()).toEqual({
      name: 'Acme Corp',
      teamSize: 'FROM_11_TO_50',
    });
  });

  it('sends no team size when none was picked', async () => {
    const seen: Request[] = [];
    apiCreates(seen);

    await expect(createWorkspace({}, filledIn('Acme Corp'))).rejects.toThrow(
      'redirect:/register/invite-teammates',
    );
    expect(await seen[0]?.json()).toEqual({
      name: 'Acme Corp',
      teamSize: null,
    });
  });

  it('puts a refused name beside its field', async () => {
    apiRefusesWith('WORKSPACE_NAME_TOO_LONG', 400);

    expect(await createWorkspace({}, filledIn('A'.repeat(101)))).toEqual({
      fieldErrors: { workspaceName: 'Use 100 characters or fewer.' },
    });
  });

  it('goes home when the Workspace was already created, from another tab or a second click', async () => {
    apiRefusesWith('ALREADY_IN_A_WORKSPACE', 409);

    await expect(createWorkspace({}, filledIn('Acme Corp'))).rejects.toThrow(
      'redirect:/home',
    );
  });

  it('sends someone who has not introduced themselves to Introduce yourself', async () => {
    apiRefusesWith('PROFILE_REQUIRED', 409);

    await expect(createWorkspace({}, filledIn('Acme Corp'))).rejects.toThrow(
      'redirect:/register/introduce-yourself',
    );
  });

  it('sends someone whose session ended to sign in again', async () => {
    apiRefusesWith('NOT_SIGNED_IN', 401);

    await expect(createWorkspace({}, filledIn('Acme Corp'))).rejects.toThrow(
      'redirect:/signin',
    );
  });

  it('asks to try again when the API fails for any other reason', async () => {
    apiRefusesWith('INTERNAL_ERROR', 500);

    expect(await createWorkspace({}, filledIn('Acme Corp'))).toEqual({
      formError: "We couldn't create your Workspace. Please try again.",
    });
  });

  it('asks to try again when the form arrives with a team size nobody can pick', async () => {
    expect(
      await createWorkspace({}, filledIn('Acme Corp', 'HUNDREDS')),
    ).toEqual({
      formError: "We couldn't create your Workspace. Please try again.",
    });
  });
});
