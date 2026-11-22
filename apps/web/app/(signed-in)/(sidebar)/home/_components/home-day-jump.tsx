'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type DayJump = {
  /** The day the ribbon was pressed for and the list has not yet brought into view. */
  readonly requestedDay: string | null;
  readonly request: (day: string) => void;
  readonly finish: () => void;
};

const DayJumpContext = createContext<DayJump | null>(null);

/**
 * Between Home's ribbon of days and its list: a press of a day asks here, the list reads on until the
 * day is in, brings it into view and says it is done. Only the ribbon and the list read it, so a
 * press redraws those two and not the page around them, which reaches here as `children`.
 */
export function HomeDayJumpProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [requestedDay, setRequestedDay] = useState<string | null>(null);
  // Never a new function, so the list can let go of a press as it leaves without letting go of it
  // every time a press is made.
  const finish = useCallback(() => setRequestedDay(null), []);
  const value = useMemo(
    () => ({ requestedDay, request: setRequestedDay, finish }),
    [requestedDay, finish],
  );
  return <DayJumpContext value={value}>{children}</DayJumpContext>;
}

export function useDayJump(): DayJump {
  const jump = useContext(DayJumpContext);
  if (!jump) {
    throw new Error('useDayJump is used inside HomeDayJumpProvider.');
  }
  return jump;
}
