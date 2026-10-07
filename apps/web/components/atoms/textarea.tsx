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
        'field-sizing-content flex min-h-20 w-full rounded-input border border-border-strong bg-surface-base px-3 py-2.5 text-body-1 placeholder:text-fg-secondary disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-fg-secondary aria-invalid:border-status-error-border',
        className,
      )}
      {...rest}
    />
  );
}
