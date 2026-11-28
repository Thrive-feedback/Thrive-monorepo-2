import { cva } from 'class-variance-authority';
import { ConstructionIcon, LightbulbIcon, type LucideIcon } from 'lucide-react';
import NextLink from 'next/link';
import { CountBadge } from '@/components/atoms/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { cn } from '@/lib/cn.util';

/**
 * How far off a place not open yet is: `under-construction` is being built, `idea` is only being
 * weighed.
 */
export type SideNavUpcoming = 'under-construction' | 'idea';

type SideNavItemShared = {
  readonly label: string;
  readonly Icon: LucideIcon;
  /**
   * How many unread things wait behind the item, shown beside its label and said after it, as
   * `, 2 unread`. Nothing shows at zero.
   */
  readonly count?: number;
  /** What the count is said to be after the label, as `, 2 to answer`; `unread` unless given. */
  readonly countSaid?: string;
  /** Items that belong to this one, listed under it with a branch line to each. */
  readonly children?: readonly SideNavItem[];
};

/** A place in the menu that is open, and leads somewhere. */
export type SideNavLinkItem = SideNavItemShared & {
  readonly href: string;
  readonly upcoming?: undefined;
};

/**
 * A place not open yet: it stays in the menu, greyed and not a link, marked beside its label with
 * how far off it is.
 */
export type SideNavUpcomingItem = SideNavItemShared & {
  readonly upcoming: SideNavUpcoming;
  readonly href?: undefined;
};

export type SideNavItem = SideNavLinkItem | SideNavUpcomingItem;

/** The words and the mark each kind of place not open yet carries. */
const UPCOMING = {
  'under-construction': { note: 'Under construction', Icon: ConstructionIcon },
  idea: { note: 'Idea', Icon: LightbulbIcon },
} as const satisfies Record<
  SideNavUpcoming,
  { note: string; Icon: LucideIcon }
>;

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
  /**
   * Marks the open page only from `md`, for a menu that a phone shows alone, before any page of it
   * is open, as Settings' does. Left out, the open page is marked at every width.
   */
  marksCurrentFromMd?: boolean;
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
  marksCurrentFromMd = false,
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
                marksCurrentFromMd={marksCurrentFromMd}
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
                        marksCurrentFromMd={marksCurrentFromMd}
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

/**
 * A place not open yet, beside its label: the row is greyed, but its mark keeps its own colour at
 * every width, a deep yellow for one being built and a light blue for an idea, so how far off it is
 * reads at a glance, and on a phone, where no pointer can bring up the tooltip that names it.
 */
const upcomingMark = cva(
  'inline-flex size-6 shrink-0 items-center justify-center',
  {
    variants: {
      upcoming: {
        'under-construction': 'text-status-warning-hover',
        idea: 'text-status-info',
      },
      foldsToIcons: { true: 'rail:sr-only', false: '' },
    },
  },
);

/**
 * An item's own icon. Folded to the rail, where the mark beside the label is hidden, the icon of a
 * place not open yet takes the mark's colour instead, so how far off it is still reads at a glance.
 */
const itemIcon = cva('size-4.5 shrink-0', {
  variants: {
    foldedUpcoming: {
      'under-construction': 'rail:text-status-warning-hover',
      idea: 'rail:text-status-info',
      none: '',
    },
  },
  defaultVariants: { foldedUpcoming: 'none' },
});

/** Words a tooltip shows only while the sidebar is folded to its rail. */
const shownFolded = cva('', {
  variants: { foldsToIcons: { true: 'not-rail:hidden', false: 'hidden' } },
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
    'relative flex w-full items-center gap-2.5 rounded-button px-3 py-2 text-start text-button-sm',
    'max-md:py-3.5',
  ],
  {
    variants: {
      // A square around the icon, the count on its corner.
      foldsToIcons: { true: 'rail:justify-center rail:px-0', false: '' },
      /**
       * A place not open yet keeps the row's shape but is greyed, and is not a link: nothing to
       * press, nothing to focus. Its mark sits beside the label, its words read right after it and
       * shown in a tooltip when pointed at; folded, the label goes into the tooltip with them.
       */
      available: {
        true: 'text-fg-secondary hover:bg-action-neutral-surface-hover hover:text-fg-primary',
        false: 'cursor-default text-fg-disabled',
      },
      // The page open is the row a glance finds first: the deeper primary surface, with the
      // primary's own ink on it, in both modes; a pointer over it leaves it as it is.
      marksCurrentFromMd: {
        false:
          'aria-[current]:bg-action-primary-surface-hover aria-[current]:text-action-primary-fg aria-[current]:hover:bg-action-primary-surface-hover aria-[current]:hover:text-action-primary-fg',
        true: 'md:aria-[current]:bg-action-primary-surface-hover md:aria-[current]:text-action-primary-fg md:aria-[current]:hover:bg-action-primary-surface-hover md:aria-[current]:hover:text-action-primary-fg',
      },
    },
    defaultVariants: { available: true, marksCurrentFromMd: false },
  },
);

function SideNavLink({
  item,
  currentHref,
  foldsToIcons,
  marksCurrentFromMd,
}: {
  item: SideNavItem;
  currentHref?: string;
  foldsToIcons: boolean;
  marksCurrentFromMd: boolean;
}) {
  const { label, Icon, count, countSaid } = item;
  const named = (
    <>
      <Icon
        aria-hidden="true"
        className={itemIcon({
          foldedUpcoming: foldsToIcons ? item.upcoming : undefined,
        })}
      />
      <span
        className={cn('min-w-0 flex-1 truncate', foldedAway({ foldsToIcons }))}
      >
        {label}
      </span>
    </>
  );

  if (item.upcoming === undefined) {
    const link = (
      <NextLink
        href={item.href}
        aria-current={item.href === currentHref ? 'page' : undefined}
        className={sideNavLink({ foldsToIcons, marksCurrentFromMd })}
      >
        {named}
        <CountBadge
          count={count ?? 0}
          said={countSaid}
          className={sideNavCount({ foldsToIcons })}
        />
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

  const { note, Icon: Mark } = UPCOMING[item.upcoming];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={sideNavLink({ foldsToIcons, available: false })}>
          {named}
          <span
            className={upcomingMark({
              upcoming: item.upcoming,
              foldsToIcons,
            })}
          >
            <Mark aria-hidden="true" className="size-4" />
            <span className="sr-only">, {note}</span>
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span className={shownFolded({ foldsToIcons })}>{label} · </span>
        {note}
      </TooltipContent>
    </Tooltip>
  );
}
