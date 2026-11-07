import { CardsEmpty } from '@/app/(signed-in)/(sidebar)/_components/cards-empty';
import type { HomeShow } from '@/lib/routes.constant';

/**
 * What each choice says when it holds nothing, in the words of the design (`FB-4-S1`), each pointing
 * at the composer above it, which is where a card is started.
 */
const EMPTY: Readonly<
  Record<HomeShow, { title: string; description: string }>
> = {
  all: {
    title: 'No Feedback to show yet',
    description:
      'Feedback shared with you or with the whole Workspace will show up here. Start one from the box above.',
  },
  everyone: {
    title: 'Nothing has been shared with the whole Workspace yet.',
    description:
      'Feedback anyone shares with Everyone will show up here. Start one from the box above.',
  },
  shared: {
    title: 'Nothing has been shared with you yet.',
    description: 'Feedback a teammate shares with you will show up here.',
  },
};

export type FeedEmptyProps = {
  /** What the feed was asked to show. */
  show: HomeShow;
};

/**
 * Home's feed with nothing to show, drawn as every empty list is, in the words of the choice that
 * was made. It offers no button: the composer right above already offers every card.
 */
export function FeedEmpty({ show }: FeedEmptyProps) {
  return <CardsEmpty art="every" {...EMPTY[show]} />;
}
