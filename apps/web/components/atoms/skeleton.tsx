import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';

const skeleton = cva('bg-surface-skeleton motion-safe:animate-pulse', {
  variants: {
    // Each shape takes the corner of what it stands in for, so nothing changes shape when the
    // content arrives.
    shape: {
      // One line of text, exactly as tall as the type role it is given: the role's line height,
      // which steps up per device, with the bar drawn inside it so stacked lines stay apart.
      text: 'h-lh w-full rounded-element bg-clip-content py-1 text-body-2',
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
 * card-like box, `control` for a button or field, `circle` for an avatar, `text` for a line — and
 * size it with `className`. A `text` line takes the type role of the line it replaces
 * (`text-subtitle-4`), so it is that line's height on every device.
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

export type SkeletonRegionProps = {
  /** The skeletons, laid out as the content they stand in for. */
  children: React.ReactNode;
};

/**
 * The region a route shows while it loads: announced once as loading, with everything inside
 * it inert, so words drawn beside the grey bars are not read out and nothing in it can be
 * focused or clicked before the real page arrives.
 */
export function SkeletonRegion({ children }: SkeletonRegionProps) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div inert>{children}</div>
    </div>
  );
}
