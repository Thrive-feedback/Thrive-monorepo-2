import { cn } from '@/lib/cn.util';

/*
 * Plain table elements, styled — written as a composition:
 *
 *   <Table>
 *     <TableCaption>Members of Stark Industries</TableCaption>
 *     <TableHeader><TableRow><TableHead>Name</TableHead>…</TableRow></TableHeader>
 *     <TableBody><TableRow><TableCell>Tony</TableCell>…</TableRow></TableBody>
 *   </Table>
 *
 * Real `<table>` elements, so a screen reader can move by row and column and reads each cell
 * with its column's header. Use it for data with columns, never to lay out a page.
 */

export type TableProps = React.ComponentPropsWithRef<'table'>;

/** Scrolls sideways inside its own box on a narrow screen instead of widening the page. */
export function Table({ className, ...rest }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-body-2', className)}
        {...rest}
      />
    </div>
  );
}

export type TableHeaderProps = React.ComponentPropsWithRef<'thead'>;

export function TableHeader({ className, ...rest }: TableHeaderProps) {
  return (
    <thead
      data-slot="table-header"
      className={cn('border-border-muted border-b', className)}
      {...rest}
    />
  );
}

export type TableBodyProps = React.ComponentPropsWithRef<'tbody'>;

export function TableBody({ className, ...rest }: TableBodyProps) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('divide-y divide-border-subtle', className)}
      {...rest}
    />
  );
}

export type TableFooterProps = React.ComponentPropsWithRef<'tfoot'>;

/** Totals and summaries under the body. */
export function TableFooter({ className, ...rest }: TableFooterProps) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-border-muted border-t bg-surface-subtle font-medium',
        className,
      )}
      {...rest}
    />
  );
}

export type TableRowProps = React.ComponentPropsWithRef<'tr'>;

/** Set `data-state="selected"` on a row the person has chosen. */
export function TableRow({ className, ...rest }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-action-neutral-surface-hover data-[state=selected]:bg-action-primary-surface-hover',
        className,
      )}
      {...rest}
    />
  );
}

export type TableHeadProps = React.ComponentPropsWithRef<'th'>;

/** A column's header. Pass `scope="row"` instead when it heads a row. */
export function TableHead({
  className,
  scope = 'col',
  ...rest
}: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(
        'h-10 whitespace-nowrap px-3 text-start align-middle text-fg-secondary text-table-header',
        className,
      )}
      {...rest}
    />
  );
}

export type TableCellProps = React.ComponentPropsWithRef<'td'>;

export function TableCell({ className, ...rest }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn('px-3 py-2.5 align-middle', className)}
      {...rest}
    />
  );
}

export type TableCaptionProps = React.ComponentPropsWithRef<'caption'>;

/** Names the table for a screen reader, and shows under it. */
export function TableCaption({ className, ...rest }: TableCaptionProps) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-caption text-fg-secondary', className)}
      {...rest}
    />
  );
}
