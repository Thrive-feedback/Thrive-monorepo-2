'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** Whether a list is there to answer a press: not known yet while Home's cards load. */
type ListPresence = 'unknown' | 'there' | 'none';

type DayJump = {
  /** The day the ribbon was pressed for and the list has not yet brought into view. */
  readonly requestedDay: string | null;
  readonly request: (day: string) => void;
  readonly finish: () => void;
  /** A list says it is there to answer presses, and is given how to say it has gone. */
  readonly attach: () => () => void;
  /** Home says it holds no list, so a press has nothing to bring into view. */
  readonly holdNoList: () => () => void;
};

const DayJumpContext = createContext<DayJump | null>(null);

export type HomeDayJumpProviderProps = {
  children: React.ReactNode;
};

/**
 * Between Home's ribbon of days and its list: a press of a day asks here, the list reads on until the
 * day is in, brings it into view and says it is done. Only the ribbon and the list read it, so a
 * press redraws those two and not the page around them, which reaches here as `children`.
 *
 * The ribbon can be pressed before the cards arrive, since it waits on the week alone: such a press
 * is kept, and the list answers it once it is there. A press when Home holds no list at all, as when
 * it holds nothing yet, is let go at once, so the ribbon is never left saying it is finding a day.
 */
export function HomeDayJumpProvider({ children }: HomeDayJumpProviderProps) {
  const [requestedDay, setRequestedDay] = useState<string | null>(null);
  const [presence, setPresence] = useState<ListPresence>('unknown');
  // Never new functions, so the list can let go of a press as it leaves without letting go of it
  // every time a press is made.
  const finish = useCallback(() => setRequestedDay(null), []);
  // A list that leaves lets go of a press it had not finished, but only once it is truly gone:
  // Strict Mode in development takes a new list down and puts it straight back in one commit, and
  // a press must live through that.
  const listLeft = useRef(false);
  const attach = useCallback(() => {
    listLeft.current = false;
    setPresence('there');
    return () => {
      listLeft.current = true;
      setPresence('unknown');
    };
  }, []);
  useEffect(() => {
    if (presence === 'unknown' && listLeft.current) {
      listLeft.current = false;
      setRequestedDay(null);
    }
  }, [presence]);
  const holdNoList = useCallback(() => {
    setPresence('none');
    setRequestedDay(null);
    return () => setPresence('unknown');
  }, []);
  const value = useMemo(
    () => ({
      requestedDay,
      request: (day: string) => {
        if (presence !== 'none') {
          setRequestedDay(day);
        }
      },
      finish,
      attach,
      holdNoList,
    }),
    [requestedDay, presence, finish, attach, holdNoList],
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

/** Drawn where Home holds no list, so a press of a day, kept or to come, is let go. */
export function NoDayList() {
  const { holdNoList } = useDayJump();
  useEffect(() => holdNoList(), [holdNoList]);
  return null;
}
