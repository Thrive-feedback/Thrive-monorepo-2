import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-button transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-action-disabled-surface disabled:text-fg-secondary aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-action-disabled-surface aria-disabled:text-fg-secondary aria-disabled:active:bg-action-disabled-surface aria-disabled:hover:bg-action-disabled-surface',
  {
    variants: {
      // Hover and pressed fills wait on `not-disabled:`, not `enabled:`: `:enabled` matches form
      // controls only, so an `asChild` link would never change under the pointer.
      variant: {
        primary:
          'bg-action-primary text-fg-on-action not-disabled:hover:bg-action-primary-hover not-disabled:active:bg-action-primary-active',
        highlight:
          'bg-action-secondary text-fg-on-secondary not-disabled:hover:bg-action-secondary-hover not-disabled:active:bg-action-secondary-active',
        tertiary:
          'bg-action-tertiary text-fg-on-tertiary not-disabled:hover:bg-action-tertiary-hover not-disabled:active:bg-action-tertiary-active',
        outlined:
          'border border-action-primary-border bg-action-primary-surface text-action-primary-hover not-disabled:hover:bg-action-primary-surface-hover not-disabled:active:bg-action-primary-surface-hover',
        'outlined-tertiary':
          'border border-action-tertiary-border bg-action-tertiary-surface text-action-tertiary not-disabled:hover:bg-action-tertiary-surface-hover not-disabled:active:bg-action-tertiary-surface-hover',
        'outlined-highlight':
          'border border-action-secondary-border bg-action-secondary-surface text-action-secondary-hover not-disabled:hover:bg-action-secondary-surface-hover not-disabled:active:bg-action-secondary-surface-hover',
        secondary:
          'border border-action-neutral-border bg-surface-base text-fg-primary not-disabled:hover:bg-action-neutral-surface-hover not-disabled:active:bg-action-neutral-surface-hover',
        soft: 'bg-action-neutral-surface text-action-primary-fg not-disabled:hover:bg-action-primary-surface-hover not-disabled:active:bg-action-primary-surface-hover',
        ghost:
          'bg-action-neutral-surface text-fg-accent not-disabled:hover:bg-action-primary-surface not-disabled:active:bg-action-primary-surface-hover',
        danger:
          'bg-status-error text-fg-on-error not-disabled:hover:bg-status-error-hover not-disabled:active:bg-status-error-active',
        /** A step that ends something the person can take back, such as Sign out: a caution, not a loss. */
        warning:
          'bg-status-warning text-fg-on-warning not-disabled:hover:bg-status-warning-hover not-disabled:active:bg-status-warning-active',
        'ghost-danger':
          'text-status-error-active not-disabled:hover:bg-status-error-surface not-disabled:active:bg-status-error-surface-hover',
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
 * `aria-disabled` draws it as `disabled` does, hover and press included, but leaves it focusable and
 * pressable, for an action that is unavailable and must still say why: what a press does then is
 * the caller's, such as showing the reason.
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
