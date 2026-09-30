import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

const button = cva(
  'inline-flex items-center justify-center gap-3 rounded-control font-semibold text-sm',
  {
    variants: {
      tone: {
        primary:
          'bg-action text-foreground-on-action enabled:active:bg-action-pressed enabled:hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-foreground-muted',
        secondary:
          'border border-line bg-surface text-foreground hover:bg-surface-raised active:bg-surface-sunken',
      },
      size: {
        sm: 'px-3 py-1.5',
        md: 'px-5.5 py-3',
      },
    },
    defaultVariants: { tone: 'secondary', size: 'md' },
  },
);

export type ButtonProps = React.ComponentPropsWithRef<'button'> &
  VariantProps<typeof button>;

/** `type` defaults to `button`, so a button inside a form submits only when asked to. */
export function Button({
  tone,
  size,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(button({ tone, size }), className)}
      {...rest}
    />
  );
}
