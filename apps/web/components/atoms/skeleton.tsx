import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

const skeleton = cva('bg-surface-skeleton motion-safe:animate-pulse', {
  variants: {
    // Each shape takes the corner of what it stands in for, so nothing changes shape when the
    // content arrives.
    shape: {
      text: 'h-4 w-full rounded-element',
      circle: 'size-10 rounded-full',
      control: 'h-10 w-full rounded-control',
      card: 'h-24 w-full rounded-page',
    },
  },
  defaultVariants: { shape: 'text' },
});

export type SkeletonProps = React.ComponentPropsWithRef<'div'> &
  VariantProps<typeof skeleton>;

/**
 * A placeholder in the shape of content still loading. It is hidden from screen readers:
 * mark the region that is loading with `aria-busy` instead, so it is announced once rather
 * than once per grey bar. Pick the `shape` of what it stands in for — `card` for a Card or a
 * card-like box, `control` for a button or field, `circle` for an avatar, `text` for lines — and
 * size it with `className`.
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
