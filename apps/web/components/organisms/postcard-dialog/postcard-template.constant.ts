import {
  POSTCARD_TEMPLATE_PATH,
  postcardTemplateHost,
} from '@/lib/postcard-template-origin.util';

/** One picture the front can show. */
export type PostcardTemplate = {
  /** Its path under the bucket; what a saved card will name, so never reused for another. */
  readonly key: string;
  readonly src: string;
  /** What the picture shows, said in its place: the file's name says nothing about it. */
  readonly alt: string;
};

function template(file: string, alt: string): PostcardTemplate {
  return {
    key: `system/${file.replace(/\.[a-z]+$/, '')}`,
    src: `https://${postcardTemplateHost()}${POSTCARD_TEMPLATE_PATH}${file}`,
    alt,
  };
}

/**
 * The pictures a front can show, in the order they are offered (ADR 0063). A file in the bucket
 * that is not listed here is not shown. Retire one by taking it out of this list, never by
 * deleting its file: cards saved with it still need the picture. Each is a 4:3 landscape, at
 * least 1500×1125, with what matters in its middle 60% across: a phone crops the sides.
 */
export const POSTCARD_TEMPLATES: readonly [
  PostcardTemplate,
  ...PostcardTemplate[],
] = [
  template('postcard_template_1.jpg', 'Postcard picture 1'),
  template('postcard_template_2.jpg', 'Postcard picture 2'),
  template('postcard_template_3.jpg', 'Postcard picture 3'),
  template('postcard_template_4.jpg', 'Postcard picture 4'),
];

/** The template with this key, or the first one, for a key no longer offered. */
export function postcardTemplate(key: string): PostcardTemplate {
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
