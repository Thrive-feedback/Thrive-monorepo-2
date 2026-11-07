import { createElement } from 'react';
import glass from '@/components/organisms/glass.module.css';
import { cn } from '@/lib/cn.util';

/*
 * shadcn/ui's Card (`bunx --bun shadcn@latest add card`), its parts and their `data-slot`s kept,
 * drawn in this design system instead of shadcn's: the frosted neutral glass, the page's corner and
 * the muted edge, the medium shadow, and type from the tokens. A card is composed from its parts —
 * a header with a title and description, content, and a footer — rather than given a title, so the
 * same card can head a page or sit inside one.
 */

export type CardProps = React.ComponentPropsWithRef<'section'>;

/** A panel of frosted glass that holds one task, such as a step of registering. */
export function Card({ className, ...rest }: CardProps) {
  return (
    <section
      data-slot="card"
      className={cn(
        'flex w-full flex-col rounded-page border border-border-muted shadow-med',
        glass.glass,
        glass.neutral,
        className,
      )}
      {...rest}
    />
  );
}

export type CardHeaderProps = React.ComponentPropsWithRef<'header'>;

/**
 * The card's head: its title, a description under it, and an action at the end of the row when
 * there is one. Divided from the content by a line, and centred, as a card that holds one task
 * reads best.
 */
export function CardHeader({ className, ...rest }: CardHeaderProps) {
  return (
    <header
      data-slot="card-header"
      className={cn(
        'relative flex flex-col items-center gap-1 border-border-subtle border-b px-6 pt-6 pb-4 text-center',
        className,
      )}
      {...rest}
    />
  );
}

export type CardTitleProps = React.ComponentPropsWithRef<'h2'> & {
  /** The heading level the page gives it: `h1` when the card is the page's one task. */
  as?: 'h1' | 'h2' | 'h3' | 'div';
};

/** What the card is for, in one short heading. */
export function CardTitle({ as = 'h2', className, ...rest }: CardTitleProps) {
  return createElement(as, {
    'data-slot': 'card-title',
    className: cn('text-subtitle-2', className),
    ...rest,
  });
}

export type CardDescriptionProps = React.ComponentPropsWithRef<'p'>;

/** A muted line under the title, saying what to do here. */
export function CardDescription({ className, ...rest }: CardDescriptionProps) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-body-2 text-fg-secondary', className)}
      {...rest}
    />
  );
}

export type CardActionProps = React.ComponentPropsWithRef<'div'>;

/** One control at the top end of the header, such as a way to close the card. */
export function CardAction({ className, ...rest }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn('absolute top-4 right-4', className)}
      {...rest}
    />
  );
}

export type CardContentProps = React.ComponentPropsWithRef<'div'>;

/** What the card holds. */
export function CardContent({ className, ...rest }: CardContentProps) {
  return (
    <div data-slot="card-content" className={cn('p-6', className)} {...rest} />
  );
}

export type CardFooterProps = React.ComponentPropsWithRef<'footer'>;

/** What follows the content, such as the card's buttons, divided from it by a line. */
export function CardFooter({ className, ...rest }: CardFooterProps) {
  return (
    <footer
      data-slot="card-footer"
      className={cn(
        'flex items-center gap-3 border-border-subtle border-t px-6 pt-4 pb-6',
        className,
      )}
      {...rest}
    />
  );
}
