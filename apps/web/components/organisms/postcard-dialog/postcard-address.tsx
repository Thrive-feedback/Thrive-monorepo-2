import { memo } from 'react';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { MemberMultiPicker } from '@/components/organisms/member-multi-picker';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { PostcardWriter } from './postcard-draft.type';

export type PostcardAddressProps = {
  writer: PostcardWriter;
  /** Who can be chosen after "To": the Members of the Workspace but the writer. */
  teammates: readonly Teammate[];
  recipientAccountIds: readonly string[];
  onRecipientsChange: (accountIds: readonly string[]) => void;
};

/**
 * The top line of the postcard's back: who it is from, and who it is for as a stack of faces
 * ending in "+", which opens the picker. Memoised, so typing the message never redraws it.
 */
export const PostcardAddress = memo(function PostcardAddress({
  writer,
  teammates,
  recipientAccountIds,
  onRecipientsChange,
}: PostcardAddressProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <p className="flex items-center gap-2 text-body-2 text-fg-secondary">
        From
        <PhotoAvatar
          name={writer.name}
          photoUrl={writer.photoUrl}
          className="size-7"
        />
        <span className="text-fg-primary text-subtitle-4">{writer.name}</span>
      </p>
      <div className="flex items-center gap-2 text-body-2 text-fg-secondary">
        {/* For the eye: the button after it names what it chooses for a screen reader. */}
        <span aria-hidden="true">To</span>
        <MemberMultiPicker
          teammates={teammates}
          value={recipientAccountIds}
          label="Choose who it's for"
          description="They can always read it."
          name="recipientAccountIds"
          onChange={onRecipientsChange}
        />
      </div>
    </div>
  );
});
