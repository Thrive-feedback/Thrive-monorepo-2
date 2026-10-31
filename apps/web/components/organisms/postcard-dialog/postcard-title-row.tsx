import { XIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { DialogTitle } from '@/components/atoms/dialog';
import { cn } from '@/lib/cn.util';

export type PostcardTitleRowProps = {
  /** What the card is, above it. */
  title: string;
  className?: string;
  /** Close was pressed. */
  onClose: () => void;
};

/** The line above the card: the dialog's title, and Close. */
export function PostcardTitleRow({
  title,
  className,
  onClose,
}: PostcardTitleRowProps) {
  return (
    <div className={cn('flex w-full max-w-2xl items-center gap-2', className)}>
      <DialogTitle className="flex-1 text-subtitle-display-1">
        {title}
      </DialogTitle>
      <Button variant="secondary" size="icon" onClick={onClose}>
        <XIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
}
