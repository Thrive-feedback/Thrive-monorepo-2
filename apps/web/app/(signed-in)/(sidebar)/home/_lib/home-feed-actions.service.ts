'use server';

import { z } from 'zod';
import { readNextPageAsMember } from '@/app/(signed-in)/(sidebar)/_lib/read-next-page.service';
import type { HomeFeedPage } from '@/lib/feedback/home-feed-item.type';
import { HOME_SHOWS } from '@/lib/routes.constant';
import { readHomeFeed } from './home-feed.service';

const NextPage = z.object({
  show: z.enum(HOME_SHOWS),
  cursor: z.string().min(1),
});

/**
 * The next page of Home, for a list scrolling past the end of what it has. A server action because
 * the browser cannot reach the API, as the bell reads through one (design `0022` §4.3). The
 * Workspace comes from the session, so nothing the browser sends can name somebody else's.
 *
 * `null` means it could not be read, which the list says in a sentence with a way to try again.
 */
export async function readNextHomeFeedPage(
  input: unknown,
): Promise<HomeFeedPage | null> {
  const parsed = NextPage.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  return readNextPageAsMember((membership) =>
    readHomeFeed(membership, parsed.data.show, parsed.data.cursor),
  );
}

const ThroughDay = NextPage.extend({ day: z.iso.date() });

/**
 * The most pages one press of a day reads, here on the server, whatever the browser asks. Seven days
 * of a team's Home is a page or two; this is the bound for a week far busier than that.
 */
const MOST_PAGES_THROUGH_A_DAY = 5;

/**
 * Home read on from `cursor` until a whole day is in, for the ribbon's press of a day the list has
 * not reached: page after page, here rather than in the browser, because the browser sends server
 * actions one at a time and a loop there would hold up the bell and anything being sent. It stops
 * once it has read something from before `day`, at the end of Home, or at the bound, and answers it
 * all as one page.
 */
export async function readHomeFeedThroughDay(
  input: unknown,
): Promise<HomeFeedPage | null> {
  const parsed = ThroughDay.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  const { show, day } = parsed.data;
  return readNextPageAsMember(async (membership): Promise<HomeFeedPage> => {
    const first = await readHomeFeed(membership, show, parsed.data.cursor);
    const items = [...first.items];
    let cursor = first.nextCursor;
    for (
      let pages = 1;
      pages < MOST_PAGES_THROUGH_A_DAY &&
      cursor !== null &&
      !((items.at(-1)?.day ?? day) < day);
      pages++
    ) {
      const page = await readHomeFeed(membership, show, cursor);
      items.push(...page.items);
      cursor = page.nextCursor;
    }
    return {
      readerAccountId: first.readerAccountId,
      items,
      nextCursor: cursor,
    };
  });
}
