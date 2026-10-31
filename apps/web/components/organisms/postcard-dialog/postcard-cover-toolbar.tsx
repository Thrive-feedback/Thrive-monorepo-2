import { LockIcon } from 'lucide-react';
import { memo } from 'react';
import { PostcardStickerPicker } from './postcard-sticker-picker';
import { PostcardTemplatePicker } from './postcard-template-picker';
import { PostcardToolDivider } from './postcard-tool-button';

export type PostcardCoverToolbarProps = {
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  templateKey: string;
  /** How many stickers the card carries already, on both sides. */
  stickerCount: number;
  onTemplateChange: (templateKey: string) => void;
  /** Adds a sticker to the front, which is the side showing. */
  onAddSticker: (stickerKey: string) => void;
};

/**
 * The postcard's floating bar while its front is showing: a picture from the templates, and
 * stickers for the front.
 */
export function PostcardCoverToolbar({
  templateKey,
  stickerCount,
  onTemplateChange,
  onAddSticker,
}: PostcardCoverToolbarProps) {
  return (
    <>
      <PostcardTemplatePicker
        templateKey={templateKey}
        onTemplateChange={onTemplateChange}
      />
      <PostcardToolDivider />
      <PostcardStickerPicker count={stickerCount} onAddSticker={onAddSticker} />
    </>
  );
}

export type PostcardCoverNoteProps = {
  /** Whose front it is: the Requester's. */
  ownerName: string;
};

/** In place of the front's tools on an answer: the front is the Requester's, and stays as it is. */
export const PostcardCoverNote = memo(function PostcardCoverNote({
  ownerName,
}: PostcardCoverNoteProps) {
  return (
    <p className="flex min-h-11 items-center gap-2 px-3 text-body-2 text-fg-secondary">
      <LockIcon aria-hidden="true" className="size-4.5" />
      The front is {ownerName}&apos;s picture. You can look, not change it.
    </p>
  );
});
