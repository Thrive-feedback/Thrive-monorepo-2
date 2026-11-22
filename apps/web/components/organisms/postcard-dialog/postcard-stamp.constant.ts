import {
  POSTCARD_STAMP_PATH,
  type StoredPicture,
  storedPicture,
} from '@/lib/postcard-storage.util';

function stamp(file: string, alt: string): StoredPicture {
  return storedPicture(POSTCARD_STAMP_PATH, file, alt);
}

/**
 * The stamps a card can carry one of, in the order they are offered (ADR 0064). A file in the bucket
 * that is not listed here is not offered. Retire one by taking it out of this list, never by
 * deleting its file: cards saved with it still need the picture. Each file is the square picture
 * alone, a 1200×1200 PNG; the paper border and the perforations are drawn around it. A card saved
 * with a stamp no longer listed, such as the first set's, shows the first one here.
 */
export const POSTCARD_STAMPS: readonly [StoredPicture, ...StoredPicture[]] = [
  stamp('postcard_stamp_1.png', 'Moonlit peak'),
  stamp('postcard_stamp_2.png', 'Sailboat'),
  stamp('postcard_stamp_3.png', 'Pagoda'),
  stamp('postcard_stamp_4.png', 'Island'),
  stamp('postcard_stamp_5.png', 'Windmill'),
  stamp('postcard_stamp_6.png', 'Fireworks'),
  stamp('postcard_stamp_7.png', 'Northern lights'),
];

/** The stamp with this key, or the first one, for a key no longer offered. */
export function postcardStamp(key: string): StoredPicture {
  return (
    POSTCARD_STAMPS.find((candidate) => candidate.key === key) ??
    POSTCARD_STAMPS[0]
  );
}
