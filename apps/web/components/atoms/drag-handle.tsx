import { GripVerticalIcon } from 'lucide-react';
import { cn } from '@/lib/cn.util';

export type DragHandleProps = Omit<
  React.ComponentPropsWithRef<'button'>,
  'children' | 'aria-label'
> & {
  /** What moving it moves, said to a screen reader: "Move What went well?". */
  'aria-label': string;
};

/**
 * The grip at the start of a row that can be dragged into another place in its list, such as a
 * topic on an agenda or a question in a template. It takes the sortable list's activator ref,
 * attributes and listeners as it would on a plain button. The icon stays 24px; an invisible ring
 * around it makes the handle 40 by 44 for a finger, reaching into the row's padding and the gap
 * beside it, never over the next control.
 */
export function DragHandle({ className, ...rest }: DragHandleProps) {
  return (
    <button
      type="button"
      className={cn(
        'relative grid size-6 shrink-0 cursor-grab touch-none place-content-center rounded-element text-fg-muted transition-colors duration-quick ease-smooth-out before:absolute before:-inset-x-2 before:-inset-y-2.5 hover:bg-action-neutral-surface-hover hover:text-fg-secondary focus-visible:outline-2 focus-visible:outline-action-primary active:cursor-grabbing disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      <GripVerticalIcon aria-hidden="true" className="size-4" />
    </button>
  );
}
