import { Link, link } from '@/components/atoms/link';
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';

export type TargetLinkProps = {
  target: NavTarget;
  className?: string;
  children: React.ReactNode;
};

/**
 * Text that leads somewhere: a `Link` to an address, or, for a callback, a button dressed as one,
 * since something that does not navigate must not claim to be a link. An address keeps the
 * scroll where it is, because these open things over the page rather than leaving it.
 */
export function TargetLink({ target, className, children }: TargetLinkProps) {
  if ('href' in target) {
    return (
      <Link href={target.href} scroll={false} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={target.onSelect}
      className={cn(link(), 'cursor-pointer text-left', className)}
    >
      {children}
    </button>
  );
}
