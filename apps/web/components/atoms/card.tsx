import { cn } from '@/lib/cn.util';

export type CardProps = React.ComponentPropsWithRef<'section'> & {
  title: string;
  titleAs?: 'h1' | 'h2';
};

/**
 * A floating card with its title in a divided header. The title's heading level is the
 * page's call: it is the `h1` when the card is the page, an `h2` under a page heading.
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
        'flex w-full flex-col rounded-floating border border-line bg-surface-floating shadow-floating',
        className,
      )}
      {...rest}
    >
      <header className="border-line border-b px-6 pt-6 pb-4">
        <Title className="text-center text-subtitle2">{title}</Title>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
