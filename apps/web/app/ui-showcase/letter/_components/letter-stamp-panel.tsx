import { XIcon } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './letter.module.css';
import type { LetterSide } from './letter-face';
import { stampMark } from './letter-stamp';
import {
  PICKABLE_STAMPS,
  STAMP_KINDS,
  type StampKind,
} from './letter-stamp-kinds.constant';

export type LetterStampPanelProps = {
  id: string;
  /** The face the stamps would go on, which colours them. */
  side: LetterSide;
  onAdd: (kind: StampKind) => void;
  onClose: () => void;
};

/**
 * A drawer of stamps to add, slid in over the right edge of the window. A new stamp lands in the
 * letter's top right corner. It does not hold focus or cover the page with a scrim: the letter
 * stays in reach, so a stamp just added can be moved and turned while the drawer is open.
 * Escape inside it closes it.
 */
export function LetterStampPanel({
  id,
  side,
  onAdd,
  onClose,
}: LetterStampPanelProps) {
  const headingId = useId();

  return (
    <aside
      id={id}
      data-stamp-panel
      aria-labelledby={headingId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-72 max-w-full flex-col gap-4 border-border-muted border-l bg-surface-raised py-5 shadow-high',
        styles.drawer,
      )}
    >
      <div className="flex items-center justify-between gap-2 ps-5 pe-3">
        <Text id={headingId} variant="overline" tone="muted" as="h2">
          Stamps
        </Text>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close stamps"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <ul className="grid grid-cols-3 gap-2 overflow-y-auto px-5">
        {PICKABLE_STAMPS.map((kind) => {
          const { label, Icon } = STAMP_KINDS[kind];
          return (
            <li key={kind}>
              <button
                type="button"
                aria-label={`Add a ${label} stamp`}
                onClick={() => onAdd(kind)}
                className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-control border border-border-muted bg-surface-raised hover:bg-action-neutral-surface"
              >
                <Icon aria-hidden className={stampMark({ side })} />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
