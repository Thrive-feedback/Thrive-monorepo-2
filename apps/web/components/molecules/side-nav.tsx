import { cva } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import NextLink from 'next/link';
import { CountBadge } from '@/components/atoms/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { cn } from '@/lib/cn.util';

export type SideNavItem = {
  /** Where it leads. */
  readonly href: string;
  readonly label: string;
  readonly Icon: LucideIcon;
  /**
   * How many unread things wait behind the item, shown beside its label and said after it, as
   * `, 2 unread`. Nothing shows at zero.
   */
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
  /**
   * The item marked as the open page; the caller decides, since it may differ from the path. Left
   * out where none of the items can be the open page.
   */
  currentHref?: string;
  /**
   * While the sidebar is folded to its rail (the `rail:` variant, from `data-sidebar` on `<html>`),
   * shows each item as its icon alone, named by a tooltip when pointed at. For a flat list: an
   * item's children are not folded.
   */
  foldsToIcons?: boolean;
};

/**
 * A column of links down the side of a page, each an icon and a label, with the open page in the
 * light primary colour. An item's children hang under it like a code editor's file tree: a line
 * runs down from under its icon and curves into each child, ending at the last. They are always
 * shown; nothing folds. On a narrow screen the links grow taller, to tap.
 */
export function SideNav({
  label,
  items,
  currentHref,
  foldsToIcons = false,
}: SideNavProps) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-0.5">
        {items.map((entry) =>
          'heading' in entry ? (
            <li
              key={entry.heading}
              className={sideNavHeading({ foldsToIcons })}
            >
              {/* Folded, the line still parts the groups; the words stay for assistive technology. */}
              <span className={foldedAway({ foldsToIcons })}>
                {entry.heading}
              </span>
            </li>
          ) : (
            <li key={entry.label}>
              <SideNavLink
                item={entry}
                currentHref={currentHref}
                foldsToIcons={foldsToIcons}
              />
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
                      <SideNavLink
                        item={child}
                        currentHref={currentHref}
                        foldsToIcons={false}
                      />
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

const sideNavHeading = cva(
  'mt-3 border-border-subtle border-t px-3 pt-5 pb-2 text-fg-secondary text-overline uppercase',
  {
    variants: {
      foldsToIcons: { true: 'rail:mt-2 rail:pt-2 rail:pb-0', false: '' },
    },
  },
);

/** Words that folding hides from sight but keeps for assistive technology. */
const foldedAway = cva('', {
  variants: { foldsToIcons: { true: 'rail:sr-only', false: '' } },
});

/** Beside the label, or folded, small on the icon's corner. */
const sideNavCount = cva('', {
  variants: {
    foldsToIcons: {
      true: 'rail:absolute rail:-top-1.5 rail:right-0',
      false: '',
    },
  },
});

/**
 * One row of a side nav, as its links are drawn: an icon and a label, the open page in the light
 * primary colour. Exported for a control that stands among the rows, such as the button that folds
 * the sidebar, so it reads as one of them.
 */
export const sideNavLink = cva(
  [
    'relative flex w-full items-center gap-2.5 rounded-button px-3 py-2 text-start text-button-sm text-fg-secondary hover:bg-action-neutral-surface-hover hover:text-fg-primary',
    'max-md:py-3.5',
    'md:aria-[current]:bg-action-primary-surface md:aria-[current]:text-action-primary',
  ],
  {
    variants: {
      // A square around the icon, the count on its corner.
      foldsToIcons: { true: 'rail:justify-center rail:px-0', false: '' },
    },
  },
);

function SideNavLink({
  item: { href, label, Icon, count },
  currentHref,
  foldsToIcons,
}: {
  item: SideNavItem;
  currentHref?: string;
  foldsToIcons: boolean;
}) {
  const content = (
    <>
      <Icon aria-hidden="true" className="size-4.5 shrink-0" />
      <span
        className={cn('min-w-0 flex-1 truncate', foldedAway({ foldsToIcons }))}
      >
        {label}
      </span>
      <CountBadge
        count={count ?? 0}
        className={sideNavCount({ foldsToIcons })}
      />
    </>
  );

  const link = (
    <NextLink
      href={href}
      aria-current={href === currentHref ? 'page' : undefined}
      className={sideNavLink({ foldsToIcons })}
    >
      {content}
    </NextLink>
  );

  if (!foldsToIcons) {
    return link;
  }

  // The tooltip names the icon where the label is hidden, and is never shown beside a label.
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="not-rail:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
