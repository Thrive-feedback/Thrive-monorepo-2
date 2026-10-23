'use server';

import { ApiError, unwrap } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { providerForSegment } from './chat-providers.constant';

/** What to say when the API refused to start an install, by its error code. */
const BEGIN_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_MANAGE_INTEGRATIONS:
    'Only Admins can connect a chat tool to this workspace.',
};

const COULD_NOT_BEGIN =
  "We couldn't reach that chat tool. Please try again in a moment.";

/** What to say when the API refused the channel, by its error code. */
const CHANNEL_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_MANAGE_INTEGRATIONS:
    'Only Admins can choose the channel this workspace posts in.',
  INSTALL_STATE_INVALID:
    'This took too long, so nothing was connected. Press Connect to start again.',
  CHANNEL_NOT_OFFERED:
    'That channel is no longer there. Start again to see the current list.',
  CHANNEL_UNREACHABLE:
    "Thrive couldn't post in that channel, so nothing was connected. Check the bot can see it and post in it, then try another channel.",
  INSTALL_REFUSED:
    'That chat tool refused the connection. Press Connect to start again.',
};

const COULD_NOT_CHOOSE =
  "We couldn't connect that channel. Please try again in a moment.";

/** The id is one of the channels the tool itself offered, never typed in. */
const ChannelId = z.string().min(1).max(64);

const Installation = z.string().min(1).max(2048);

export type IntegrationActionResult = {
  readonly ok: false;
  readonly message: string;
};

/**
 * Starts connecting a chat tool: asks the API where to send the Admin, and sends them there.
 *
 * The Workspace is the one the session belongs to, never one the browser names, and the API
 * checks they may connect it. The address the browser goes to carries a signed value that the
 * tool hands back, which is how Thrive recognises its own install on the way in.
 *
 * Answers only when it fails — on success the person is already on their way to the tool.
 */
export async function beginInstall(
  segment: string,
): Promise<IntegrationActionResult> {
  const provider = providerForSegment(segment);
  if (!provider) {
    return { ok: false, message: COULD_NOT_BEGIN };
  }
  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  let authorizeUrl: string;
  try {
    authorizeUrl = unwrap(
      await apiClient().POST(
        '/v1/workspaces/{workspaceId}/integrations/{provider}/install',
        {
          params: {
            path: {
              workspaceId: membership.workspace.id,
              provider: provider.value,
            },
            header: { cookie },
          },
        },
      ),
    ).authorizeUrl;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'NOT_SIGNED_IN') {
      redirect(ROUTES.signIn);
    }
    return { ok: false, message: BEGIN_ERRORS[error.code] ?? COULD_NOT_BEGIN };
  }
  // Outside the catch: `redirect` works by throwing, so catching around it would swallow it.
  redirect(authorizeUrl);
}

/**
 * Connects the channel an Admin chose, which the API only stores once a message has actually
 * arrived in it — so a refusal here means nothing was connected, and says so.
 *
 * `installation` is Thrive's own signed statement of which space the tool said was authorised,
 * handed to the browser one request ago and carried back. Which space it is never comes from
 * this call's input.
 *
 * Answers only when it fails; on success it lands back on Settings → Workspace, where the
 * Connection is now listed.
 */
export async function chooseChannel(
  segment: string,
  installation: string,
  channelId: string,
): Promise<IntegrationActionResult> {
  const provider = providerForSegment(segment);
  const input = z
    .object({ installation: Installation, channelId: ChannelId })
    .safeParse({ installation, channelId });
  if (!provider || !input.success) {
    return { ok: false, message: COULD_NOT_CHOOSE };
  }
  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().PUT(
      '/v1/workspaces/{workspaceId}/integrations/{provider}/channel',
      {
        params: {
          path: {
            workspaceId: membership.workspace.id,
            provider: provider.value,
          },
          header: { cookie },
        },
        body: {
          installation: input.data.installation,
          channelId: input.data.channelId,
        },
      },
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'NOT_SIGNED_IN') {
      redirect(ROUTES.signIn);
    }
    return {
      ok: false,
      message: CHANNEL_ERRORS[error.code] ?? COULD_NOT_CHOOSE,
    };
  }
  revalidatePath(ROUTES.settings.workspace);
  redirect(ROUTES.settings.workspace);
}
