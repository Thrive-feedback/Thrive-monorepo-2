import Image from 'next/image';
import { useTranslations } from 'next-intl';

/**
 * The black wordmark, exported unchanged from the design's logo page. It is a file rather than
 * a token-coloured SVG because a logotype is artwork: its colour is part of the mark.
 */
export function Logo() {
  const t = useTranslations('Logo');

  return (
    <Image
      src="/brand/thrive-logo.svg"
      alt={t('alt')}
      width={80}
      height={24}
      className="h-6 w-20"
      priority
    />
  );
}
