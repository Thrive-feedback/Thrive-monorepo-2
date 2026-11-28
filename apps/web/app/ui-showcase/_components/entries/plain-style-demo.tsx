'use client';

import { FeedbackStyleProvider } from '@/components/organisms/feedback-style-provider';

/**
 * Draws what it holds in the plain style, whatever the person chose, so a cell can show it. Its
 * switch still keeps a choice made in it, as the real one does.
 */
export function PlainStyleDemo({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackStyleProvider initialStyle="plain">
      {children}
    </FeedbackStyleProvider>
  );
}
