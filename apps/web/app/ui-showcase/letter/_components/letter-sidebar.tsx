import { cva } from 'class-variance-authority';
import {
  MessageCircleQuestionMarkIcon,
  PenLineIcon,
  SparklesIcon,
} from 'lucide-react';
import { useId } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import type { LetterSide } from './letter-face';

const choice = cva(
  'flex w-full cursor-pointer items-center gap-2.5 rounded-button px-3 py-2 text-button-sm disabled:cursor-not-allowed disabled:text-fg-disabled max-md:py-3.5',
  {
    variants: {
      chosen: {
        true: 'bg-action-primary-surface text-action-primary',
        false:
          'text-fg-secondary enabled:hover:bg-action-neutral-surface enabled:hover:text-fg-primary',
      },
    },
  },
);

const CHOICES = [
  {
    side: 'request',
    label: 'Request feedback',
    Icon: MessageCircleQuestionMarkIcon,
  },
  { side: 'give', label: 'Give feedback', Icon: PenLineIcon },
] as const;

export type LetterSidebarProps = {
  /** The letter being written, marked as chosen; none before the first choice. */
  writing: LetterSide | null;
  onChoose: (side: LetterSide) => void;
};

/** The kinds of letter there are to write, down the side of the page, the one being written marked. */
export function LetterSidebar({ writing, onChoose }: LetterSidebarProps) {
  const headingId = useId();

  return (
    <aside aria-labelledby={headingId} className="flex flex-col gap-2">
      <Text
        id={headingId}
        variant="overline"
        tone="muted"
        as="h2"
        className="px-3"
      >
        Write
      </Text>
      <ul className="flex flex-col gap-0.5">
        {CHOICES.map(({ side, label, Icon }) => (
          <li key={side}>
            <button
              type="button"
              aria-pressed={writing === side}
              onClick={() => onChoose(side)}
              className={choice({ chosen: writing === side })}
            >
              <Icon aria-hidden className="size-4.5 shrink-0" />
              {label}
            </button>
          </li>
        ))}
        <li>
          <button type="button" disabled className={choice({ chosen: false })}>
            <SparklesIcon aria-hidden className="size-4.5 shrink-0" />
            Kudo
            <Badge className="ms-auto">Soon</Badge>
          </button>
        </li>
      </ul>
    </aside>
  );
}
