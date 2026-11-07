import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { ChatProvider } from '@/lib/chat/chat-providers.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { AuthorizedInstall } from './connection.type';

/** What to say when the tool would not finish the install, by the API's error code. */
const COMPLETE_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_MANAGE_INTEGRATIONS:
    'Only Admins can connect a chat tool to this workspace.',
  INSTALL_STATE_INVALID:
    'This install did not start here, or it took too long. Nothing was connected — start again from Settings.',
  INSTALL_REFUSED:
    'That chat tool refused the install. Nothing was connected — start again from Settings.',
};

const COULD_NOT_COMPLETE =
  "We couldn't finish connecting that chat tool. Nothing was connected — start again from Settings.";

export type CompletedInstall =
  | { readonly ok: true; readonly install: AuthorizedInstall }
  | { readonly ok: false; readonly message: string };

/**
 * Reads back what the chat tool says the Admin authorised, and the channels Thrive may post in.
 *
 * A `POST` in a read's place, which is the exception `FE_09` R4 is worth naming: it **stores
 * nothing in Thrive**, deliberately — a Connection exists only once a message has reached the
 * channel somebody chooses, one request later. What it does spend is the tool's single-use code,
 * which is why the page that calls it renders the channel list rather than redirecting, and why
 * the address is cleaned afterwards so the code cannot be replayed from history.
 */
export async function completeInstall(
  membership: CurrentMembership,
  provider: ChatProvider,
  code: string,
  state: string,
): Promise<CompletedInstall> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const completed = unwrap(
      await apiClient().POST(
        '/v1/workspaces/{workspaceId}/integrations/{provider}/complete',
        {
          params: {
            path: { workspaceId: membership.workspace.id, provider },
            header: { cookie },
          },
          body: { code, state },
        },
      ),
    );
    return {
      ok: true,
      install: {
        spaceName: completed.externalWorkspaceName,
        channels: completed.channels.map((channel) => ({
          id: channel.id,
          name: channel.name,
        })),
        installation: completed.installation,
      },
    };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return {
      ok: false,
      message: COMPLETE_ERRORS[error.code] ?? COULD_NOT_COMPLETE,
    };
  }
}
