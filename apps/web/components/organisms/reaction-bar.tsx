'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn.util';
import { REACTIONS, type ReactionEmoji } from '@/lib/feedback/feed-item.type';

export type ReactionBarProps = {
  /** Who has reacted, by Reaction, before the person does anything. */
  reactions: Readonly<Partial<Record<ReactionEmoji, readonly string[]>>>;
};

/**
 * The four Reactions under a piece of Feedback, each with how many reacted. Pressing one adds or
 * takes back the person's own. Held in this component only: nothing is saved until the API has
 * Reactions, so a reload forgets it.
 */
export function ReactionBar({ reactions }: ReactionBarProps) {
  const [mine, setMine] = useState<ReadonlySet<ReactionEmoji>>(new Set());

  function toggle(emoji: ReactionEmoji) {
    setMine((current) => {
      const next = new Set(current);
      if (next.has(emoji)) {
        next.delete(emoji);
      } else {
        next.add(emoji);
      }
      return next;
    });
  }

  return (
    <ul aria-label="Reactions" className="flex flex-wrap gap-2">
      {REACTIONS.map(({ emoji, name }) => {
        const others = reactions[emoji] ?? [];
        const pressed = mine.has(emoji);
        const names = pressed ? ['You', ...others] : others;
        return (
          <li key={emoji}>
            <button
              type="button"
              aria-pressed={pressed}
              aria-label={`${name}, ${names.length}`}
              title={names.length > 0 ? names.join(', ') : undefined}
              onClick={() => toggle(emoji)}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-body-3',
                pressed
                  ? 'border-action-primary-border bg-action-primary-surface text-action-primary'
                  : 'border-transparent text-fg-secondary hover:bg-action-neutral-surface-hover',
              )}
            >
              <span aria-hidden="true">{emoji}</span>
              <span aria-hidden="true">{names.length}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
