import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn.util';

export type SpinnerProps = React.ComponentPropsWithRef<'svg'>;

/**
 * Announces itself as a status named "Loading". A control that shows its own busy state,
 * such as `Button loading`, draws the icon itself instead, so the wait is not read twice.
 */
export function Spinner({ className, ...rest }: SpinnerProps) {
  const t = useTranslations('Spinner');

  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={t('label')}
      className={cn('size-4 animate-spin', className)}
      {...rest}
    />
  );
}
