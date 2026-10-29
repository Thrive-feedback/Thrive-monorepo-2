import { memo } from 'react';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { MemberMultiPicker } from '@/components/organisms/member-multi-picker';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { PostcardWriter } from './postcard-draft.type';

export type PostcardFromProps = {
  writer: PostcardWriter;
};

/** "From", a face and a name: who wrote the half of the card it heads. */
export const PostcardFrom = memo(function PostcardFrom({
  writer,
}: PostcardFromProps) {
  return (
    <p className="flex items-center gap-2 text-body-2 text-fg-secondary">
      From
      <PhotoAvatar name={writer.name} photoUrl={writer.photoUrl} />
      <span className="text-fg-primary text-subtitle-4">{writer.name}</span>
    </p>
  );
});

export type PostcardAddressProps = {
  writer: PostcardWriter;
  /** Who can be chosen after "To": the Members of the Workspace but the writer. */
  teammates: readonly Teammate[];
  recipientAccountIds: readonly string[];
  /** What choosing means, such as "Choose who to ask": the button's name and the picker's title. */
  recipientsLabel: string;
  /** Under the picker's title: what the people chosen will do, or who always reads it. */
  recipientsDescription: string;
  onRecipientsChange: (accountIds: readonly string[]) => void;
};

/**
 * The top line of a postcard being written: who it is from, and who it is for as a stack of
 * faces ending in "+", which opens the picker. Memoised, so typing the message never redraws it.
 */
export const PostcardAddress = memo(function PostcardAddress({
  writer,
  teammates,
  recipientAccountIds,
  recipientsLabel,
  recipientsDescription,
  onRecipientsChange,
}: PostcardAddressProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <PostcardFrom writer={writer} />
      <div className="flex items-center gap-2 text-body-2 text-fg-secondary">
        {/* For the eye: the button after it names what it chooses for a screen reader. */}
        <span aria-hidden="true">To</span>
        <MemberMultiPicker
          teammates={teammates}
          value={recipientAccountIds}
          label={recipientsLabel}
          description={recipientsDescription}
          name="recipientAccountIds"
          onChange={onRecipientsChange}
        />
      </div>
    </div>
  );
});
