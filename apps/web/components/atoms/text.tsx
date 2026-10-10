import { cva, type VariantProps } from 'class-variance-authority';
import { createElement } from 'react';
import { cn } from '@/lib/cn.util';

const text = cva('', {
  variants: {
    variant: {
      'display-1': 'font-display text-display-1',
      'display-2': 'font-display text-display-2',
      'display-3': 'font-display text-display-3',
      'display-4': 'font-display text-display-4',
      'display-5': 'font-display text-display-5',
      'display-6': 'font-display text-display-6',
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      h4: 'text-h4',
      h5: 'text-h5',
      h6: 'text-h6',
      'subtitle-1': 'text-subtitle-1',
      'subtitle-2': 'text-subtitle-2',
      'subtitle-3': 'text-subtitle-3',
      'subtitle-4': 'text-subtitle-4',
      'subtitle-display-1': 'font-display text-subtitle-display-1',
      'subtitle-display-2': 'font-display text-subtitle-display-2',
      'subtitle-display-3': 'font-display text-subtitle-display-3',
      'subtitle-display-4': 'font-display text-subtitle-display-4',
      'subtitle-handwrite-1': 'font-handwrite text-subtitle-handwrite-1',
      'subtitle-handwrite-2': 'font-handwrite text-subtitle-handwrite-2',
      'subtitle-handwrite-3': 'font-handwrite text-subtitle-handwrite-3',
      'subtitle-handwrite-4': 'font-handwrite text-subtitle-handwrite-4',
      'body-1': 'text-body-1',
      'body-2': 'text-body-2',
      'body-3': 'text-body-3',
      quote: 'font-display text-quote',
      code: 'font-mono text-code',
      label: 'text-label',
      caption: 'text-caption',
      overline: 'text-overline uppercase',
    },
    tone: {
      default: '',
      muted: 'text-fg-secondary',
      brand: 'text-fg-accent',
      danger: 'text-status-error-fg',
      success: 'text-status-success-fg',
      info: 'text-status-info-fg',
      warning: 'text-status-warning-fg',
    },
  },
  defaultVariants: { variant: 'body-1', tone: 'default' },
});

export type TextVariant = NonNullable<VariantProps<typeof text>['variant']>;

export type TextElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'strong'
  | 'small'
  | 'label'
  | 'legend'
  | 'figcaption';

const DEFAULT_ELEMENT: Record<TextVariant, TextElement> = {
  'display-1': 'h1',
  'display-2': 'h2',
  'display-3': 'h3',
  'display-4': 'h4',
  'display-5': 'h5',
  'display-6': 'h6',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  'subtitle-1': 'p',
  'subtitle-2': 'p',
  'subtitle-3': 'p',
  'subtitle-4': 'p',
  'subtitle-display-1': 'p',
  'subtitle-display-2': 'p',
  'subtitle-display-3': 'p',
  'subtitle-display-4': 'p',
  'subtitle-handwrite-1': 'p',
  'subtitle-handwrite-2': 'p',
  'subtitle-handwrite-3': 'p',
  'subtitle-handwrite-4': 'p',
  'body-1': 'p',
  'body-2': 'p',
  'body-3': 'p',
  quote: 'p',
  code: 'span',
  label: 'span',
  caption: 'span',
  overline: 'span',
};

export type TextProps<E extends TextElement = TextElement> = {
  as?: E;
} & VariantProps<typeof text> &
  Omit<React.ComponentPropsWithRef<E>, 'as'>;

/**
 * One of the design's text styles, on the element the content means. `variant` is how it
 * looks and `as` is what it is, so a card title can look like `h6` and still be the page's
 * `h2` — the heading outline follows the page, not the type scale. Without `as`, a heading
 * style renders its own level and everything else a `<p>` or `<span>`.
 *
 * Each style is set in the face the blueprint gives its role: display, subtitle-display and quote
 * in the display face, subtitle-handwrite in the handwrite face, code in mono, the rest in the
 * main face. A Tailwind type utility cannot carry a family, so the variant pairs the two.
 */
export function Text<E extends TextElement = TextElement>({
  as,
  variant = 'body-1',
  tone,
  className,
  ...rest
}: TextProps<E>) {
  // `createElement` takes the tag as a value, so one call serves every element `as` allows;
  // `TextProps<E>` has already checked the props against the element the caller chose.
  return createElement(as ?? DEFAULT_ELEMENT[variant ?? 'body-1'], {
    'data-slot': 'text',
    className: cn(text({ variant, tone }), className),
    ...rest,
  });
}
