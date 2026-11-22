import {
  POSTCARD_TEMPLATE_PATH,
  type StoredPicture,
  storedPicture,
} from '@/lib/postcard-storage.util';

function template(file: string, alt: string): StoredPicture {
  return storedPicture(POSTCARD_TEMPLATE_PATH, file, alt);
}

/**
 * The pictures a front can show, in the order they are offered (ADR 0063). A file in the bucket
 * that is not listed here is not shown. Retire one by taking it out of this list, never by
 * deleting its file: cards saved with it still need the picture. A file's extension is not part of
 * its key, so a template can change format without losing the cards saved with it. Each is a 3:2
 * landscape PNG, as the picker shows them, at least 1800×1200, with what matters in its middle 60%
 * across: a phone crops the sides.
 */
export const POSTCARD_TEMPLATES: readonly [StoredPicture, ...StoredPicture[]] =
  [
    template('postcard_template_1.png', 'Postcard picture 1'),
    template('postcard_template_2.png', 'Postcard picture 2'),
    template('postcard_template_3.png', 'Postcard picture 3'),
    template('postcard_template_4.png', 'Postcard picture 4'),
    template('postcard_template_5.png', 'Postcard picture 5'),
    template('postcard_template_6.png', 'Postcard picture 6'),
  ];

/** The template with this key, or the first one, for a key no longer offered. */
export function postcardTemplate(key: string): StoredPicture {
  return (
    POSTCARD_TEMPLATES.find((candidate) => candidate.key === key) ??
    POSTCARD_TEMPLATES[0]
  );
}

/** A template chosen at random, for a card that has not been given one. */
export function randomTemplateKey(): string {
  const index = Math.floor(Math.random() * POSTCARD_TEMPLATES.length);
  return (POSTCARD_TEMPLATES[index] ?? POSTCARD_TEMPLATES[0]).key;
}
