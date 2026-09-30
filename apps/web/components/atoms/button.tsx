import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

const button = cva(
  'inline-flex items-center justify-center gap-3 rounded-control font-semibold text-sm',
  {
    variants: {
      tone: {
        secondary:
          'border border-line bg-surface text-foreground hover:bg-surface-raised active:bg-surface-sunken',
      },
      size: {
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
