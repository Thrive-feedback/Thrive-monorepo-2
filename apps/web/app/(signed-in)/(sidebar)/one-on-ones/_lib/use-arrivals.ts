import { useState } from 'react';

type Arriving = {
  readonly key: string;
  readonly text: string;
};

type Seen = {
  /** The keys as they stood the last time the list changed, to tell what is new. */
  readonly signature: string;
  readonly keys: ReadonlySet<string>;
  readonly texts: ReadonlySet<string>;
  readonly arriving: ReadonlySet<string>;
};

function seenOf(
  items: readonly Arriving[],
  arriving: ReadonlySet<string>,
): Seen {
  return {
    signature: items.map((item) => item.key).join('\n'),
    keys: new Set(items.map((item) => item.key)),
    texts: new Set(items.map((item) => item.text)),
    arriving,
  };
}

/**
 * Which items of a list have just arrived in it, so each can be shown arriving once. What the list
 * held when it was first drawn has not arrived; nor has an item that only took a new key with the
 * same words, as a previewed agenda does when its first change opens the meeting. An item stops
 * arriving when it says it has (`arrived`), once its motion ends.
 */
export function useArrivals(items: readonly Arriving[]): {
  isArriving: (key: string) => boolean;
  arrived: (key: string) => void;
} {
  const [seen, setSeen] = useState<Seen>(() => seenOf(items, new Set()));
  const signature = items.map((item) => item.key).join('\n');
  if (seen.signature !== signature) {
    const arriving = new Set(
      [...seen.arriving].filter((key) =>
        items.some((item) => item.key === key),
      ),
    );
    for (const item of items) {
      if (!seen.keys.has(item.key) && !seen.texts.has(item.text)) {
        arriving.add(item.key);
      }
    }
    setSeen(seenOf(items, arriving));
  }
  return {
    isArriving: (key) => seen.arriving.has(key),
    arrived: (key) =>
      setSeen((current) => {
        if (!current.arriving.has(key)) {
          return current;
        }
        const arriving = new Set(current.arriving);
        arriving.delete(key);
        return { ...current, arriving };
      }),
  };
}
