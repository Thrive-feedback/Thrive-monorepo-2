import type { LucideIcon } from 'lucide-react';
import NextLink from 'next/link';
import { Badge } from '@/components/atoms/badge';
import { cn } from '@/lib/cn.util';

export type SideNavItem = {
  /** Where it leads. Without one the item is drawn the same, but leads nowhere yet. */
  readonly href?: string;
  readonly label: string;
  readonly Icon: LucideIcon;
  /** How many things wait behind the item, shown beside its label. Nothing shows at zero. */
  readonly count?: number;
  /** Items that belong to this one, listed under it with a branch line to each. */
  readonly children?: readonly SideNavItem[];
};

/**
 * A label over the items that follow it, until the next one, set off from the items above by a
 * line so the groups read apart at a glance.
 */
export type SideNavHeading = {
  readonly heading: string;
};

export type SideNavEntry = SideNavItem | SideNavHeading;

export type SideNavProps = {
  /** Names the menu for screen readers, so it is told apart from the navbar. */
  label: string;
  items: readonly SideNavEntry[];
  /** The item marked as the open page; the caller decides, since it may differ from the path. */
  currentHref: string;
};

/**
 * A column of links down the side of a page, each an icon and a label, with the open page in the
 * light primary colour. An item's children hang under it like a code editor's file tree: a line
 * runs down from under its icon and curves into each child, ending at the last. They are always
 * shown; nothing folds. On a narrow screen the links grow taller, to tap.
 *
 * An item with no `href` is a page still to be built: it looks like the rest so the column reads
 * as it will, but it is a button marked unavailable, so nothing pretends to lead somewhere.
 */
export function SideNav({ label, items, currentHref }: SideNavProps) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-0.5">
        {items.map((entry) =>
          'heading' in entry ? (
            <li
              key={entry.heading}
              className="mt-3 border-border-subtle border-t px-3 pt-5 pb-2 text-fg-secondary text-overline uppercase"
            >
              {entry.heading}
            </li>
          ) : (
            <li key={entry.label}>
              <SideNavLink item={entry} currentHref={currentHref} />
              {entry.children && entry.children.length > 0 && (
                <ul className="-mt-1.5 flex flex-col">
                  {entry.children.map((child, index, siblings) => (
                    <li key={child.label} className="relative pl-8">
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
          ),
        )}
      </ul>
    </nav>
  );
}

const LINK_CLASSES = cn(
  'flex w-full items-center gap-2.5 rounded-button px-3 py-2 text-start text-button-sm text-fg-secondary hover:bg-action-neutral-surface hover:text-fg-primary',
  'max-md:py-3.5',
  'md:aria-[current]:bg-action-primary-surface md:aria-[current]:text-action-primary',
);

function SideNavLink({
  item: { href, label, Icon, count },
  currentHref,
}: {
  item: SideNavItem;
  currentHref: string;
}) {
  const content = (
    <>
      <Icon aria-hidden="true" className="size-4.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge tone="brand" className="tabular-nums">
          {count}
        </Badge>
      )}
    </>
  );

  if (href === undefined) {
    return (
      <button type="button" aria-disabled="true" className={LINK_CLASSES}>
        {content}
      </button>
    );
  }

  return (
    <NextLink
      href={href}
      aria-current={href === currentHref ? 'page' : undefined}
      className={LINK_CLASSES}
    >
      {content}
    </NextLink>
  );
}
