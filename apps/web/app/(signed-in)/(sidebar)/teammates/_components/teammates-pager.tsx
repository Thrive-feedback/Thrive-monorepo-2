import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type TeammatesPagerProps = {
  /** The page showing, from one. */
  page: number;
  pageTotal: number;
  onGoBack: () => void;
  onGoOn: () => void;
};

/**
 * Under the list: back, where you are, on, as the Kudos board pages. It says where you are out loud
 * as the page turns. An arrow that reaches the end disables itself, which would drop the focus, so
 * that goes to the other arrow.
 */
export function TeammatesPager({
  page,
  pageTotal,
  onGoBack,
  onGoOn,
}: TeammatesPagerProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  const onRef = useRef<HTMLButtonElement>(null);
  const pressed = useRef<'back' | 'on' | null>(null);
  const canGoBack = page > 1;
  const canGoOn = page < pageTotal;

  useLayoutEffect(() => {
    if (pressed.current === 'on' && !canGoOn) {
      backRef.current?.focus();
    }
    if (pressed.current === 'back' && !canGoBack) {
      onRef.current?.focus();
    }
    pressed.current = null;
  }, [canGoBack, canGoOn]);

  return (
    <nav aria-label="Pages of teammates" className="flex justify-center">
      <div className="flex items-center gap-3">
        <Button
          ref={backRef}
          size="icon"
          aria-label="Previous page"
          disabled={!canGoBack}
          onClick={() => {
            pressed.current = 'back';
            onGoBack();
          }}
          className="size-11"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </Button>
        <Text
          as="p"
          variant="body-2"
          tone="muted"
          aria-live="polite"
          className="min-w-24 text-center tabular-nums"
        >
          Page {page} of {pageTotal}
        </Text>
        <Button
          ref={onRef}
          size="icon"
          aria-label="Next page"
          disabled={!canGoOn}
          onClick={() => {
            pressed.current = 'on';
            onGoOn();
          }}
          className="size-11"
        >
          <ChevronRightIcon aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </nav>
  );
}
