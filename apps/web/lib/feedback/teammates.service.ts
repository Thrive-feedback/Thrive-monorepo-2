import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/**
 * A Workspace holds 20–50 people, so one page of the largest size covers it.
 *
 * Known limit, kept on purpose for now: everything that lists the Workspace reads it whole, once,
 * and searches and pages it in the browser — the Teammates page and the `@` picker alike. Past 100
 * Members, everyone after the hundredth is never read, so they can be neither found nor written to,
 * and the read itself grows with the Workspace on every page that draws the sidebar. The members
 * API pages (`page`, `pageSize`) but cannot search, so paging it alone would leave search finding
 * only the page on screen. When Workspaces outgrow this, the API needs a search parameter (name,
 * email, @handle) and these screens need to ask it for one page of matches at a time.
 */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * Everyone active in the person's Workspace, themselves included, oldest Member first. Not cached
 * across requests — `cache` only shares one call between the parts of one page that need it: who is
 * in changes the moment someone accepts an Invitation, and one person's Workspace must never be
 * served to another.
 */
export const readWorkspaceMembers = cache(
  async (membership: CurrentMembership): Promise<Teammate[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const members = await apiClient().GET(
      '/v1/workspaces/{workspaceId}/members',
      {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: ONE_PAGE,
        },
        cache: 'no-store',
      },
    );

    return unwrap(members).items.map((member) => ({
      accountId: member.accountId,
      name: member.fullName ?? member.email,
      email: member.email,
      photoUrl: member.photoUrl,
      slug: member.slug,
      displayName: member.displayName,
    }));
  },
);

/**
 * Everyone in the person's Workspace but themselves: who a card can be for, and who `@` offers.
 * Themselves is found by email, because that is what the session carries. It shares
 * `readWorkspaceMembers`' one read with anything else on the page that lists the Workspace.
 */
export const readTeammates = cache(
  async (
    membership: CurrentMembership,
    ownEmail: string,
  ): Promise<Teammate[]> =>
    (await readWorkspaceMembers(membership)).filter(
      (member) => member.email !== ownEmail,
    ),
);
