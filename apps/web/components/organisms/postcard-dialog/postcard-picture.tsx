import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn.util';
import type { StoredPicture } from '@/lib/postcard-storage.util';

export type PostcardPictureProps = {
  picture: StoredPicture;
  /** What is heard for it: its name, or nothing where the control around it is named already. */
  alt: string;
  /** How wide it is drawn, for `next/image` to fetch no larger. */
  sizes: string;
  /** How the name looks in its place when the picture will not load. */
  fallbackClassName?: string;
};

/**
 * A template or a stamp, cropped to fill the box it is in. A picture that will not load leaves
 * its name in its place, so nothing on the card or in a drawer is an empty square.
 */
export function PostcardPicture({
  picture,
  alt,
  sizes,
  fallbackClassName,
}: PostcardPictureProps) {
  // The picture that failed, not a flag, so one shown again later tries again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === picture.src) {
    return (
      <span
        className={cn(
          'flex size-full items-center justify-center text-center text-fg-secondary',
          fallbackClassName,
        )}
      >
        {picture.alt}
      </span>
    );
  }
  return (
    <Image
      src={picture.src}
      alt={alt}
      fill
      sizes={sizes}
      draggable={false}
      className="object-cover"
      onError={() => setFailedSrc(picture.src)}
    />
  );
}
