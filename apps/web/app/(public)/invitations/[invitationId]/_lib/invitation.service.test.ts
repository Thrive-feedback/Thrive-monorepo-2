/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));

const { readInvitation } = await import('./invitation.service');

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const INVITATION = `${TEST_API_BASE_URL}/v1/invitations/${INVITATION_ID}`;

describe('reading an Invitation from its link', () => {
  it('answers it as the page shows it', async () => {
    server.use(
      http.get(INVITATION, () =>
        HttpResponse.json({
          workspaceName: 'Acme',
          inviterName: 'Ann Lee',
          invitedEmailMasked: 's•••@acme.co',
          status: 'PENDING',
        }),
      ),
    );

    expect(await readInvitation(INVITATION_ID)).toEqual({
      invitationId: INVITATION_ID,
      workspaceName: 'Acme',
      inviterName: 'Ann Lee',
      invitedEmailMasked: 's•••@acme.co',
      status: 'PENDING',
    });
  });

  it('answers no inviter name when the API leaves it out', async () => {
    server.use(
      http.get(INVITATION, () =>
        HttpResponse.json({
          workspaceName: 'Acme',
          invitedEmailMasked: 's•••@acme.co',
          status: 'EXPIRED',
        }),
      ),
    );

    expect((await readInvitation(INVITATION_ID))?.inviterName).toBeNull();
  });

  it('answers null for an id no Invitation has', async () => {
    server.use(
      http.get(INVITATION, () =>
        HttpResponse.json(
          {
            error: {
              code: 'INVITATION_NOT_FOUND',
              message: 'No Invitation has this id.',
              correlationId: 'c-1',
            },
          },
          { status: 404 },
        ),
      ),
    );

    expect(await readInvitation(INVITATION_ID)).toBeNull();
  });
});
