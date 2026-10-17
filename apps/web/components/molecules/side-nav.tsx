import type { LucideIcon } from 'lucide-react';
import NextLink from 'next/link';
import { cn } from '@/lib/cn.util';

export type SideNavItem = {
  readonly href: string;
  readonly label: string;
  readonly Icon: LucideIcon;
};

export type SideNavProps = {
  /** Names the menu for screen readers, so it is told apart from the navbar. */
  label: string;
  items: readonly SideNavItem[];
  /** The item marked as the open page; the caller decides, since it may differ from the path. */
  currentHref: string;
};

/**
 * A column of links down the side of a page, each an icon and a label, with the open page in the
 * light primary colour. On a narrow screen the links grow taller, to tap.
 */
export function SideNav({ label, items, currentHref }: SideNavProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-1">
      {items.map(({ href, label: itemLabel, Icon }) => (
        <NextLink
          key={href}
          href={href}
          aria-current={href === currentHref ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-button px-3 py-2.5 text-button-sm text-fg-secondary hover:bg-action-neutral-surface hover:text-fg-primary',
            'max-md:py-4',
            'md:aria-[current]:bg-action-primary-surface md:aria-[current]:text-action-primary',
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
          {itemLabel}
        </NextLink>
      ))}
    </nav>
  );
}
