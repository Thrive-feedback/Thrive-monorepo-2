'use client';

import { useId } from 'react';
import { Label } from '@/components/atoms/label';
import { Switch } from '@/components/atoms/switch';
import { useFeedbackStyle } from '@/components/organisms/feedback-style-provider';
import { cn } from '@/lib/cn.util';
import type { FeedbackStyle } from '@/lib/feedback-style/feedback-style.constant';

/** The switch's name: on is the plain style, off the postcard. */
export const PLAIN_STYLE_LABEL = 'Plain style';

export type FeedbackStyleSwitchProps = {
  /** The switch itself, so a dialog can put focus back on it. */
  ref?: React.Ref<HTMLButtonElement>;
  className?: string;
  /** The style was switched, just before the new one takes hold. */
  onChoose?: (style: FeedbackStyle) => void;
};

/**
 * The person's choice of how they write Feedback, as a switch with its label: on for the plain
 * style, off for the postcard. Reading is always a postcard. Where nobody is signed in to choose, as
 * on the landing page, it is not offered.
 */
export function FeedbackStyleSwitch({
  ref,
  className,
  onChoose,
}: FeedbackStyleSwitchProps) {
  const { style, canChoose, setStyle } = useFeedbackStyle();
  const id = useId();

  if (!canChoose) {
    return null;
  }

  function handleCheckedChange(isPlain: boolean) {
    const next: FeedbackStyle = isPlain ? 'plain' : 'postcard';
    onChoose?.(next);
    setStyle(next);
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Switch
        ref={ref}
        id={id}
        checked={style === 'plain'}
        onCheckedChange={handleCheckedChange}
      />
      <Label htmlFor={id}>{PLAIN_STYLE_LABEL}</Label>
    </div>
  );
}
