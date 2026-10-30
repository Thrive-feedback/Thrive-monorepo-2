import {
  POSTCARD_STAMP_PATH,
  type StoredPicture,
  storedPicture,
} from '@/lib/postcard-storage.util';

function stamp(file: string, alt: string): StoredPicture {
  return storedPicture(POSTCARD_STAMP_PATH, file, alt);
}

/**
 * The stamps a card can carry, in the order they are offered (ADR 0064). A file in the bucket
 * that is not listed here is not offered. Retire one by taking it out of this list, never by
 * deleting its file: cards saved with it still need the picture. Each file is the square picture
 * alone; the paper border and the perforations are drawn around it.
 */
export const POSTCARD_STAMPS: readonly [StoredPicture, ...StoredPicture[]] = [
  stamp('stamp-01-mountains.png', 'Mountains'),
  stamp('stamp-02-ocean.png', 'Ocean'),
  stamp('stamp-03-night.png', 'Night'),
  stamp('stamp-04-botanical.png', 'Botanical'),
  stamp('stamp-05-balloon.png', 'Balloon'),
];

/** How many stamps one card carries, on its two sides together. */
export const MAX_STAMPS = 3;

/** The stamp with this key, or the first one, for a key no longer offered. */
export function postcardStamp(key: string): StoredPicture {
  return (
    POSTCARD_STAMPS.find((candidate) => candidate.key === key) ??
    POSTCARD_STAMPS[0]
  );
}
