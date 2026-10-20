import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

/**
 * The textarea's box and type. Exported so a layer drawn under it, such as coloured tags, can
 * take the same metrics and stay aligned with the text typed into it.
 */
export const textareaVariants = cva(
  'field-sizing-content flex min-h-20 w-full rounded-input border border-border-strong bg-surface-base px-3 py-2.5 text-body-1 placeholder:text-fg-disabled disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-fg-secondary aria-invalid:border-status-error-border',
);

export type TextareaProps = React.ComponentPropsWithRef<'textarea'>;

/**
 * Grows with its content (`field-sizing-content`) from a three-line minimum. Like `Input` it
 * has no label of its own; `TextAreaField` is the one a form uses.
 */
export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants(), className)}
      {...rest}
    />
  );
}
