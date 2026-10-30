import { LockIcon } from 'lucide-react';
import { memo } from 'react';
import {
  PostcardTemplatePicker,
  type PostcardTemplatePickerProps,
} from './postcard-template-picker';
import {
  PostcardStampsTool,
  PostcardToolDivider,
} from './postcard-tool-button';

export type PostcardCoverToolbarProps = PostcardTemplatePickerProps;

/**
 * The postcard's floating bar while its front is showing: a picture from the templates, and
 * stamps, which do not work yet and are shown where they will be. Memoised: nothing typed
 * changes it.
 */
export const PostcardCoverToolbar = memo(function PostcardCoverToolbar({
  templateKey,
  onTemplateChange,
}: PostcardCoverToolbarProps) {
  return (
    <>
      <PostcardTemplatePicker
        templateKey={templateKey}
        onTemplateChange={onTemplateChange}
      />
      <PostcardToolDivider />
      <PostcardStampsTool />
    </>
  );
});

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
