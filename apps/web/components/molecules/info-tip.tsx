'use client';

import { InfoIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';

export type InfoTipProps = {
  /** What it is about, for a screen reader: read as "About {about}". */
  about: string;
  /** What it says. */
  words: string;
};

/**
 * An "i" beside a heading that says what the heading holds, kept out of the way of what follows. It
 * opens on hover and keyboard focus as a tooltip does, and on a press as well, so a phone, which has
 * no hover, can read it too. A screen reader is read the same words on the button.
 */
export function InfoTip({ about, words }: InfoTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wordsId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <span id={wordsId} className="sr-only">
        {words}
      </span>
      {/* A press toggles it. Radix closes an open tooltip on pointerdown and on click, on the button
          and as a press outside the tip; each is held here, so the press alone decides, and a second
          press closes it rather than closing and reopening. */}
      <TooltipTrigger
        ref={trigger}
        asChild
        onPointerDown={(event) => {
          if (isOpen) {
            event.preventDefault();
          }
        }}
        onClick={(event) => {
          event.preventDefault();
          setIsOpen((open) => !open);
        }}
      >
        <button
          type="button"
          aria-label={`About ${about}`}
          aria-describedby={wordsId}
          className="grid size-7 cursor-pointer place-items-center rounded-full text-fg-muted transition-colors duration-quick ease-smooth-out hover:bg-action-neutral-surface-hover hover:text-fg-primary motion-reduce:transition-none"
        >
          <InfoIcon aria-hidden="true" className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        className="max-w-72"
        onPointerDownOutside={(event) => {
          if (
            event.target instanceof Node &&
            trigger.current?.contains(event.target)
          ) {
            event.preventDefault();
          }
        }}
      >
        {words}
      </TooltipContent>
    </Tooltip>
  );
}
