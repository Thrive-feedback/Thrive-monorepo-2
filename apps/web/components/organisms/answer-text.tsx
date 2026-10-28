'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';

export type AnswerTextProps = {
  /** The answer's words, as its Giver wrote them, with their tags already drawn. */
  children: React.ReactNode;
};

/**
 * One answer inside a card, its line breaks kept. It shows its first three lines; "Show more"
 * opens the rest in place, and is offered only when the three lines actually cut something off,
 * so a short answer on a wide screen carries no button that would change nothing.
 */
export function AnswerText({ children }: AnswerTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cutOff, setCutOff] = useState(false);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text || open) {
      return;
    }
    // Measured while folded: taller than it is drawn means the fold hides some of it.
    const measure = () => setCutOff(text.scrollHeight > text.clientHeight);
    measure();
    // The column can be dragged wider or narrower, which changes what three lines hold.
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    return () => observer.disconnect();
  }, [open]);

  return (
    <div className="flex flex-col items-start gap-1">
      <Text
        ref={textRef}
        as="p"
        variant="body-1"
        className={cn(
          'whitespace-pre-line break-words',
          !open && 'line-clamp-3',
        )}
      >
        {children}
      </Text>
      {(cutOff || open) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          {open ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
}
