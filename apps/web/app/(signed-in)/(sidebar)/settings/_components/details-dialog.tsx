'use client';

import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';

/** One fact, by what it is. */
export type DetailsRow = {
  readonly label: string;
  readonly value: React.ReactNode;
};

export type DetailsDialogProps = {
  /** What the facts are about, such as an address or a chat tool. */
  title: string;
  /** A line under the title, for what the facts alone do not say. */
  description?: string;
  rows: readonly DetailsRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus goes back to once it closes: the menu's own button, since the item that opened it
   * is gone by then. Without it, focus would fall to the page.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * The facts about one thing in a Settings list that its row leaves out, so the row can say only
 * what it is and where it stands. Read only: it changes nothing, so its one way out is Close.
 */
export function DetailsDialog({
  title,
  description,
  rows,
  open,
  onOpenChange,
  returnFocusTo,
}: DetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="break-all">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <dl className="flex flex-col divide-y divide-border-subtle">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
            >
              <dt className="text-body-2 text-fg-secondary">{row.label}</dt>
              <dd className="break-all text-subtitle-4">{row.value}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
