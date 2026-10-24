import { cva } from 'class-variance-authority';
import {
  MessageCircleQuestionMarkIcon,
  PenLineIcon,
  SparklesIcon,
} from 'lucide-react';
import { useId } from 'react';
import { Text } from '@/components/atoms/text';
import type { LetterSide } from './letter-face';

/** What can be written: either face of the letter, or a Kudos card. */
export type WritingKind = LetterSide | 'kudos';

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
    kind: 'request',
    label: 'Request feedback',
    Icon: MessageCircleQuestionMarkIcon,
  },
  { kind: 'give', label: 'Give feedback', Icon: PenLineIcon },
  { kind: 'kudos', label: 'Kudos', Icon: SparklesIcon },
] as const;

export type LetterSidebarProps = {
  /** What is being written, marked as chosen; none before the first choice. */
  writing: WritingKind | null;
  onChoose: (kind: WritingKind) => void;
};

/** The things there are to write, down the side of the page, the one being written marked. */
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
        {CHOICES.map(({ kind, label, Icon }) => (
          <li key={kind}>
            <button
              type="button"
              aria-pressed={writing === kind}
              onClick={() => onChoose(kind)}
              className={choice({ chosen: writing === kind })}
            >
              <Icon aria-hidden className="size-4.5 shrink-0" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
