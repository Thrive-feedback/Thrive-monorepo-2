'use client';

import { createContext, use, useCallback, useMemo, useState } from 'react';

type AnsweredAsks = {
  /** The Asks answered since this page opened. */
  answered: ReadonlySet<string>;
  markAnswered: (askId: string) => void;
};

const NOBODY_ANSWERED: AnsweredAsks = {
  answered: new Set(),
  markAnswered: () => {},
};

const AnsweredAsksContext = createContext(NOBODY_ANSWERED);

export type AnsweredAsksProviderProps = {
  children: React.ReactNode;
};

/**
 * Tells the list which Asks the postcard has answered. The list holds every page it has read, so
 * reading the first page again would not take away an answered card further down, and starting
 * the list again would lose the person's place.
 */
export function AnsweredAsksProvider({ children }: AnsweredAsksProviderProps) {
  const [answered, setAnswered] = useState<ReadonlySet<string>>(new Set());
  const markAnswered = useCallback((askId: string) => {
    setAnswered((asks) => new Set(asks).add(askId));
  }, []);
  const value = useMemo(
    () => ({ answered, markAnswered }),
    [answered, markAnswered],
  );

  return <AnsweredAsksContext value={value}>{children}</AnsweredAsksContext>;
}

export function useAnsweredAsks() {
  return use(AnsweredAsksContext);
}
