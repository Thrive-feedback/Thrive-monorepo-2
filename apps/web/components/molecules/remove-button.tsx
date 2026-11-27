import { XIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';

export type RemoveButtonProps = Omit<
  ButtonProps,
  'variant' | 'size' | 'children' | 'prefixIcon' | 'aria-label'
> & {
  /** What pressing it takes away, said to a screen reader: "Remove question 2". */
  'aria-label': string;
};

/**
 * The × at the end of a row that takes that row out of a list being made, such as a question in a
 * template, a topic on an agenda or an email in Invite people. Every one is the same quiet round
 * button, turning red on hover to say what it does, so the column of them lines up and reads the
 * same wherever a list is edited.
 */
export function RemoveButton({ className, ...rest }: RemoveButtonProps) {
  return (
    <Button
      variant="ghost-danger"
      size="icon"
      className={cn(
        'shrink-0 text-fg-secondary not-disabled:hover:text-status-error-active',
        className,
      )}
      {...rest}
    >
      <XIcon aria-hidden="true" className="size-4" />
    </Button>
  );
}
