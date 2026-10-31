import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import {
  DEFAULT_SIZE_STEP,
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
  POSTCARD_INKS,
  POSTCARD_SIZES,
  type PostcardTextStyle,
} from './postcard-style.constant';

/**
 * The classes that set a message in its chosen font, size and alignment. A size step the scale
 * does not have, as a caller's Ask might carry, falls back to the usual size.
 */
export function metricsClassName(
  textStyle: Pick<PostcardTextStyle, 'font' | 'sizeStep' | 'align'>,
) {
  return cn(
    styles.sized,
    (POSTCARD_SIZES[textStyle.sizeStep] ?? POSTCARD_SIZES[DEFAULT_SIZE_STEP])
      ?.className,
    POSTCARD_FONTS[textStyle.font].className,
    POSTCARD_ALIGNS[textStyle.align],
  );
}

/** The classes that set a message as its writer chose: all of the above, in their chosen ink. */
export function messageClassName(textStyle: PostcardTextStyle) {
  return cn(
    metricsClassName(textStyle),
    POSTCARD_INKS[textStyle.ink].textClassName,
  );
}
