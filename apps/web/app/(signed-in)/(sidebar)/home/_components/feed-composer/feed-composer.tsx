import { useMemo } from 'react';
import {
  COMPOSE_CHOICE_OUTLINES,
  COMPOSE_CHOICE_TITLES,
  COMPOSE_CHOICES,
  type ComposeChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Button } from '@/components/atoms/button';
import { AutocompleteInput } from '@/components/molecules/autocomplete-input';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { feedbackTagTriggers } from '@/components/organisms/feedback-tag-triggers.util';
import { cutFieldToMessageLength } from '@/lib/feedback/message-length.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  FEED_COMPOSER_CHOICES,
  FEED_COMPOSER_SURFACE,
} from './feed-composer.constant';

export type FeedComposerProps = {
  /** Who is writing. */
  writer: { readonly name: string; readonly photoUrl: string | null };
  /** Who `@` offers. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  message: string;
  ref?: React.Ref<HTMLInputElement>;
  onMessageChange: (message: string) => void;
  /** Ask, Give or Kudos was pressed: what is typed goes on that card. */
  onChoose: (choice: ComposeChoice) => void;
};

/**
 * The first line of something to write, at the head of the feed, completing `@` and `#` as they
 * are typed. It sends nothing itself: pressing what it is to be carries the words onto a postcard,
 * where the rest is decided, so Enter does nothing here.
 */
export function FeedComposer({
  writer,
  teammates,
  workspaceGoals,
  message,
  ref,
  onMessageChange,
  onChoose,
}: FeedComposerProps) {
  const triggers = useMemo(
    () => feedbackTagTriggers(workspaceGoals, teammates),
    [workspaceGoals, teammates],
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onMessageChange(cutFieldToMessageLength(event.currentTarget));
  }

  return (
    <section aria-label="Write something" className={FEED_COMPOSER_SURFACE}>
      <div className="flex items-end gap-3">
        <PhotoAvatar name={writer.name} photoUrl={writer.photoUrl} />
        <div className="min-w-0 flex-1">
          <AutocompleteInput
            ref={ref}
            value={message}
            triggers={triggers}
            className="placeholder:text-fg-secondary"
            aria-label="What you want to say"
            placeholder="Share advice or ask a teammate for feedback..."
            onChange={handleChange}
          />
        </div>
      </div>
      <div className={FEED_COMPOSER_CHOICES}>
        {COMPOSE_CHOICES.map((choice) => (
          <Button
            key={choice}
            variant={COMPOSE_CHOICE_OUTLINES[choice]}
            onClick={() => onChoose(choice)}
          >
            {COMPOSE_CHOICE_TITLES[choice]}
          </Button>
        ))}
      </div>
    </section>
  );
}
