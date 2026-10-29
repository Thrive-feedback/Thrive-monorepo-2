import styles from './postcard.module.css';

/** The paper the postcard is printed on. Each is a warm tint of the theme's raised surface. */
/** The tones in the order they are offered. */
export const PAPER_TONE_KEYS = ['cream', 'sage', 'blush'] as const;

export type PaperTone = (typeof PAPER_TONE_KEYS)[number];

export const PAPER_TONES: Readonly<
  Record<PaperTone, { label: string; className: string | undefined }>
> = {
  cream: { label: 'Cream', className: styles.cream },
  sage: { label: 'Soft Sage', className: styles.sage },
  blush: { label: 'Warm Blush', className: styles.blush },
};

export const POSTCARD_FONT_KEYS = ['modern', 'classic', 'signature'] as const;

export type PostcardFont = (typeof POSTCARD_FONT_KEYS)[number];

export const POSTCARD_FONTS: Readonly<
  Record<PostcardFont, { label: string; note: string; className: string }>
> = {
  modern: {
    label: 'Modern',
    note: 'Clean and friendly',
    className: 'font-main',
  },
  classic: {
    label: 'Classic',
    note: 'Like a letter',
    className: 'font-display',
  },
  signature: {
    label: 'Signature',
    note: 'Handwritten',
    className: 'font-handwrite',
  },
};

/**
 * The sizes the message steps through: the type scale's own, smallest first. `px` is the size on
 * a phone, which the label shows; wider screens set some a step larger.
 */
export const POSTCARD_SIZES: readonly {
  px: number;
  className: string | undefined;
}[] = [
  { px: 13, className: styles.size13 },
  { px: 16, className: styles.size16 },
  { px: 19, className: styles.size19 },
  { px: 23, className: styles.size23 },
  { px: 28, className: styles.size28 },
];

/** Where the message starts: 19 px, a size that reads as handwriting rather than as a form. */
export const DEFAULT_SIZE_STEP = 2;

export const POSTCARD_ALIGN_KEYS = ['left', 'center', 'right'] as const;

export type PostcardAlign = (typeof POSTCARD_ALIGN_KEYS)[number];

export const POSTCARD_ALIGNS: Readonly<Record<PostcardAlign, string>> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const POSTCARD_INK_KEYS = [
  'ink',
  'navy',
  'forest',
  'plum',
  'brick',
] as const;

export type PostcardInk = (typeof POSTCARD_INK_KEYS)[number];

/**
 * Five inks in five clearly different hues: the body ink, then each status colour at its deepest
 * step, which stays readable on the light papers and turns to a light tint on the dark ones.
 */
export const POSTCARD_INKS: Readonly<
  Record<
    PostcardInk,
    { label: string; textClassName: string; swatchClassName: string }
  >
> = {
  ink: {
    label: 'Ink',
    textClassName: 'text-fg-primary',
    swatchClassName: 'bg-fg-primary',
  },
  navy: {
    label: 'Navy',
    textClassName: 'text-status-info-active',
    swatchClassName: 'bg-status-info-active',
  },
  forest: {
    label: 'Forest',
    textClassName: 'text-status-success-active',
    swatchClassName: 'bg-status-success-active',
  },
  plum: {
    label: 'Plum',
    textClassName: 'text-fg-accent',
    swatchClassName: 'bg-fg-accent',
  },
  brick: {
    label: 'Brick',
    textClassName: 'text-status-error-active',
    swatchClassName: 'bg-status-error-active',
  },
};

/** How the message is set: how it looks, not what it says. */
export type PostcardTextStyle = {
  font: PostcardFont;
  sizeStep: number;
  align: PostcardAlign;
  ink: PostcardInk;
};

export const DEFAULT_TEXT_STYLE: PostcardTextStyle = {
  font: 'modern',
  sizeStep: DEFAULT_SIZE_STEP,
  align: 'left',
  ink: 'ink',
};
