import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-3 whitespace-nowrap rounded-control disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-sunken disabled:text-foreground-muted',
  {
    variants: {
      variant: {
        primary:
          'bg-action text-foreground-on-action enabled:active:bg-action-pressed enabled:hover:bg-action-hover',
        secondary:
          'border border-line bg-surface text-foreground enabled:active:bg-surface-sunken enabled:hover:bg-surface-raised',
        soft: 'bg-action-subtle text-brand enabled:active:bg-surface-sunken enabled:hover:bg-surface-raised',
        ghost:
          'text-brand enabled:active:bg-surface-sunken enabled:hover:bg-action-subtle',
        danger:
          'bg-danger text-foreground-on-action enabled:active:bg-danger/80 enabled:hover:bg-danger/90',
        'ghost-danger':
          'text-danger enabled:active:bg-surface-sunken enabled:hover:bg-danger-subtle',
      },
      size: {
        sm: 'px-3 py-1.5 text-button-small',
        md: 'px-5.5 py-3 text-button-medium',
        lg: 'px-6 py-3.5 text-button-large',
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
