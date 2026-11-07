import 'server-only';
import { ApiError } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { ChatProvider } from '@/lib/chat/chat-providers.constant';

/** What to say when the tool would not finish the link, by the API's error code. */
const COMPLETE_ERRORS: Readonly<Record<string, string>> = {
  LINK_STATE_INVALID:
    'This link did not start here, or it took too long. Nothing was linked — start again from Settings.',
  LINK_REFUSED:
    'That chat tool refused to say which account this is. Nothing was linked — start again from Settings.',
  ACCOUNT_ALREADY_LINKED:
    'That account is already linked to a different Thrive account. Unlink it there first, or authorise a different one.',
  PROVIDER_NOT_SUPPORTED:
    'Thrive does not message people through that chat tool yet.',
};

const COULD_NOT_COMPLETE =
  "We couldn't finish linking that chat tool. Nothing was linked — start again from Settings.";

export type CompletedAccountLink =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Finishes the round trip: hands the API what the chat tool gave the browser, and the signed
 * `state` the link started with.
 *
 * A `POST` from a page rather than a form, which is the exception `FE_09` R4 is worth naming:
 * it spends the tool's single-use code, which only exists because the tool has just redirected
 * here. Who is linking is the session's, never this call's, and the `state` is checked against
 * them — without that, a crafted link would attach somebody else's chat account to this person.
 */
export async function completeAccountLink(
  provider: ChatProvider,
  code: string,
  state: string,
): Promise<CompletedAccountLink> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().POST('/v1/linked-accounts/mine/{provider}/complete', {
      params: { path: { provider }, header: { cookie } },
      body: { code, state },
    });
    return { ok: true };
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
