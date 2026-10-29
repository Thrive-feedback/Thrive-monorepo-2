import { ImageIcon, LockIcon, StampIcon } from 'lucide-react';
import { memo } from 'react';
import { PostcardSoonTool, PostcardToolDivider } from './postcard-tool-button';

export type PostcardCoverToolbarProps = {
  /** Whose front it is when it cannot be changed: the Requester's, on an answer. */
  ownerName?: string;
};

/**
 * The postcard's floating bar while its front is showing: a picture from the templates, and
 * stamps. Neither works yet; each is shown where it will be. On an answer the front is the
 * Requester's and cannot be changed, and the bar says so instead. Memoised: nothing typed
 * changes it.
 */
export const PostcardCoverToolbar = memo(function PostcardCoverToolbar({
  ownerName,
}: PostcardCoverToolbarProps) {
  if (ownerName) {
    return (
      <p className="flex min-h-11 items-center gap-2 px-3 text-body-2 text-fg-secondary">
        <LockIcon aria-hidden="true" className="size-4.5" />
        The front is {ownerName}&apos;s picture. You can look, not change it.
      </p>
    );
  }

  return (
    <>
      <PostcardSoonTool soon="Templates are coming soon.">
        <ImageIcon aria-hidden="true" className="size-4.5" />
        <span className="max-sm:sr-only">Templates</span>
      </PostcardSoonTool>
      <PostcardToolDivider />
      <PostcardSoonTool soon="Stamps are coming soon.">
        <StampIcon aria-hidden="true" className="size-4.5" />
        <span className="max-sm:sr-only">Stamps </span>(0/3)
      </PostcardSoonTool>
    </>
  );
});
