import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-3 whitespace-nowrap rounded-button disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-subtle disabled:text-fg-secondary',
  {
    variants: {
      variant: {
        primary:
          'bg-action-primary text-fg-on-action enabled:active:bg-action-primary-active enabled:hover:bg-action-primary-hover',
        secondary:
          'border border-action-neutral-border bg-surface-base text-fg-primary enabled:active:bg-action-neutral-surface-hover enabled:hover:bg-action-neutral-surface',
        soft: 'bg-action-primary-surface text-action-primary-fg enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface-hover',
        ghost:
          'text-fg-accent enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface',
        danger:
          'bg-status-error text-fg-on-error enabled:active:bg-status-error-active enabled:hover:bg-status-error-hover',
        'ghost-danger':
          'text-status-error-fg enabled:active:bg-status-error-surface-hover enabled:hover:bg-status-error-surface',
      },
      size: {
        sm: 'px-3 py-1.5 text-button-sm',
        md: 'px-inset-control-x py-inset-control-y text-button-md',
        lg: 'px-6 py-3.5 text-button-md',
        icon: 'size-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export type ButtonProps = React.ComponentPropsWithRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    asChild?: boolean;
  };

/**
 * `type` defaults to `button`, so a button inside a form submits only when asked to.
 *
 * `loading` disables the button and marks it busy rather than swapping its label, so the
 * accessible name stays what the person clicked; the spinner is decorative inside it.
 *
 * `asChild` paints its one child as a button instead of rendering a `<button>` — for a link
 * that looks like an action: `<Button asChild><Link href="/x">Go</Link></Button>`. The child
 * keeps its own element and semantics, so `type`, `disabled` and `loading` do not apply.
 */
export function Button({
  variant,
  size,
  loading = false,
  asChild = false,
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
      {loading && (
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
      )}
      {children}
    </button>
  );
}
