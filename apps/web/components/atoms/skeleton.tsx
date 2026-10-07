import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

const skeleton = cva('bg-surface-subtle motion-safe:animate-pulse', {
  variants: {
    shape: {
      text: 'h-4 w-full rounded-full',
      circle: 'size-10 rounded-full',
      rectangle: 'h-24 w-full rounded-surface',
    },
  },
  defaultVariants: { shape: 'text' },
});

export type SkeletonProps = React.ComponentPropsWithRef<'div'> &
  VariantProps<typeof skeleton>;

/**
 * A placeholder in the shape of content still loading. It is hidden from screen readers:
 * mark the region that is loading with `aria-busy` instead, so it is announced once rather
 * than once per grey bar. Size it with `className` to match what it stands in for.
 */
export function Skeleton({ shape, className, ...rest }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeleton({ shape }), className)}
      {...rest}
    />
  );
}
