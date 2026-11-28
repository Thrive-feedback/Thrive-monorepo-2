import { ApiError } from '@repo/api';

/** A few screens, so the next page is read before anybody reaches the end of this one. */
export const PERSONAL_ITEMS_PAGE_SIZE = 20;

/** The first page of a Member's own list or a Profile's, or `null` when the API could not give it. */
export async function readFirstPage<Page>(
  read: () => Promise<Page>,
): Promise<Page | null> {
  try {
    return await read();
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}
