import Image from 'next/image';
import { cn } from '@/lib/cn.util';

export type GoogleSignInButtonProps = React.ComponentPropsWithRef<'button'>;

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
    <button
      type="button"
      className={cn(
        'inline-flex w-full items-center justify-center gap-3 rounded-control border border-line bg-surface px-5.5 py-3 font-semibold text-foreground text-sm hover:bg-surface-raised active:bg-surface-sunken',
        className,
      )}
      {...rest}
    >
      {/* `width` and `height` only reserve space; `size-5` sets the rendered size. */}
      <Image
        src="/brand/google-g.svg"
        alt=""
        width={20}
        height={20}
        className="size-5"
      />
      Continue with Google
    </button>
  );
}
