import { StampIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import { PostcardPicture } from './postcard-picture';
import { MAX_STAMPS, POSTCARD_STAMPS } from './postcard-stamp.constant';
import { PostcardToolButton } from './postcard-tool-button';
import { usePostcardDrawerContainer } from './use-postcard-drawer-container';

export type PostcardStampPickerProps = {
  /** How many stamps the card carries already, on both sides. */
  count: number;
  onAddStamp: (stampKey: string) => void;
};

/**
 * Stamps, on either side's bar, with how many the card carries: a drawer of every stamp to add to
 * the side showing, which behaves as Templates does. A stamp pressed goes on the card and the
 * drawer closes, so it can be placed at once. A press anywhere outside it puts it away, and since
 * it does not hold the page, that same press reaches the card: pressing a stamp to move it closes
 * the drawer and starts the move. With three on the card, no more can be added until one comes
 * off.
 */
export function PostcardStampPicker({
  count,
  onAddStamp,
}: PostcardStampPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = usePostcardDrawerContainer();
  const isFull = count >= MAX_STAMPS;

  function handleAdd(stampKey: string) {
    if (isFull) {
      return;
    }
    onAddStamp(stampKey);
    setIsOpen(false);
  }

  return (
    <Drawer modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <PostcardToolButton data-stamps-tool>
          <StampIcon aria-hidden="true" className="size-4.5" />
          <span className="max-sm:sr-only">Stamps </span>({count}/{MAX_STAMPS})
        </PostcardToolButton>
      </DrawerTrigger>
      <DrawerContent container={container} data-stamp-panel>
        <DrawerHeader>
          <DrawerTitle>Stamps</DrawerTitle>
          <DrawerDescription>
            Up to three on your card, on either side. A stamp goes on the side
            showing; drag it where you like.
          </DrawerDescription>
        </DrawerHeader>
        <ul className="grid grid-cols-3 gap-3">
          {POSTCARD_STAMPS.map((stamp) => (
            <li key={stamp.key}>
              {/* Not `disabled` when full: the one just pressed keeps the cursor rather than
                  dropping it on the page. */}
              <button
                type="button"
                aria-label={`Add the ${stamp.alt} stamp`}
                aria-disabled={isFull}
                onClick={() => handleAdd(stamp.key)}
                className="block w-full cursor-pointer rounded-element p-1 hover:bg-action-neutral-surface-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"
              >
                <span className={cn('block', styles.stampLift)}>
                  <span className={cn('block aspect-square', styles.stamp)}>
                    <span className="relative block size-full overflow-hidden border border-border-strong">
                      <PostcardPicture
                        picture={stamp}
                        alt=""
                        sizes="6rem"
                        fallbackClassName="p-1 text-tag"
                      />
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="text-body-3 text-fg-secondary">
          {isFull ? 'Three is the most. Take one off to add another.' : ''}
        </p>
      </DrawerContent>
    </Drawer>
  );
}
