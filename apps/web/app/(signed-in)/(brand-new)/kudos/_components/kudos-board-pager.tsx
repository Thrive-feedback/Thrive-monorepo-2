import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type KudosBoardPagerProps = {
  /** The page showing, from one. */
  page: number;
  pageTotal: number;
  canGoBack: boolean;
  canGoOn: boolean;
  isReading: boolean;
  hasFailed: boolean;
  /** Somebody is heading for the next page, so it can be read before they get there. */
  onApproach: () => void;
  onGoBack: () => void;
  onGoOn: () => void;
};

/**
 * The bar under the board: back, where you are, on. It says where you are out loud as the page
 * turns. An arrow that reaches the end disables itself, which would drop the focus, so that goes
 * to the other arrow.
 */
export function KudosBoardPager({
  page,
  pageTotal,
  canGoBack,
  canGoOn,
  isReading,
  hasFailed,
  onApproach,
  onGoBack,
  onGoOn,
}: KudosBoardPagerProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  const onRef = useRef<HTMLButtonElement>(null);
  const pressed = useRef<'back' | 'on' | null>(null);

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
    <nav aria-label="Pages of the board" className="relative">
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
          loading={isReading}
          onPointerEnter={onApproach}
          onFocus={onApproach}
          onClick={() => {
            pressed.current = 'on';
            onGoOn();
          }}
          className="size-11"
        >
          <ChevronRightIcon aria-hidden="true" className="size-5" />
        </Button>
      </div>
      {hasFailed && (
        // Over the board rather than under the bar, so it adds nothing to the height of the page.
        <div
          role="alert"
          className="absolute bottom-full left-1/2 z-10 mb-2 flex w-max max-w-full -translate-x-1/2 items-center gap-3 rounded-control bg-surface-raised px-3 py-2 shadow-med"
        >
          <Text as="p" variant="body-3" tone="danger">
            We couldn't read the next page.
          </Text>
          <Button size="sm" onClick={onGoOn}>
            Try again
          </Button>
        </div>
      )}
    </nav>
  );
}
