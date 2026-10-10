import 'server-only';
import { unwrap } from '@repo/api';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client.service';
import { forwardCookies } from './forward-cookies.service';

/**
 * Hands the browser the sign-in attempt's cookie and sends it to Google. With an Invitation,
 * Google sends the person back to it afterwards, rather than to where they usually land.
 */
export async function startGoogleSignIn(
  invitationId: string | null,
): Promise<never> {
  const result = await apiClient().POST('/v1/sessions/google', {
    body: invitationId === null ? {} : { invitationId },
  });
  await forwardCookies(result.response);
  redirect(unwrap(result).url);
}
