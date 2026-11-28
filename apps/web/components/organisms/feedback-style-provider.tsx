'use client';

import { createContext, use, useCallback, useMemo, useState } from 'react';
import {
  DEFAULT_FEEDBACK_STYLE,
  type FeedbackStyle,
} from '@/lib/feedback-style/feedback-style.constant';
import { keepFeedbackStyle } from '@/lib/feedback-style/feedback-style-cookie.util';

type FeedbackStyleValue = {
  style: FeedbackStyle;
  /** Whether there is someone here to choose: not outside the signed-in pages. */
  canChoose: boolean;
  setStyle: (next: FeedbackStyle) => void;
};

const FeedbackStyleContext = createContext<FeedbackStyleValue | null>(null);

export type FeedbackStyleProviderProps = {
  /** The style the server read from the cookie, so the first paint already shows it. */
  initialStyle: FeedbackStyle;
  children: React.ReactNode;
};

/**
 * The look this person chose for Feedback, for every card under it. A change shows at once,
 * everywhere, and is kept in a cookie behind it; if keeping it fails, the new look still holds until
 * the page is left.
 */
export function FeedbackStyleProvider({
  initialStyle,
  children,
}: FeedbackStyleProviderProps) {
  const [style, setLocalStyle] = useState(initialStyle);

  const setStyle = useCallback((next: FeedbackStyle) => {
    setLocalStyle(next);
    keepFeedbackStyle(next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ style, canChoose: true, setStyle }),
    [style, setStyle],
  );

  return <FeedbackStyleContext value={value}>{children}</FeedbackStyleContext>;
}

/** Outside a provider, as on the landing page, there is nobody to choose: the default holds. */
const UNCHOSEN: FeedbackStyleValue = {
  style: DEFAULT_FEEDBACK_STYLE,
  canChoose: false,
  setStyle: () => {},
};

/** The look Feedback is drawn in here, and a way to change it. */
export function useFeedbackStyle(): FeedbackStyleValue {
  return use(FeedbackStyleContext) ?? UNCHOSEN;
}
