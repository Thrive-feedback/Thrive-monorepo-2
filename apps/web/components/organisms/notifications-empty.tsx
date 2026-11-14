import { CardsEmpty } from './cards-empty';

/**
 * The bell's panel with nothing in it, drawn the way every empty place for cards is, waiting for
 * every kind of card a line can lead to.
 */
export function NotificationsEmpty() {
  return (
    <CardsEmpty
      art="every"
      title="Nothing yet"
      // A paragraph, not a heading: it sits inside the bell's menu, which may hold no heading.
      titleAs="p"
      description="When somebody asks you for feedback, answers you, writes to you, or gives you kudos, it shows up here."
    />
  );
}
