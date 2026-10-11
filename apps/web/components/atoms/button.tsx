import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-button disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-subtle disabled:text-fg-secondary',
  {
    variants: {
      variant: {
        primary:
          'bg-action-primary text-fg-on-action enabled:active:bg-action-primary-active enabled:hover:bg-action-primary-hover',
        outlined:
          'border border-action-primary-border bg-action-primary-surface text-action-primary enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface-hover',
        secondary:
          'border border-action-neutral-border bg-surface-base text-fg-primary enabled:active:bg-action-neutral-surface-hover enabled:hover:bg-action-neutral-surface',
        soft: 'bg-action-neutral-surface text-action-primary-fg enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface-hover',
        ghost:
          'bg-action-neutral-surface text-fg-accent enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface',
        danger:
          'bg-status-error text-fg-on-error enabled:active:bg-status-error-active enabled:hover:bg-status-error-hover',
        'ghost-danger':
          'text-status-error-fg enabled:active:bg-status-error-surface-hover enabled:hover:bg-status-error-surface',
      },
      size: {
        sm: 'px-3 py-2 text-button-sm leading-5',
        md: 'px-4 py-2.5 text-button-sm leading-5',
        lg: 'px-5.5 py-3.5 text-button-md leading-5',
        icon: 'size-9 rounded-full',
      },
    },
    compoundVariants: [
      { variant: ['ghost', 'ghost-danger'], size: 'sm', className: 'px-1.25' },
      { variant: ['ghost', 'ghost-danger'], size: 'md', className: 'px-2' },
      { variant: ['ghost', 'ghost-danger'], size: 'lg', className: 'px-2.75' },
    ],
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export type ButtonProps = React.ComponentPropsWithRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    asChild?: boolean;
    /** An icon before the label, such as a brand's mark. Decorative: the label names the button. */
    prefixIcon?: React.ReactNode;
  };

/**
 * `type` defaults to `button`, so a button inside a form submits only when asked to.
 *
 * `loading` disables the button and marks it busy rather than swapping its label, so the
 * accessible name stays what the person clicked; the spinner is decorative inside it.
 *
 * `asChild` paints its one child as a button instead of rendering a `<button>` — for a link
 * that looks like an action: `<Button asChild><Link href="/x">Go</Link></Button>`. The child
 * keeps its own element and semantics, so `type`, `disabled`, `loading` and `prefixIcon` do
 * not apply.
 *
 * `prefixIcon` sits before the label. While loading, the spinner takes its place, so the button
 * never shows two icons.
 */
export function Button({
  variant,
  size,
  loading = false,
  asChild = false,
  prefixIcon,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {loading ? (
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        prefixIcon
      )}
      {children}
    </button>
  );
}
