import { toPersonalItem } from '@/app/(signed-in)/(sidebar)/_lib/personal-item.util';
import { toAskOnPostcard } from '@/app/(signed-in)/(sidebar)/_lib/read-postcard.util';
import { toHomeFeedPerson } from '@/lib/feedback/home-feed-item.util';
import type {
  PendingAskOnTheWire,
  ProfileItemOnTheWire,
  ProfileItemsPage,
  ProfileListItem,
  ProfilePendingAsk,
} from './profile-item.type';

function toProfilePendingAsk(item: PendingAskOnTheWire): ProfilePendingAsk {
  return {
    kind: item.kind,
    id: item.id,
    message: item.message,
    messageTags: item.tags,
    requester: toHomeFeedPerson(item.requester),
    asked: toHomeFeedPerson(item.asked),
    askedAt: item.createdAt,
    card: {
      kind: 'asked',
      ask: toAskOnPostcard(item),
      messageTags: item.tags,
      sentOn: item.createdAt,
    },
  };
}

/** One thing on a Profile, as the API sends it, or `null` when it cannot be drawn. */
function toProfileListItem(item: ProfileItemOnTheWire): ProfileListItem | null {
  if (item.kind === 'ASK') {
    return toProfilePendingAsk(item);
  }
  const drawn = toPersonalItem(item);
  // The wire holds no request on a Profile; only Received does. Its card would not be drawn here.
  return drawn?.kind === 'REQUEST' ? null : drawn;
}

/** One page of a Profile's list as the API sends it, leaving out what cannot be drawn. */
export function toProfileItemsPage(page: {
  readonly readerAccountId: string;
  readonly items: readonly ProfileItemOnTheWire[];
  readonly nextCursor: string | null;
}): ProfileItemsPage {
  return {
    readerAccountId: page.readerAccountId,
    items: page.items.flatMap((item) => toProfileListItem(item) ?? []),
    nextCursor: page.nextCursor,
  };
}
