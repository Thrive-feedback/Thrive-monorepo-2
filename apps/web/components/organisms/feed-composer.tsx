'use client';

import { useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { AutocompleteInput } from '@/components/molecules/autocomplete-input';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cutToMessageLength } from '@/lib/feedback/message-length.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { feedbackTagTriggers } from './feedback-tag-triggers.util';

const SURFACE =
  'flex flex-col gap-4 rounded-page border border-border-muted p-6.25';

const CHOICES = 'grid grid-cols-1 gap-2 sm:grid-cols-3';

export type FeedComposerChoice = 'ask' | 'give';

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
  /** Ask or Give was pressed: what is typed goes on that card. */
  onChoose: (choice: FeedComposerChoice) => void;
};

/**
 * The first line of something to write, at the head of the feed, completing `@` and `#` as they
 * are typed. It sends nothing itself: pressing what it is to be carries the words onto a postcard,
 * where the rest is decided, so Enter does nothing here. Kudos is drawn where it will be, and says
 * it is not ready rather than pretending to work.
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
    const field = event.currentTarget;
    onMessageChange(
      cutToMessageLength(field.value, field.selectionStart ?? undefined),
    );
  }

  return (
    <section aria-label="Write something" className={SURFACE}>
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
      <div className={CHOICES}>
        <Button variant="secondary" onClick={() => onChoose('ask')}>
          Ask for feedback
        </Button>
        <Button variant="secondary" onClick={() => onChoose('give')}>
          Give feedback
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              aria-disabled="true"
              className="aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled"
            >
              Give kudos
            </Button>
          </TooltipTrigger>
          <TooltipContent>Kudos isn't ready here yet.</TooltipContent>
        </Tooltip>
      </div>
    </section>
  );
}

/** A `FeedComposer` still loading, line for line. */
export function FeedComposerSkeleton() {
  return (
    <div className={SURFACE}>
      <div className="flex items-end gap-3">
        <Skeleton shape="circle" className="size-8 shrink-0" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <div className={CHOICES}>
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
