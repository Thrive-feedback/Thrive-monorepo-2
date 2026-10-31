import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';
import { POSTCARD_BAR } from './postcard-editor.constant';

export type PostcardAnswerPagerProps = {
  /** Which answer shows, counting from 0. */
  index: number;
  /** How many answers there are. */
  count: number;
  /** Who wrote the answer showing, said to a screen reader as the answer changes. */
  giverName: string;
  className?: string;
  onIndexChange: (index: number) => void;
};

/**
 * Steps through the answers on a request's card, where the writing card has its tools. It runs
 * round from the last answer to the first, so neither button is ever disabled under the cursor.
 */
export function PostcardAnswerPager({
  index,
  count,
  giverName,
  className,
  onIndexChange,
}: PostcardAnswerPagerProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: `<fieldset>` groups form fields under a legend; a pair of buttons is a plain named group.
    <div
      role="group"
      aria-label="Answers"
      className={cn(POSTCARD_BAR, 'gap-0.5', className)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onIndexChange((index - 1 + count) % count)}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4.5" />
        <span className="sr-only">Previous answer</span>
      </Button>
      <output className="px-2 text-body-2 text-fg-secondary tabular-nums">
        <span className="sr-only">Answer from {giverName}, </span>
        {index + 1} of {count}
      </output>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onIndexChange((index + 1) % count)}
      >
        <ChevronRightIcon aria-hidden="true" className="size-4.5" />
        <span className="sr-only">Next answer</span>
      </Button>
    </div>
  );
}
