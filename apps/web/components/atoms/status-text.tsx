import { cn } from '@/lib/cn.util';
import { TEXT_TONE_CLASSES } from './text';

/** The colours a status word can take: done, waiting, lapsed, or simply pointed out. */
export type StatusTone = 'success' | 'warning' | 'error' | 'info';

/** Each status in the colour of the `Text` tone of the same meaning; lapsed is `danger` there. */
const STATUS_CLASSES: Readonly<Record<StatusTone, string>> = {
  success: TEXT_TONE_CLASSES.success,
  warning: TEXT_TONE_CLASSES.warning,
  error: TEXT_TONE_CLASSES.danger,
  info: TEXT_TONE_CLASSES.info,
};

export type StatusTextProps = {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
};

/**
 * Where something stands, said as a word in its colour inside the line around it, such as "2
 * answered, 1 pending", rather than as a badge beside it: a status reads as part of the sentence
 * and never outweighs the names it is about. It keeps the size of the line it sits in, takes
 * `Text`'s colour for its tone, and is set a little heavier to stand out. The word carries the
 * meaning, so nothing depends on seeing the colour.
 */
export function StatusText({ tone, children, className }: StatusTextProps) {
  return (
    <span
      data-slot="status-text"
      className={cn('font-medium', STATUS_CLASSES[tone], className)}
    >
      {children}
    </span>
  );
}
