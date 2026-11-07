'use server';

import { ApiError, unwrap } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client.service';
import { providerForSegment } from '@/lib/chat/chat-providers.constant';
import { ROUTES } from '@/lib/routes.constant';

/** What to say when the API refused to start a link, by its error code. */
const BEGIN_ERRORS: Readonly<Record<string, string>> = {
  PROVIDER_NOT_SUPPORTED:
    'Thrive does not message people through that chat tool yet.',
};

const COULD_NOT_BEGIN =
  "We couldn't reach that chat tool. Please try again in a moment.";

/** What to say when the API refused to unlink, by its error code. */
const UNLINK_ERRORS: Readonly<Record<string, string>> = {
  NOT_LINKED:
    'That chat tool is already unlinked. Reload to see where things stand.',
};

const COULD_NOT_UNLINK =
  "We couldn't unlink that chat tool. Please try again in a moment.";

/**
 * What an action answers when it could not do what was asked. Beginning a link answers only
 * this, because a success has already navigated away to the chat tool.
 */
export type AccountLinkActionResult = {
  readonly ok: false;
  readonly message: string;
};

/** Unlinking stays on the page, so it says when it worked as well as when it did not. */
export type UnlinkResult = { readonly ok: true } | AccountLinkActionResult;

/**
 * Starts linking the person's own account in a chat tool: asks the API where to send them, and
 * sends them there.
 *
 * Who is linking comes from the session, never from this call, so nobody can start a link on
 * anybody else's behalf. The address carries a signed value bound to them and to that tool,
 * which is what stops a crafted link attaching somebody else's chat account to their Thrive
 * Account.
 *
 * Answers only when it fails — on success the person is already on their way to the tool.
 */
export async function beginAccountLink(
  segment: string,
): Promise<AccountLinkActionResult> {
  const provider = providerForSegment(segment);
  if (!provider) {
    return { ok: false, message: COULD_NOT_BEGIN };
  }
  const cookie = (await headers()).get('cookie') ?? undefined;
  let authorizeUrl: string;
  try {
    authorizeUrl = unwrap(
      await apiClient().POST('/v1/linked-accounts/mine/{provider}/link', {
        params: { path: { provider: provider.value }, header: { cookie } },
      }),
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
 * Forgets the person's link to one chat tool, which is how they stop being messaged there.
 *
 * Answers only when it fails; on success the row is drawn again offering to link.
 */
export async function unlinkAccount(segment: string): Promise<UnlinkResult> {
  const provider = providerForSegment(segment);
  if (!provider) {
    return { ok: false, message: COULD_NOT_UNLINK };
  }
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().DELETE('/v1/linked-accounts/mine/{provider}', {
      params: { path: { provider: provider.value }, header: { cookie } },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'NOT_SIGNED_IN') {
      redirect(ROUTES.signIn);
    }
    return {
      ok: false,
      message: UNLINK_ERRORS[error.code] ?? COULD_NOT_UNLINK,
    };
  }
  revalidatePath(ROUTES.settings.account);
  return { ok: true };
}
