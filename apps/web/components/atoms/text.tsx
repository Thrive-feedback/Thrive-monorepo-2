import { cva, type VariantProps } from 'class-variance-authority';
import { createElement } from 'react';
import { cn } from '@/lib/cn.util';

const text = cva('', {
  variants: {
    variant: {
      display1: 'font-display text-display1',
      display2: 'font-display text-display2',
      display3: 'font-display text-display3',
      display4: 'font-display text-display4',
      display5: 'font-display text-display5',
      display6: 'font-display text-display6',
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      h4: 'text-h4',
      h5: 'text-h5',
      h6: 'text-h6',
      subtitle1: 'text-subtitle1',
      subtitle2: 'text-subtitle2',
      subtitle3: 'text-subtitle3',
      subtitle4: 'text-subtitle4',
      body1: 'text-body1',
      body2: 'text-body2',
      body3: 'text-body3',
      caption: 'text-caption',
      overline: 'text-overline uppercase',
    },
    tone: {
      default: '',
      muted: 'text-foreground-muted',
      brand: 'text-brand',
      danger: 'text-danger',
    },
  },
  defaultVariants: { variant: 'body1', tone: 'default' },
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
  display1: 'h1',
  display2: 'h2',
  display3: 'h3',
  display4: 'h4',
  display5: 'h5',
  display6: 'h6',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'p',
  subtitle2: 'p',
  subtitle3: 'p',
  subtitle4: 'p',
  body1: 'p',
  body2: 'p',
  body3: 'p',
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
 * `display*` styles are set in the display face; every other style in the body face.
 */
export function Text<E extends TextElement = TextElement>({
  as,
  variant = 'body1',
  tone,
  className,
  ...rest
}: TextProps<E>) {
  // `createElement` takes the tag as a value, so one call serves every element `as` allows;
  // `TextProps<E>` has already checked the props against the element the caller chose.
  return createElement(as ?? DEFAULT_ELEMENT[variant ?? 'body1'], {
    'data-slot': 'text',
    className: cn(text({ variant, tone }), className),
    ...rest,
  });
}
