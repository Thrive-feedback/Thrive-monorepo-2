import { cn } from '@/lib/cn.util';

export type TextareaProps = React.ComponentPropsWithRef<'textarea'>;

/**
 * Grows with its content (`field-sizing-content`) from a three-line minimum. Like `Input` it
 * has no label of its own; `TextAreaField` is the one a form uses.
 */
export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-20 w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-body1 placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-foreground-muted aria-invalid:border-danger',
        className,
      )}
      {...rest}
    />
  );
}
