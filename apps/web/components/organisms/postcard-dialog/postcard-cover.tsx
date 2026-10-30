import Image from 'next/image';
import { memo, useState } from 'react';
import { postcardTemplate } from './postcard-template.constant';

export type PostcardCoverProps = {
  /** Which picture: a key from `POSTCARD_TEMPLATES`. */
  templateKey: string;
};

/**
 * The front of the postcard: a picture framed by the card's own paper, as on a real postcard,
 * cropped to fill the frame. A picture that will not load leaves the paper, with what it would
 * have shown said in its place, so the card can still be written and sent.
 */
export const PostcardCover = memo(function PostcardCover({
  templateKey,
}: PostcardCoverProps) {
  const template = postcardTemplate(templateKey);
  // The picture that failed, not a flag, so choosing another tries again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div className="absolute inset-2 overflow-hidden rounded-inner border border-border-muted md:inset-3">
      {failedSrc === template.src ? (
        <p className="flex size-full items-center justify-center p-6 text-center text-body-3 text-fg-secondary">
          {template.alt}
        </p>
      ) : (
        <Image
          src={template.src}
          alt={template.alt}
          fill
          sizes="(min-width: 48rem) 42rem, 100vw"
          className="object-cover"
          onError={() => setFailedSrc(template.src)}
        />
      )}
    </div>
  );
});
