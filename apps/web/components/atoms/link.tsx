import { cva, type VariantProps } from 'class-variance-authority';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn.util';

const link = cva('rounded-control font-medium text-link underline-offset-4', {
  variants: {
    underline: {
      hover: 'hover:underline',
      always: 'underline',
    },
  },
  defaultVariants: { underline: 'hover' },
});

export type LinkProps = React.ComponentPropsWithRef<typeof NextLink> &
  VariantProps<typeof link> & {
    external?: boolean;
  };

/**
 * Text that navigates. Inside the app it is Next's client-side `Link`; `external` opens a new
 * tab, sets `rel` so the other site gets no handle on this one, and tells a screen reader the
 * tab will open, because a silent new tab strands people who cannot see it happen.
 *
 * For a link that should look like an action, use `<Button asChild>` around a Next `Link`.
 */
export function Link({
  underline,
  external = false,
  className,
  children,
  ...rest
}: LinkProps) {
  const t = useTranslations('Link');

  return (
    <NextLink
      data-slot="link"
      className={cn(link({ underline }), className)}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...rest}
    >
      {children}
      {external && <span className="sr-only"> {t('opensInNewTab')}</span>}
    </NextLink>
  );
}
