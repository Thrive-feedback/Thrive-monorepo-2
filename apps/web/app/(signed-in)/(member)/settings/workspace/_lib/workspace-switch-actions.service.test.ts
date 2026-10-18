/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const { createAnotherWorkspace, switchWorkspace } = await import(
  './workspace-switch-actions.service'
);

const GLOBEX_ID = '0199a0f0-0000-7000-8000-0000000000bb';
const SWITCH = `${TEST_API_BASE_URL}/v1/workspaces/${GLOBEX_ID}/switch`;
const WORKSPACES = `${TEST_API_BASE_URL}/v1/workspaces`;

function refusal(code: string, status: number) {
  return HttpResponse.json(
    { error: { code, message: 'Refused.', correlationId: 'c-1' } },
    { status },
  );
}

function named(workspaceName: string): FormData {
  const formData = new FormData();
  formData.set('workspaceName', workspaceName);
  return formData;
}

describe('switching Workspace', () => {
  it("switches with the browser's cookie, then stays on Settings → Workspace, drawn for the new one", async () => {
    const seen: Request[] = [];
    server.use(
      http.post(SWITCH, ({ request }) => {
        seen.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(switchWorkspace(GLOBEX_ID)).rejects.toThrow(
      'redirect:/settings/workspace',
    );
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('says so when the person is no longer in that Workspace', async () => {
    server.use(http.post(SWITCH, () => refusal('WORKSPACE_NOT_FOUND', 404)));

    expect(await switchWorkspace(GLOBEX_ID)).toEqual({
      ok: false,
      message: "You're no longer in that Workspace.",
    });
  });

  it('sends nothing for an id that is not a Workspace id', async () => {
    expect(await switchWorkspace('../sessions')).toEqual({
      ok: false,
      message: "We couldn't switch Workspace. Please try again.",
    });
  });
});

describe('creating another Workspace from the switcher', () => {
  it('creates it, then stays on Settings → Workspace, drawn for the new one', async () => {
    server.use(
      http.post(WORKSPACES, () =>
        HttpResponse.json({ id: GLOBEX_ID }, { status: 201 }),
      ),
    );

    await expect(createAnotherWorkspace({}, named('Globex'))).rejects.toThrow(
      'redirect:/settings/workspace',
    );
  });

  it('puts a refused name beside its field', async () => {
    server.use(
      http.post(WORKSPACES, () => refusal('WORKSPACE_NAME_EMPTY', 400)),
    );

    expect(await createAnotherWorkspace({}, named(' '))).toEqual({
      fieldErrors: { workspaceName: 'Enter a name for your Workspace.' },
    });
  });
});
