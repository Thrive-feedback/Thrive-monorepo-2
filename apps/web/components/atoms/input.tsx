import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

const inputVariants = cva(
  'w-full min-w-0 rounded-input border px-2 placeholder:text-fg-secondary disabled:cursor-not-allowed disabled:text-fg-secondary',
  {
    variants: {
      variant: {
        outlined:
          'border-border-strong bg-surface-base disabled:bg-surface-subtle aria-invalid:border-status-error-border',
        filled:
          'border-transparent bg-action-neutral-surface aria-invalid:bg-status-error-surface',
        standard:
          'border-transparent bg-surface-subtle aria-invalid:border-status-error-border',
      },
      size: {
        sm: 'py-1.25 text-input-value-sm',
        md: 'py-2.25 text-input-value-md',
      },
    },
    defaultVariants: { variant: 'outlined', size: 'md' },
  },
);

export type InputProps = Omit<React.ComponentPropsWithRef<'input'>, 'size'> &
  VariantProps<typeof inputVariants>;

/**
 * A bare control with no label of its own. Reach for `TextField` on a form; use this only
 * where the label comes from elsewhere, and pass `aria-label` or `aria-labelledby` then.
 *
 * `aria-invalid` is the error state, so a screen reader hears it and the border shows it
 * from the same attribute.
 *
 * `size` is the design's control size, not the native character-width attribute. Every
 * variant keeps a border, transparent where it is not drawn, so the sizes hold across them.
 */
export function Input({
  variant,
  size,
  type = 'text',
  className,
  ...rest
}: InputProps) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(inputVariants({ variant, size }), className)}
      {...rest}
    />
  );
}
