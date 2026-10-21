import type { LucideIcon } from 'lucide-react';
import NextLink from 'next/link';
import { cn } from '@/lib/cn.util';

export type SideNavItem = {
  readonly href: string;
  readonly label: string;
  readonly Icon: LucideIcon;
  /** Items that belong to this one, listed under it with a branch line to each. */
  readonly children?: readonly SideNavItem[];
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
 * light primary colour. An item's children hang under it like a code editor's file tree: a line
 * runs down from under its icon and curves into each child, ending at the last. They are always
 * shown; nothing folds. On a narrow screen the links grow taller, to tap.
 */
export function SideNav({ label, items, currentHref }: SideNavProps) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <SideNavLink item={item} currentHref={currentHref} />
            {item.children && item.children.length > 0 && (
              <ul className="-mt-1.5 flex flex-col">
                {item.children.map((child, index, siblings) => (
                  <li key={child.href} className="relative pl-8">
                    {index < siblings.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-5 border-border-muted border-l"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-5 h-1/2 w-5 rounded-bl-control border-border-muted border-b border-l"
                    />
                    <SideNavLink item={child} currentHref={currentHref} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SideNavLink({
  item: { href, label, Icon },
  currentHref,
}: {
  item: SideNavItem;
  currentHref: string;
}) {
  return (
    <NextLink
      href={href}
      aria-current={href === currentHref ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-button px-3 py-2 text-button-sm text-fg-secondary hover:bg-action-neutral-surface hover:text-fg-primary',
        'max-md:py-3.5',
        'md:aria-[current]:bg-action-primary-surface md:aria-[current]:text-action-primary',
      )}
    >
      <Icon aria-hidden="true" className="size-4.5 shrink-0" />
      <span className="truncate">{label}</span>
    </NextLink>
  );
}
