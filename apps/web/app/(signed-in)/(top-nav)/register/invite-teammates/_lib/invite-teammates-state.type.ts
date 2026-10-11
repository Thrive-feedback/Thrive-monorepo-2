import type { components } from '@repo/api';

/** What happened to one address, as the screen shows it. */
export type InviteResult = {
  readonly email: string;
  readonly outcome: components['schemas']['SendInvitationsResponseDto_Output']['results'][number]['outcome'];
};

/**
 * What sending the Invitations answers. Lives apart from the action, because every export of a
 * `'use server'` file is callable from the browser.
 */
export type SendInvitationsState =
  | { readonly results: readonly InviteResult[] }
  | { readonly formError: string };
