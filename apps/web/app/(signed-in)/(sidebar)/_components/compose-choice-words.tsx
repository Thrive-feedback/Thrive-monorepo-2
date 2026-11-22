import {
  COMPOSE_CHOICE_DESCRIPTIONS,
  COMPOSE_CHOICE_TITLES,
  COMPOSE_CHOICE_TONES,
  type ComposeChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { FEED_CARD_FILL } from '@/components/organisms/feed-card/feed-card-tone.constant';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** What every "+" needs to open and send a card. */
export type ComposeProps = {
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a postcard can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
};

export type ComposeChoiceWordsProps = {
  /** The choice, and so the card it opens. */
  card: ComposeChoice;
};

/**
 * One choice's words where "+" offers it: its dot in the colour of the card it writes, its title,
 * and what it is for.
 */
export function ComposeChoiceWords({ card }: ComposeChoiceWordsProps) {
  return (
    <>
      <span className="flex items-center gap-2 text-fg-primary text-subtitle-4">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rounded-full',
            FEED_CARD_FILL[COMPOSE_CHOICE_TONES[card]],
          )}
        />
        {COMPOSE_CHOICE_TITLES[card]}
      </span>
      <span className="text-body-3 text-fg-secondary">
        {COMPOSE_CHOICE_DESCRIPTIONS[card]}
      </span>
    </>
  );
}
