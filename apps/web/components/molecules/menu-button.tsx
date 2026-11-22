import { HamburgerIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';

export type MenuButtonProps = Omit<
  ButtonProps,
  'children' | 'variant' | 'size' | 'asChild'
> & {
  /** What it opens, as a screen reader hears it, such as "Open menu". */
  label: string;
};

/**
 * The button that opens a menu of places, drawn as a hamburger, the burger itself: a quiet icon
 * button, as the navbar's others are.
 */
export function MenuButton({ label, className, ...rest }: MenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('text-fg-secondary', className)}
      {...rest}
    >
      <HamburgerIcon aria-hidden="true" className="size-5" />
    </Button>
  );
}
