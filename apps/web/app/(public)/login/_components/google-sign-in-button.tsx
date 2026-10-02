import Image from 'next/image';
import { Button, type ButtonProps } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';

export type GoogleSignInButtonProps = Omit<
  ButtonProps,
  'children' | 'variant' | 'size' | 'asChild'
>;

/**
 * The label is fixed; every other button prop passes through to the `<button>`, including
 * `onClick`.
 *
 * Google's mark is decorative (`alt=""`) because the label already names the button, and a
 * screen reader would otherwise say "Google" twice. It is Google's own file, unmodified,
 * because their brand guidelines forbid redrawing it.
 */
export function GoogleSignInButton({
  className,
  ...rest
}: GoogleSignInButtonProps) {
  return (
    <Button className={cn('w-full', className)} {...rest}>
      {/* `width` and `height` only reserve space; `size-5` sets the rendered size. */}
      <Image
        src="/brand/google-g.svg"
        alt=""
        width={20}
        height={20}
        className="size-5"
      />
      Continue with Google
    </Button>
  );
}
