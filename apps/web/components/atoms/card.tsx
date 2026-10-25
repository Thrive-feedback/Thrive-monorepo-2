import glass from '@/components/organisms/glass.module.css';
import { cn } from '@/lib/cn.util';

export type CardProps = React.ComponentPropsWithRef<'section'> & {
  title: string;
  titleAs?: 'h1' | 'h2';
};

/**
 * A panel of the untinted frosted glass the landing page's tour stands on, edged by a hairline,
 * with its title in a divided header. The page's orbs show through it, blurred. The title's
 * heading level is the page's call: it is the `h1` when the card is the page, an `h2` under a page heading.
 */
export function Card({
  title,
  titleAs: Title = 'h1',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col rounded-page border border-border-muted shadow-med',
        glass.glass,
        glass.neutral,
        className,
      )}
      {...rest}
    >
      <header className="border-border-subtle border-b px-6 pt-6 pb-4">
        <Title className="text-center text-subtitle-2">{title}</Title>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
