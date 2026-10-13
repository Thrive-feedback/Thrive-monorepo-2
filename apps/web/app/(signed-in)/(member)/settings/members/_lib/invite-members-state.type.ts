import type { components } from '@repo/api';

/** What happened to one address. */
export type InviteMemberResult = {
  readonly email: string;
  readonly outcome: components['schemas']['SendInvitationsResponseDto_Output']['results'][number]['outcome'];
};

/**
 * What inviting from Members answers. Lives apart from the action, because every export of a
 * `'use server'` file is callable from the browser.
 */
export type InviteMembersState =
  | { readonly results: readonly InviteMemberResult[] }
  | { readonly formError: string };
