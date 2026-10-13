import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';

/*
 * Written as a composition:
 *
 *   <Breadcrumb>
 *     <BreadcrumbList>
 *       <BreadcrumbItem>
 *         <BreadcrumbLink asChild><Link href="/settings">Settings</Link></BreadcrumbLink>
 *       </BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem><BreadcrumbPage>Members</BreadcrumbPage></BreadcrumbItem>
 *     </BreadcrumbList>
 *   </Breadcrumb>
 *
 * A navigation landmark named "Breadcrumb" holding an ordered list, so a screen reader says
 * how deep the page is. The last crumb is the page itself: text, not a link.
 */

export type BreadcrumbProps = React.ComponentPropsWithRef<'nav'>;

export function Breadcrumb({
  'aria-label': ariaLabel = 'Breadcrumb',
  ...rest
}: BreadcrumbProps) {
  return <nav data-slot="breadcrumb" aria-label={ariaLabel} {...rest} />;
}

export type BreadcrumbListProps = React.ComponentPropsWithRef<'ol'>;

export function BreadcrumbList({ className, ...rest }: BreadcrumbListProps) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-body-2 text-fg-secondary sm:gap-2',
        className,
      )}
      {...rest}
    />
  );
}

export type BreadcrumbItemProps = React.ComponentPropsWithRef<'li'>;

export function BreadcrumbItem({ className, ...rest }: BreadcrumbItemProps) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-1.5', className)}
      {...rest}
    />
  );
}

export type BreadcrumbLinkProps = React.ComponentPropsWithRef<'a'> & {
  /** Paint the one child — usually our `Link` — as the crumb instead of rendering an `<a>`. */
  asChild?: boolean;
};

export function BreadcrumbLink({
  asChild = false,
  className,
  ...rest
}: BreadcrumbLinkProps) {
  const Element = asChild ? Slot.Root : 'a';
  return (
    <Element
      data-slot="breadcrumb-link"
      className={cn('text-fg-secondary hover:text-fg-primary', className)}
      {...rest}
    />
  );
}

export type BreadcrumbPageProps = React.ComponentPropsWithRef<'span'>;

/** The current page: announced as such, and not a link to where the reader already is. */
export function BreadcrumbPage({ className, ...rest }: BreadcrumbPageProps) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn('font-medium text-fg-primary', className)}
      {...rest}
    />
  );
}

export type BreadcrumbSeparatorProps = React.ComponentPropsWithRef<'li'>;

/** Hidden from screen readers: the list already says where one crumb ends. */
export function BreadcrumbSeparator({
  className,
  children,
  ...rest
}: BreadcrumbSeparatorProps) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('text-fg-secondary', className)}
      {...rest}
    >
      {children ?? <ChevronRightIcon className="size-3.5" />}
    </li>
  );
}

export type BreadcrumbEllipsisProps = React.ComponentPropsWithRef<'span'>;

/** Stands in for crumbs left out of a deep trail. Put it inside a menu trigger to reveal them. */
export function BreadcrumbEllipsis({
  className,
  ...rest
}: BreadcrumbEllipsisProps) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn('flex size-6 items-center justify-center', className)}
      {...rest}
    >
      <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
