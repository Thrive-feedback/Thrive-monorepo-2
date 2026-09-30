import Image from 'next/image';

/**
 * The black wordmark, exported unchanged from the design's logo page. It is a file rather than
 * a token-coloured SVG because a logotype is artwork: its colour is part of the mark.
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
