import 'server-only';
import { ApiError } from '@repo/api';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { readCurrentMembership } from '@/lib/session/session.service';

/**
 * One more page, for a list scrolling past the end of what it has. The Workspace comes from the
 * session, so nothing the browser sends can name somebody else's. `null` means it could not be
 * read, which the list says in a sentence with a way to try again.
 */
export async function readNextPageAsMember<Page>(
  read: (membership: CurrentMembership) => Promise<Page>,
): Promise<Page | null> {
  const membership = await readCurrentMembership();
  if (!membership) {
    redirect(ROUTES.signIn);
  }
  try {
    return await read(membership);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}

const CursorInput = z.object({ cursor: z.string().min(1) });

/** The same, for a list whose browser sends only where it got to, which is checked here. */
export async function readPageAfterCursor<Page>(
  input: unknown,
  read: (membership: CurrentMembership, cursor: string) => Promise<Page>,
): Promise<Page | null> {
  const parsed = CursorInput.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  return readNextPageAsMember((membership) =>
    read(membership, parsed.data.cursor),
  );
}
