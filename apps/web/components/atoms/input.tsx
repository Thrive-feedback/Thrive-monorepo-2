import { cn } from '@/lib/cn.util';

export type InputProps = React.ComponentPropsWithRef<'input'>;

/**
 * A bare control with no label of its own. Reach for `TextField` on a form; use this only
 * where the label comes from elsewhere, and pass `aria-label` or `aria-labelledby` then.
 *
 * `aria-invalid` is the error state, so a screen reader hears it and the border shows it
 * from the same attribute.
 */
export function Input({ type = 'text', className, ...rest }: InputProps) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'w-full min-w-0 rounded-input border border-border-strong bg-surface-base px-3 py-2.5 text-body-1 placeholder:text-fg-secondary disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-fg-secondary aria-invalid:border-status-error-border',
        className,
      )}
      {...rest}
    />
  );
}
