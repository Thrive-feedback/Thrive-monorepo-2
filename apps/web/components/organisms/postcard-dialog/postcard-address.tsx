import { memo } from 'react';
import { MemberMultiPicker } from '@/components/organisms/member-multi-picker';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { PostcardFrom } from './postcard-address-read-only';
import type { PostcardWriter } from './postcard-draft.type';

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
  /** How far the line keeps clear of the stamp, which differs by the layout of the back. */
  className?: string;
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
  className,
}: PostcardAddressProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}
    >
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
