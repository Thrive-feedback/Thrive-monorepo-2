import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { POSTCARD_TEMPLATES } from '@/components/organisms/postcard-dialog/postcard-template.constant';

/** How a card looks when what it holds was not written on a postcard. */
export const PLAIN_POSTCARD = {
  templateKey: POSTCARD_TEMPLATES[0].key,
  tone: 'cream',
  textStyle: DEFAULT_TEXT_STYLE,
  stickers: [],
  stampKey: null,
} as const;
