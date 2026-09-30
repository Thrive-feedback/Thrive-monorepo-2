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
        'w-full min-w-0 rounded-control border border-line-strong bg-surface px-3 py-2.5 text-body1 placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-foreground-muted aria-invalid:border-danger',
        className,
      )}
      {...rest}
    />
  );
}
