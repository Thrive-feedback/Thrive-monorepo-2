import {
  POSTCARD_STICKER_PATH,
  type StoredPicture,
  storedPicture,
} from '@/lib/postcard-storage.util';

function sticker(file: string, alt: string): StoredPicture {
  return storedPicture(POSTCARD_STICKER_PATH, file, alt);
}

/**
 * The stickers a card can carry, in the order they are offered (ADR 0068). A file in the bucket
 * that is not listed here is not offered. Retire one by taking it out of this list, never by
 * deleting its file: cards saved with it still need the picture. Each file is a square cut-out on
 * a transparent ground, at least 1024×1024, drawn with no frame.
 */
export const POSTCARD_STICKERS: readonly [StoredPicture, ...StoredPicture[]] = [
  sticker('sticker-01-thumbs-up.png', 'Thumbs up'),
  sticker('sticker-02-sunshine.png', 'Sunshine'),
  sticker('sticker-03-love.png', 'Love'),
  sticker('sticker-04-party.png', 'Party'),
  sticker('sticker-05-sad.png', 'Sad'),
  sticker('sticker-06-wow.png', 'Wow'),
  sticker('sticker-07-rocket.png', 'Rocket'),
  sticker('sticker-08-flower.png', 'Flower'),
  sticker('sticker-09-star.png', 'Star'),
  sticker('sticker-10-rainbow.png', 'Rainbow'),
];

/** How many stickers one card carries, on its two sides together. */
export const MAX_STICKERS = 3;

/** The sticker with this key, or the first one, for a key no longer offered. */
export function postcardSticker(key: string): StoredPicture {
  return (
    POSTCARD_STICKERS.find((candidate) => candidate.key === key) ??
    POSTCARD_STICKERS[0]
  );
}
