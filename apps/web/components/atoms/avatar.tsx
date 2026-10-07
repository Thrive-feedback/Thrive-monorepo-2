'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const avatar = cva(
  'relative flex shrink-0 select-none overflow-hidden bg-surface-subtle text-fg-secondary',
  {
    variants: {
      size: {
        sm: 'size-6 text-body-3',
        md: 'size-8 text-body-2',
        lg: 'size-10 text-body-2',
      },
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-element',
        square: 'rounded-none',
      },
    },
    defaultVariants: { size: 'lg', shape: 'circle' },
  },
);

export type AvatarProps = React.ComponentPropsWithRef<
  typeof AvatarPrimitive.Root
> &
  VariantProps<typeof avatar>;

/**
 * Compose it: `<Avatar><AvatarImage src alt /><AvatarFallback>OP</AvatarFallback></Avatar>`.
 * The fallback shows until the image has loaded, and stays if it fails, so a broken photo
 * never leaves an empty circle.
 */
export function Avatar({ size, shape, className, ...rest }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatar({ size, shape }), className)}
      {...rest}
    />
  );
}

export type AvatarImageProps = React.ComponentPropsWithRef<
  typeof AvatarPrimitive.Image
>;

/** `alt` is the person's name. The image is the avatar's content, not decoration. */
export function AvatarImage({ className, ...rest }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...rest}
    />
  );
}

export type AvatarFallbackProps = React.ComponentPropsWithRef<
  typeof AvatarPrimitive.Fallback
>;

export function AvatarFallback({ className, ...rest }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center font-medium',
        className,
      )}
      {...rest}
    />
  );
}
