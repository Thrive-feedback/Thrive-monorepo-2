'use client';

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

/** How far a card has been moved from where it hangs, in pixels. */
export type KudosBoardOffset = {
  readonly x: number;
  readonly y: number;
};

/** Where a card was left, and how recently, so the last one moved lies on top. */
export type KudosBoardPlace = KudosBoardOffset & {
  readonly order: number;
};

type KudosBoardPlaces = {
  /** The cards moved so far, by Kudos. A card with no place hangs where it was put. */
  places: ReadonlyMap<string, KudosBoardPlace>;
  /** The cards turned over to their back, by Kudos. */
  turned: ReadonlySet<string>;
  /** Nothing has been moved or turned over. */
  isTidy: boolean;
  /** Tidied just now, and nothing moved since: what a screen reader is told. */
  hasTidied: boolean;
  moveCard: (id: string, offset: KudosBoardOffset) => void;
  turnCard: (id: string) => void;
  tidyUp: () => void;
};

const NOTHING_MOVED: KudosBoardPlaces = {
  places: new Map(),
  turned: new Set(),
  isTidy: true,
  hasTidied: false,
  moveCard: () => {},
  turnCard: () => {},
  tidyUp: () => {},
};

const KudosBoardPlacesContext = createContext(NOTHING_MOVED);

export type KudosBoardPlacesProviderProps = {
  children: React.ReactNode;
};

/**
 * Where this person has moved the cards, and which they have turned over. It is theirs alone and
 * lasts as long as they stay on the board. It sits above the board, whose pages are read again for each month and each new Kudos, so
 * none of that puts a moved card back.
 */
export function KudosBoardPlacesProvider({
  children,
}: KudosBoardPlacesProviderProps) {
  const [places, setPlaces] = useState<ReadonlyMap<string, KudosBoardPlace>>(
    new Map(),
  );
  const [turned, setTurned] = useState<ReadonlySet<string>>(new Set());
  const [hasTidied, setHasTidied] = useState(false);
  const lastOrder = useRef(0);

  const moveCard = useCallback((id: string, offset: KudosBoardOffset) => {
    lastOrder.current += 1;
    const order = lastOrder.current;
    setPlaces((moved) => new Map(moved).set(id, { ...offset, order }));
    setHasTidied(false);
  }, []);

  const turnCard = useCallback((id: string) => {
    setTurned((cards) => {
      const next = new Set(cards);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
    setHasTidied(false);
  }, []);

  const tidyUp = useCallback(() => {
    setPlaces(new Map());
    setTurned(new Set());
    setHasTidied(true);
  }, []);

  const value = useMemo(
    () => ({
      places,
      turned,
      isTidy: places.size === 0 && turned.size === 0,
      hasTidied,
      moveCard,
      turnCard,
      tidyUp,
    }),
    [places, turned, hasTidied, moveCard, turnCard, tidyUp],
  );

  return (
    <KudosBoardPlacesContext value={value}>{children}</KudosBoardPlacesContext>
  );
}

export function useKudosBoardPlaces() {
  return use(KudosBoardPlacesContext);
}
