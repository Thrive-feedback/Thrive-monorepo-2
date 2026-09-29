import Image from 'next/image';

/**
 * The wordmark keeps the design's lighter brand shade, baked into the SVG. Contrast minimums
 * do not apply to a logotype, which is why brand-coloured text uses a darker shade than this.
 */
export function Logo() {
  return (
    <Image
      src="/brand/thrive-logo.svg"
      alt="Thrive"
      width={80}
      height={24}
      className="h-6 w-20"
      priority
    />
  );
}
