import { memo } from 'react';
import { PostcardPicture } from './postcard-picture';
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

  return (
    <div className="absolute inset-2 overflow-hidden rounded-inner border border-border-muted md:inset-3">
      <PostcardPicture
        picture={template}
        alt={template.alt}
        sizes="(min-width: 48rem) 42rem, 100vw"
        fallbackClassName="p-6 text-body-3"
      />
    </div>
  );
});
