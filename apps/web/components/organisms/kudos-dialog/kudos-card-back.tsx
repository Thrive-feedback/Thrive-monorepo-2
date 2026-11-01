import { Logo } from '@/components/atoms/logo';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './kudos-card.module.css';

export type KudosCardBackProps = {
  /** As `kudosCardDate` writes it: the day it is being written, or the day it was given. */
  date: string;
};

/**
 * The back of a Kudos card, the same on every template: the wordmark and the date, and nothing can
 * be stuck on it.
 */
export function KudosCardBack({ date }: KudosCardBackProps) {
  return (
    <div className={cn('relative aspect-3/4 w-full', styles.card)}>
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden',
          styles.face,
          styles.back,
          styles.writing,
        )}
      >
        <Logo className="h-12 w-40" />
        <Text as="p" variant="subtitle-2" tone="muted">
          {date}
        </Text>
      </div>
    </div>
  );
}
